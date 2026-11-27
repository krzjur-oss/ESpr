import { IDBFactory } from 'fake-indexeddb';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from '../../types/reports';
import { createDocumentByType, createInitialAppState } from '../documentFactory';
import {
  MAX_IMPORT_FILE_BYTES,
  MAX_ZIP_ENTRIES,
  validateImportFileMetadata,
} from '../importLimits';
import {
  getBackupReminderMeta,
  loadAppState,
  readIndexedDbStateOnly,
  resetStorageRuntimeForTests,
  saveAppStateImmediate,
  validateAndParseImportedJson,
} from '../storage';
import {
  FULL_BACKUP_ZIP_ENTRY,
  buildBackupZipBytes,
  buildBackupZipWithStats,
  exportStateAsZip,
  extractBackupJsonFromZip,
  readValidatedBackupFileForImport,
} from '../zipBackup';

function createRichTestState(): AppState {
  const base = createInitialAppState();
  const extraDoc = createDocumentByType('karta_informacyjna', base.profile);
  extraDoc.title = 'Karta informacyjna · Informatyka';
  return {
    ...base,
    profile: {
      ...base.profile,
      fullName: 'Anna Kowalska',
      schoolName: 'SP nr 5 w Łodzi',
    },
    documents: [...base.documents, extraDoc],
    customWnioski: [
      {
        id: 'wniosek-1',
        categoryId: 'wlasne',
        text: 'Kontynuować ćwiczenia rachunkowe.',
        createdAt: '2026-11-26T10:00:00.000Z',
      },
    ],
    customTemplates: [
      {
        id: 'tpl-1',
        title: 'Mój szablon',
        category: 'ogolne',
        content: 'Przykładowa treść szablonu.',
        createdAt: '2026-11-26T10:00:00.000Z',
      },
    ],
    supervisionClassNotes: {
      '2026/2027::I::4A': 'Uwagi klasy 4A',
    },
  };
}

function readU16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function readU32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) |
      ((bytes[offset + 1] ?? 0) << 8) |
      ((bytes[offset + 2] ?? 0) << 16) |
      ((bytes[offset + 3] ?? 0) << 24)) >>>
    0
  );
}

function writeU16(bytes: Uint8Array, offset: number, val: number): void {
  bytes[offset] = val & 0xff;
  bytes[offset + 1] = (val >>> 8) & 0xff;
}

function writeU32(bytes: Uint8Array, offset: number, val: number): void {
  bytes[offset] = val & 0xff;
  bytes[offset + 1] = (val >>> 8) & 0xff;
  bytes[offset + 2] = (val >>> 16) & 0xff;
  bytes[offset + 3] = (val >>> 24) & 0xff;
}

function buildZipWithDuplicateEntries(entryName: string, content1: string, content2: string): Uint8Array {
  const z1 = zipSync({ [entryName]: strToU8(content1) }, { level: 0 });
  const z2 = zipSync({ [entryName]: strToU8(content2) }, { level: 0 });

  const eocd1 = z1.length - 22;
  const cdOff1 = readU32(z1, eocd1 + 16);
  const cdSize1 = readU32(z1, eocd1 + 12);

  const eocd2 = z2.length - 22;
  const cdOff2 = readU32(z2, eocd2 + 16);
  const cdSize2 = readU32(z2, eocd2 + 12);

  const local1 = z1.subarray(0, cdOff1);
  const local2 = z2.subarray(0, cdOff2);
  const cd1 = z1.subarray(cdOff1, cdOff1 + cdSize1);
  const cd2 = z2.slice(cdOff2, cdOff2 + cdSize2);
  // Adjust local header offset for second entry in CD
  writeU32(cd2, 42, local1.length);

  const combinedCdOffset = local1.length + local2.length;
  const combinedCdSize = cd1.length + cd2.length;
  const eocd = z1.slice(eocd1, z1.length);
  writeU16(eocd, 8, 2);
  writeU16(eocd, 10, 2);
  writeU32(eocd, 12, combinedCdSize);
  writeU32(eocd, 16, combinedCdOffset);

  const out = new Uint8Array(combinedCdOffset + combinedCdSize + 22);
  let pos = 0;
  for (const part of [local1, local2, cd1, cd2, eocd]) {
    out.set(part, pos);
    pos += part.length;
  }
  return out;
}

describe('ZIP backup export & secure restore', () => {
  beforeEach(() => {
    resetStorageRuntimeForTests();
    Object.defineProperty(globalThis, 'indexedDB', {
      value: new IDBFactory(),
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    resetStorageRuntimeForTests();
    vi.restoreAllMocks();
  });

  it('pakuje pełną kopię, profil, wszystkie dokumenty oraz bazy danych do jednego archiwum .zip', () => {
    const state = createRichTestState();
    const zipBytes = buildBackupZipBytes(state);
    const unzipped = unzipSync(zipBytes);
    const entryNames = Object.keys(unzipped);

    expect(entryNames).toContain(FULL_BACKUP_ZIP_ENTRY);
    expect(entryNames).toContain('profil-nauczyciela.json');
    expect(entryNames).toContain('bazy-danych/wlasne-wnioski.json');
    expect(entryNames).toContain('bazy-danych/szablony-wlasne.json');
    expect(entryNames).toContain('bazy-danych/paczki-nadzoru.json');
    expect(entryNames).toContain('bazy-danych/notatki-klasowe-nadzoru.json');
    expect(entryNames).toContain('README-archiwum.txt');

    const docEntries = entryNames.filter((name) => name.startsWith('dokumenty/') && name.endsWith('.json'));
    expect(docEntries).toHaveLength(state.documents.length);

    const parsedWnioski = JSON.parse(strFromU8(unzipped['bazy-danych/wlasne-wnioski.json']!));
    expect(parsedWnioski).toHaveLength(1);
    expect(parsedWnioski[0].text).toBe('Kontynuować ćwiczenia rachunkowe.');
  });

  it('odtwarza pełny stan aplikacji z wygenerowanego archiwum .zip i zapisuje do IndexedDB', async () => {
    await loadAppState();
    const state = createRichTestState();
    state.documents[1]!.isLocked = true;
    const zipBytes = buildBackupZipBytes(state);
    const buffer = zipBytes.slice().buffer;

    const extracted = await extractBackupJsonFromZip(buffer);
    expect(extracted.ok).toBe(true);
    if (!extracted.ok) return;

    const validated = validateAndParseImportedJson(extracted.jsonText);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const saved = await saveAppStateImmediate(validated.state, {
      replaceAll: true,
      forceOverwriteRevision: true,
    });
    expect(saved.ok).toBe(true);

    const persisted = await readIndexedDbStateOnly();
    expect(persisted.state?.profile.fullName).toBe('Anna Kowalska');
    expect(persisted.state?.documents).toHaveLength(2);
    expect(persisted.state?.documents[0]?.isLocked).toBe(false);
    expect(persisted.state?.documents[1]?.isLocked).toBe(true);
    expect(persisted.state?.customWnioski).toHaveLength(1);
    expect(persisted.state?.customTemplates).toHaveLength(1);
    expect(persisted.state?.supervisionClassNotes['2026/2027::I::4A']).toBe('Uwagi klasy 4A');
  });

  it('odrzuca pusty plik ZIP, ucięty ZIP oraz archiwum ZIP bez pełnego pliku kopii bez zmian w IndexedDB', async () => {
    const { state: initial } = await loadAppState();
    await saveAppStateImmediate({
      ...initial,
      profile: { ...initial.profile, fullName: 'Stan Nienaruszony' },
    });

    const emptyBuf = new ArrayBuffer(0);
    const resEmpty = await extractBackupJsonFromZip(emptyBuf);
    expect(resEmpty.ok).toBe(false);

    const zeroEntryZip = zipSync({});
    const resZeroEntries = await extractBackupJsonFromZip(zeroEntryZip.slice().buffer);
    expect(resZeroEntries.ok).toBe(false);

    const emptyZip = zipSync({ 'inny.txt': strToU8('hello') });
    const resMissing = await extractBackupJsonFromZip(emptyZip.slice().buffer);
    expect(resMissing.ok).toBe(false);

    const validZip = buildBackupZipBytes(createRichTestState());
    const truncated = validZip.slice(0, Math.floor(validZip.length / 2));
    const resTruncated = await extractBackupJsonFromZip(truncated.buffer);
    expect(resTruncated.ok).toBe(false);

    const brokenBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const resCorrupt = await extractBackupJsonFromZip(brokenBytes.buffer);
    expect(resCorrupt.ok).toBe(false);

    const inDb = await readIndexedDbStateOnly();
    expect(inDb.state?.profile.fullName).toBe('Stan Nienaruszony');
  });

  it('odrzuca plik przekraczający limit rozmiaru przed wywołaniem arrayBuffer() i text()', async () => {
    const arrayBufferSpy = vi.fn(async () => new ArrayBuffer(0));
    const textSpy = vi.fn(async () => '');

    const oversizedZipFile = {
      name: 'gigant-kopia.zip',
      size: MAX_IMPORT_FILE_BYTES + 1,
      arrayBuffer: arrayBufferSpy,
      text: textSpy,
    };
    const resZip = await readValidatedBackupFileForImport(oversizedZipFile);
    expect(resZip.ok).toBe(false);
    if (!resZip.ok) {
      expect(resZip.error).toContain('25 MiB');
      expect(resZip.error).toContain('roku szkolnego');
    }
    expect(arrayBufferSpy).not.toHaveBeenCalled();
    expect(textSpy).not.toHaveBeenCalled();

    const oversizedJsonFile = {
      name: 'gigant-kopia.json',
      size: MAX_IMPORT_FILE_BYTES + 1024,
      arrayBuffer: arrayBufferSpy,
      text: textSpy,
    };
    const resJson = await readValidatedBackupFileForImport(oversizedJsonFile);
    expect(resJson.ok).toBe(false);
    expect(arrayBufferSpy).not.toHaveBeenCalled();
    expect(textSpy).not.toHaveBeenCalled();

    const emptyFile = {
      name: 'pusty.json',
      size: 0,
      arrayBuffer: arrayBufferSpy,
      text: textSpy,
    };
    const resEmpty = await readValidatedBackupFileForImport(emptyFile);
    expect(resEmpty.ok).toBe(false);
    expect(arrayBufferSpy).not.toHaveBeenCalled();
    expect(textSpy).not.toHaveBeenCalled();

    const precheckTooBig = validateImportFileMetadata(
      { name: 'nadzor.json', size: MAX_IMPORT_FILE_BYTES + 1 },
      { allowZip: false }
    );
    expect(precheckTooBig.ok).toBe(false);
  });

  it('odrzuca archiwum ZIP z nadmierną liczbą wpisów', async () => {
    const { state: initial } = await loadAppState();
    await saveAppStateImmediate({
      ...initial,
      profile: { ...initial.profile, fullName: 'Bezpieczna Sesja' },
    });

    const tooMany: Record<string, Uint8Array> = {
      [FULL_BACKUP_ZIP_ENTRY]: strToU8('{}'),
    };
    for (let i = 0; i <= MAX_ZIP_ENTRIES; i += 1) {
      tooMany[`d/${i}.txt`] = new Uint8Array([65]);
    }
    const zipBytes = zipSync(tooMany, { level: 0 });
    const res = await extractBackupJsonFromZip(zipBytes.slice().buffer);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain(String(MAX_ZIP_ENTRIES));
    }

    const inDb = await readIndexedDbStateOnly();
    expect(inDb.state?.profile.fullName).toBe('Bezpieczna Sesja');
  });

  it('przerywa dekompresję ZIP bomby (zarówno przy deklarowanym, jak i sfałszowanym nagłówku CD) bez przekroczenia budżetu pamięci', async () => {
    const { state: initial } = await loadAppState();
    await saveAppStateImmediate({
      ...initial,
      profile: { ...initial.profile, fullName: 'Przed Bombą ZIP' },
    });

    // 4 MiB zer skompresuje się do kilku KiB -> współczynnik >> 200:1
    const fourMiBZeroes = new Uint8Array(4 * 1024 * 1024);
    const bombZip = zipSync({ [FULL_BACKUP_ZIP_ENTRY]: fourMiBZeroes }, { level: 9 });
    expect(bombZip.byteLength).toBeLessThan(32 * 1024);

    // 1) Kontrola na etapie katalogu centralnego
    const resCd = await extractBackupJsonFromZip(bombZip.slice().buffer);
    expect(resCd.ok).toBe(false);

    // 2) Sfałszowane nagłówki CD (udaje mały plik 500 B i wielki compSize), aby wymusić wykrycie w trakcie strumieniowania DEFLATE
    const spoofedBomb = bombZip.slice();
    const eocdOffset = spoofedBomb.length - 22;
    const cdOffset = readU32(spoofedBomb, eocdOffset + 16);
    writeU32(spoofedBomb, cdOffset + 20, 999_999_999);
    writeU32(spoofedBomb, cdOffset + 24, 500);

    const resStream = await extractBackupJsonFromZip(spoofedBomb.buffer);
    expect(resStream.ok).toBe(false);

    const inDb = await readIndexedDbStateOnly();
    expect(inDb.state?.profile.fullName).toBe('Przed Bombą ZIP');
  });

  it('odrzuca archiwum ZIP z pojedynczym wpisem przekraczającym limit rozmiaru po dekompresji', async () => {
    const validZip = zipSync({ [FULL_BACKUP_ZIP_ENTRY]: strToU8('{"a":1}') }, { level: 0 });
    const patched = validZip.slice();
    const eocdOffset = patched.length - 22;
    const cdOffset = readU32(patched, eocdOffset + 16);
    // Zadeklaruj w katalogu centralnym rozmiar wpisu > 25 MiB (np. 26 MiB)
    writeU32(patched, cdOffset + 24, 26 * 1024 * 1024);

    const res = await extractBackupJsonFromZip(patched.buffer);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('25 MiB');
    }
  });

  it('odrzuca archiwum ZIP zawierające zduplikowane nazwy wpisów oraz niebezpieczne ścieżki', async () => {
    const dupZip = buildZipWithDuplicateEntries(
      FULL_BACKUP_ZIP_ENTRY,
      '{"app":"E-Sprawozdania","first":true}',
      '{"app":"E-Sprawozdania","second":true}'
    );
    const resDup = await extractBackupJsonFromZip(dupZip.buffer as ArrayBuffer);
    expect(resDup.ok).toBe(false);
    if (!resDup.ok) {
      expect(resDup.error).toContain('zduplikowaną nazwę');
    }

    const traversalZip = zipSync({
      '../pelna-kopia-esprawozdania.json': strToU8('{}'),
    });
    const resTraversal = await extractBackupJsonFromZip(traversalZip.slice().buffer);
    expect(resTraversal.ok).toBe(false);
  });

  it('exportStateAsZip pobiera plik .zip i aktualizuje znacznik czasu ostatniej kopii zapasowej', () => {
    const state = createRichTestState();
    const origDoc = globalThis.document;
    const origUrl = globalThis.URL;

    let downloadedName = '';
    let downloadedType = '';
    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: () => {
          const anchor = {
            href: '',
            download: '',
            style: {},
            click: () => {
              downloadedName = anchor.download;
            },
            remove: () => {},
          };
          return anchor;
        },
        body: { appendChild: () => {} },
      },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'URL', {
      value: {
        createObjectURL: (blob: Blob) => {
          downloadedType = blob.type;
          return 'blob:zip-test';
        },
        revokeObjectURL: () => {},
      },
      configurable: true,
      writable: true,
    });

    try {
      const ok = exportStateAsZip(state);
      expect(ok).toBe(true);
      expect(downloadedName).toMatch(/^sprawozdania-archiwum-\d{4}-\d{2}-\d{2}\.zip$/);
      expect(downloadedType).toBe('application/zip');
      expect(getBackupReminderMeta().lastBackupExportAt).not.toBeNull();
    } finally {
      Object.defineProperty(globalThis, 'document', {
        value: origDoc,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(globalThis, 'URL', {
        value: origUrl,
        configurable: true,
        writable: true,
      });
    }
  });

  it('odrzuca archiwum ZIP z nieobsługiwaną metodą kompresji z komunikatem kierującym do kopii z aplikacji lub pliku .json', async () => {
    const validZip = zipSync({ [FULL_BACKUP_ZIP_ENTRY]: strToU8('{"a":1}') }, { level: 0 });
    const patched = validZip.slice();
    const eocdOffset = patched.length - 22;
    const cdOffset = readU32(patched, eocdOffset + 16);
    // Ustaw metodę kompresji na nieobsługiwaną (9 = Deflate64) w katalogu centralnym
    writeU16(patched, cdOffset + 10, 9);

    const res = await extractBackupJsonFromZip(patched.buffer);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('Użyj archiwum pobranego z aplikacji lub wskaż rozpakowany plik .json.');
    }
  });

  it('buduje i odtwarza archiwum .zip zawężone do wybranego roku szkolnego', async () => {
    const state = createRichTestState();
    state.documents[0]!.schoolYear = '2025/2026';
    state.documents[1]!.schoolYear = '2026/2027';

    const scopedZip = buildBackupZipWithStats(state, {
      schoolYear: '2026/2027',
      includeRelatedBases: false,
    });
    expect(scopedZip.filename).toContain('2026-2027');
    expect(scopedZip.evaluation.overLimit).toBe(false);

    const extracted = await extractBackupJsonFromZip(scopedZip.bytes.slice().buffer);
    expect(extracted.ok).toBe(true);
    if (!extracted.ok) return;

    const validated = validateAndParseImportedJson(extracted.jsonText);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    expect(validated.state.documents).toHaveLength(1);
    expect(validated.state.documents[0]?.schoolYear).toBe('2026/2027');
    expect(validated.state.customWnioski).toEqual([]);
  });

  it('rozpakowuje strumieniowo duży (~20 MiB) wpis JSON w archiwum ZIP bez przekroczenia limitu czasu', async () => {
    const targetPayload = `${'{"payload":"'}${'x'.repeat(20 * 1024 * 1024)}${'"}'}`;
    const storedZip = zipSync({ [FULL_BACKUP_ZIP_ENTRY]: strToU8(targetPayload) }, { level: 0 });

    const start = performance.now();
    const res = await extractBackupJsonFromZip(storedZip.slice().buffer);
    const elapsedMs = performance.now() - start;

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.jsonText.length).toBe(targetPayload.length);
    }
    expect(elapsedMs).toBeLessThan(10_000);
  });
});

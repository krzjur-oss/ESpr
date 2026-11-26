import { strFromU8, unzipSync, zipSync, strToU8 } from 'fflate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppState } from '../../types/reports';
import { createDocumentByType, createInitialAppState } from '../documentFactory';
import {
  getBackupReminderMeta,
  resetStorageRuntimeForTests,
  validateAndParseImportedJson,
} from '../storage';
import {
  FULL_BACKUP_ZIP_ENTRY,
  buildBackupZipBytes,
  exportStateAsZip,
  extractBackupJsonFromZip,
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

describe('ZIP backup export & restore', () => {
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

  it('odtwarza pełny stan aplikacji z wygenerowanego archiwum .zip', () => {
    const state = createRichTestState();
    state.documents[1]!.isLocked = true;
    const zipBytes = buildBackupZipBytes(state);
    const buffer = zipBytes.slice().buffer;

    const extracted = extractBackupJsonFromZip(buffer);
    expect(extracted.ok).toBe(true);
    if (!extracted.ok) return;

    const validated = validateAndParseImportedJson(extracted.jsonText);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    expect(validated.state.profile.fullName).toBe('Anna Kowalska');
    expect(validated.state.documents).toHaveLength(2);
    expect(validated.state.documents[0]?.isLocked).toBe(false);
    expect(validated.state.documents[1]?.isLocked).toBe(true);
    expect(validated.state.customWnioski).toHaveLength(1);
    expect(validated.state.customTemplates).toHaveLength(1);
    expect(validated.state.supervisionClassNotes['2026/2027::I::4A']).toBe('Uwagi klasy 4A');
  });

  it('odrzuca archiwum ZIP bez pełnego pliku kopii lub uszkodzone archiwum', () => {
    const emptyZip = zipSync({ 'inny.txt': strToU8('hello') });
    const resMissing = extractBackupJsonFromZip(emptyZip.slice().buffer);
    expect(resMissing.ok).toBe(false);

    const brokenBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const resCorrupt = extractBackupJsonFromZip(brokenBytes.buffer);
    expect(resCorrupt.ok).toBe(false);
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
});

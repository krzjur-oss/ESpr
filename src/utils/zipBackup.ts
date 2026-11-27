import {
  Unzip,
  UnzipInflate,
  UnzipPassThrough,
  strFromU8,
  strToU8,
  zipSync,
} from 'fflate';
import { APP_VERSION } from '../data/changelog';
import { AppState, DOCUMENT_TYPE_LABELS } from '../types/reports';
import { triggerBlobDownload } from './download';
import {
  BackupSizeEvaluation,
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_FILE_MIB,
  MAX_ZIP_COMPRESSION_RATIO,
  MAX_ZIP_ENTRIES,
  MAX_ZIP_ENTRY_BYTES,
  MAX_ZIP_TOTAL_BYTES,
  ZIP_RATIO_CHECK_MIN_BYTES,
  evaluateBackupExportSize,
  validateImportFileMetadata,
} from './importLimits';
import {
  BackupScopeOptions,
  createScopedBackupState,
  recordBackupExportNow,
} from './storage';

const POLISH_CHAR_MAP: Record<string, string> = {
  ą: 'a',
  ć: 'c',
  ę: 'e',
  ł: 'l',
  ń: 'n',
  ó: 'o',
  ś: 's',
  ź: 'z',
  ż: 'z',
  Ą: 'a',
  Ć: 'c',
  Ę: 'e',
  Ł: 'l',
  Ń: 'n',
  Ó: 'o',
  Ś: 's',
  Ź: 'z',
  Ż: 'z',
};

function toSafeFileSlug(raw: string, fallback = 'dokument'): string {
  const ascii = raw
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => POLISH_CHAR_MAP[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return ascii || fallback;
}

function toJsonBytes(data: unknown): Uint8Array {
  return strToU8(JSON.stringify(data, null, 2));
}

export const FULL_BACKUP_ZIP_ENTRY = 'pelna-kopia-esprawozdania.json';

const STREAM_CHUNK_BYTES = 65536;
const YIELD_EVERY_CHUNKS = 4;

function readU16(data: Uint8Array, offset: number): number {
  return (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8);
}

function readU32(data: Uint8Array, offset: number): number {
  return (
    ((data[offset] ?? 0) |
      ((data[offset + 1] ?? 0) << 8) |
      ((data[offset + 2] ?? 0) << 16) |
      ((data[offset + 3] ?? 0) << 24)) >>>
    0
  );
}

function readU64Safe(data: Uint8Array, offset: number): number {
  const low = readU32(data, offset);
  const high = readU32(data, offset + 4);
  return high * 4294967296 + low;
}

function isSafeZipEntryName(name: string): boolean {
  if (!name || name.length > 1024) return false;
  if (name.includes('\0') || name.includes('\\')) return false;
  if (name.startsWith('/') || /^[A-Za-z]:/.test(name)) return false;
  const segments = name.split('/');
  return !segments.some((seg) => seg === '..');
}

interface CdEntryInfo {
  name: string;
  isDir: boolean;
  compression: number;
  compSize: number;
  uncompSize: number;
}

function parseZip64SizesFromExtra(
  bytes: Uint8Array,
  extraOffset: number,
  extraLen: number,
  compSize: number,
  uncompSize: number,
  localOffset: number
): { compSize: number; uncompSize: number; localOffset: number } | null {
  const needUncomp = uncompSize === 0xffffffff;
  const needComp = compSize === 0xffffffff;
  const needOff = localOffset === 0xffffffff;
  if (!needUncomp && !needComp && !needOff) {
    return { compSize, uncompSize, localOffset };
  }

  let cursor = extraOffset;
  const end = extraOffset + extraLen;
  while (cursor + 4 <= end) {
    const headerId = readU16(bytes, cursor);
    const dataSize = readU16(bytes, cursor + 2);
    const dataStart = cursor + 4;
    if (dataStart + dataSize > end) return null;
    if (headerId === 0x0001) {
      let ptr = dataStart;
      let nextUncomp = uncompSize;
      let nextComp = compSize;
      let nextOff = localOffset;
      if (needUncomp) {
        if (ptr + 8 > dataStart + dataSize) return null;
        nextUncomp = readU64Safe(bytes, ptr);
        ptr += 8;
      }
      if (needComp) {
        if (ptr + 8 > dataStart + dataSize) return null;
        nextComp = readU64Safe(bytes, ptr);
        ptr += 8;
      }
      if (needOff) {
        if (ptr + 8 > dataStart + dataSize) return null;
        nextOff = readU64Safe(bytes, ptr);
      }
      return { compSize: nextComp, uncompSize: nextUncomp, localOffset: nextOff };
    }
    cursor = dataStart + dataSize;
  }
  return null;
}

function inspectZipCentralDirectory(
  bytes: Uint8Array
): { ok: true; entries: CdEntryInfo[]; target: CdEntryInfo } | { ok: false; error: string } {
  if (bytes.length < 22) {
    return {
      ok: false,
      error: 'Wybrane archiwum ZIP jest uszkodzone lub niekompletne.',
    };
  }

  const minEocdPos = Math.max(0, bytes.length - 22 - 65535);
  let eocdPos = -1;
  for (let pos = bytes.length - 22; pos >= minEocdPos; pos -= 1) {
    if (readU32(bytes, pos) === 0x06054b50) {
      const commentLen = readU16(bytes, pos + 20);
      if (pos + 22 + commentLen === bytes.length) {
        eocdPos = pos;
        break;
      }
      if (eocdPos === -1 && pos + 22 + commentLen <= bytes.length) {
        eocdPos = pos;
      }
    }
  }

  if (eocdPos === -1) {
    return {
      ok: false,
      error: 'Wybrane archiwum ZIP jest uszkodzone lub ucięte (brak nagłówka końcowego).',
    };
  }

  const diskNum = readU16(bytes, eocdPos + 4);
  const cdStartDisk = readU16(bytes, eocdPos + 6);
  const diskEntries = readU16(bytes, eocdPos + 8);
  let totalEntries = readU16(bytes, eocdPos + 10);
  let cdSize = readU32(bytes, eocdPos + 12);
  let cdOffset = readU32(bytes, eocdPos + 16);

  if (diskNum !== 0 || cdStartDisk !== 0 || diskEntries !== totalEntries) {
    return {
      ok: false,
      error: 'Wieloczęściowe lub niespójne archiwa ZIP nie są obsługiwane.',
    };
  }

  if (eocdPos >= 20 && readU32(bytes, eocdPos - 20) === 0x07064b50) {
    const zip64Offset = readU64Safe(bytes, eocdPos - 12);
    if (
      Number.isSafeInteger(zip64Offset) &&
      zip64Offset >= 0 &&
      zip64Offset + 56 <= eocdPos &&
      readU32(bytes, zip64Offset) === 0x06064b50
    ) {
      const zDiskEntries = readU64Safe(bytes, zip64Offset + 24);
      const zTotalEntries = readU64Safe(bytes, zip64Offset + 32);
      const zCdSize = readU64Safe(bytes, zip64Offset + 40);
      const zCdOffset = readU64Safe(bytes, zip64Offset + 48);
      if (zDiskEntries !== zTotalEntries) {
        return {
          ok: false,
          error: 'Wieloczęściowe lub niespójne archiwa ZIP nie są obsługiwane.',
        };
      }
      totalEntries = zTotalEntries;
      cdSize = zCdSize;
      cdOffset = zCdOffset;
    }
  }

  if (totalEntries <= 0) {
    return {
      ok: false,
      error: 'Wybrane archiwum ZIP jest puste (brak wpisów).',
    };
  }

  if (totalEntries > MAX_ZIP_ENTRIES) {
    return {
      ok: false,
      error: `Archiwum ZIP zawiera zbyt wiele wpisów (${totalEntries}; maksymalnie ${MAX_ZIP_ENTRIES}) i zostało odrzucone ze względów bezpieczeństwa.`,
    };
  }

  if (
    !Number.isSafeInteger(cdOffset) ||
    !Number.isSafeInteger(cdSize) ||
    cdOffset < 0 ||
    cdSize <= 0 ||
    cdOffset + cdSize > eocdPos
  ) {
    return {
      ok: false,
      error: 'Katalog centralny archiwum ZIP jest uszkodzony lub wykracza poza rozmiar pliku.',
    };
  }

  const entries: CdEntryInfo[] = [];
  const seenNames = new Set<string>();
  let declaredTotalUncompressed = 0;
  let cursor = cdOffset;
  const cdEnd = cdOffset + cdSize;

  for (let i = 0; i < totalEntries; i += 1) {
    if (cursor + 46 > cdEnd || readU32(bytes, cursor) !== 0x02014b50) {
      return {
        ok: false,
        error: 'Nieprawidłowy rekord w katalogu centralnym archiwum ZIP.',
      };
    }

    const verMade = readU16(bytes, cursor + 4);
    const gpFlag = readU16(bytes, cursor + 8);
    const compression = readU16(bytes, cursor + 10);
    const rawCompSize = readU32(bytes, cursor + 20);
    const rawUncompSize = readU32(bytes, cursor + 24);
    const fnLen = readU16(bytes, cursor + 28);
    const exLen = readU16(bytes, cursor + 30);
    const cmtLen = readU16(bytes, cursor + 32);
    const extAttrs = readU32(bytes, cursor + 38);
    const rawLocalOffset = readU32(bytes, cursor + 42);

    const recordEnd = cursor + 46 + fnLen + exLen + cmtLen;
    if (recordEnd > cdEnd) {
      return {
        ok: false,
        error: 'Rekord wpisu archiwum ZIP jest ucięty lub uszkodzony.',
      };
    }

    let name = '';
    try {
      name = strFromU8(bytes.subarray(cursor + 46, cursor + 46 + fnLen), !(gpFlag & 2048));
    } catch {
      return {
        ok: false,
        error: 'Nazwa jednego z wpisów archiwum ZIP zawiera nieprawidłowe znaki UTF-8.',
      };
    }

    if (!isSafeZipEntryName(name)) {
      return {
        ok: false,
        error: 'Archiwum ZIP zawiera niedozwoloną ścieżkę pliku i zostało odrzucone.',
      };
    }

    if (seenNames.has(name)) {
      return {
        ok: false,
        error: `Archiwum ZIP zawiera zduplikowaną nazwę wpisu („${name}”) i zostało odrzucone ze względów bezpieczeństwa.`,
      };
    }
    seenNames.add(name);

    if ((gpFlag & 1) !== 0) {
      return {
        ok: false,
        error: 'Zaszyfrowane archiwa ZIP nie są obsługiwane.',
      };
    }

    const creatorOs = verMade >> 8;
    const unixMode = (extAttrs >>> 16) & 0o170000;
    if (creatorOs === 3 && unixMode === 0o120000) {
      return {
        ok: false,
        error: 'Archiwum ZIP zawiera niedozwolone dowiązanie symboliczne (symlink).',
      };
    }

    const sizes = parseZip64SizesFromExtra(
      bytes,
      cursor + 46 + fnLen,
      exLen,
      rawCompSize,
      rawUncompSize,
      rawLocalOffset
    );
    if (!sizes || !Number.isSafeInteger(sizes.uncompSize) || !Number.isSafeInteger(sizes.compSize)) {
      return {
        ok: false,
        error: 'Nie udało się odczytać rozmiarów wpisu archiwum ZIP.',
      };
    }

    const isDir = name.endsWith('/');
    if (!isDir) {
      if (sizes.uncompSize > MAX_ZIP_ENTRY_BYTES) {
        return {
          ok: false,
          error: `Wpis „${name}” przekracza maksymalny dopuszczalny rozmiar pojedynczego pliku po dekompresji (${MAX_IMPORT_FILE_MIB} MiB).`,
        };
      }

      declaredTotalUncompressed += sizes.uncompSize;
      if (declaredTotalUncompressed > MAX_ZIP_TOTAL_BYTES) {
        return {
          ok: false,
          error: 'Łączny rozmiar plików w archiwum ZIP po dekompresji przekracza dopuszczalny limit bezpieczeństwa.',
        };
      }

      if (
        sizes.uncompSize >= ZIP_RATIO_CHECK_MIN_BYTES &&
        sizes.uncompSize / Math.max(1, sizes.compSize) > MAX_ZIP_COMPRESSION_RATIO
      ) {
        return {
          ok: false,
          error: 'Wykryto podejrzanie wysoki współczynnik kompresji w archiwum ZIP. Dekompresja została przerwana.',
        };
      }
    }

    entries.push({
      name,
      isDir,
      compression,
      compSize: sizes.compSize,
      uncompSize: sizes.uncompSize,
    });
    cursor = recordEnd;
  }

  if (cursor !== cdEnd) {
    return {
      ok: false,
      error: 'Katalog centralny archiwum ZIP zawiera nieoczekiwane lub uszkodzone dane.',
    };
  }

  const exact = entries.find((e) => !e.isDir && e.name === FULL_BACKUP_ZIP_ENTRY);
  const fallback =
    exact ??
    entries.find(
      (e) =>
        !e.isDir &&
        !e.name.includes('/') &&
        e.name.toLowerCase().endsWith('.json') &&
        e.name !== 'profil-nauczyciela.json'
    );

  if (!fallback) {
    return {
      ok: false,
      error:
        'Wybrane archiwum ZIP nie zawiera pliku pełnej kopii (pelna-kopia-esprawozdania.json).',
    };
  }

  if (fallback.compression !== 0 && fallback.compression !== 8) {
    return {
      ok: false,
      error:
        'Plik kopii wewnątrz archiwum ZIP używa nieobsługiwanej metody kompresji. Użyj archiwum pobranego z aplikacji lub wskaż rozpakowany plik .json.',
    };
  }

  return { ok: true, entries, target: fallback };
}

function yieldToMainThread(): Promise<void> {
  if (typeof MessageChannel === 'function') {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        channel.port2.close();
        resolve();
      };
      channel.port2.postMessage(null);
    });
  }
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, 0);
  });
}

export interface BackupZipExportSummary {
  ok: boolean;
  filename: string;
  byteLength: number;
  evaluation: BackupSizeEvaluation;
}

function buildZipBackupFilenameSlug(schoolYear?: string): string {
  const trimmed = schoolYear?.trim();
  if (!trimmed || trimmed === 'all') return '';
  return `-${trimmed.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
}

export function buildBackupZipWithStats(
  state: AppState,
  options?: BackupScopeOptions
): {
  bytes: Uint8Array;
  scopedState: AppState;
  evaluation: BackupSizeEvaluation;
  filename: string;
} {
  const scopedState = createScopedBackupState(state, options);
  const bytes = buildBackupZipBytes(scopedState);
  const evaluation = evaluateBackupExportSize(bytes.byteLength);
  const dateTag = new Date().toISOString().slice(0, 10);
  const yearSlug = buildZipBackupFilenameSlug(options?.schoolYear);
  const filename = `sprawozdania-archiwum${yearSlug}-${dateTag}.zip`;
  return {
    bytes,
    scopedState,
    evaluation,
    filename,
  };
}

export function buildBackupZipBytes(state: AppState): Uint8Array {
  const exportedAt = new Date().toISOString();
  const fullBackupPayload = {
    app: 'E-Sprawozdania' as const,
    kind: 'full_backup' as const,
    exportedAt,
    ...state,
  };

  const entries: Record<string, Uint8Array> = {
    [FULL_BACKUP_ZIP_ENTRY]: toJsonBytes(fullBackupPayload),
    'profil-nauczyciela.json': toJsonBytes(state.profile),
    'bazy-danych/wlasne-wnioski.json': toJsonBytes(state.customWnioski),
    'bazy-danych/szablony-wlasne.json': toJsonBytes(state.customTemplates),
    'bazy-danych/paczki-nadzoru.json': toJsonBytes(state.supervisionPackages),
    'bazy-danych/notatki-klasowe-nadzoru.json': toJsonBytes(state.supervisionClassNotes),
  };

  const usedDocNames = new Set<string>();
  state.documents.forEach((doc, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const rawLabel = doc.title?.trim() || DOCUMENT_TYPE_LABELS[doc.type] || doc.type;
    const slug = toSafeFileSlug(rawLabel, doc.type);
    const shortId = toSafeFileSlug(doc.id, String(idx + 1)).slice(0, 8);
    let path = `dokumenty/${num}-${slug}-${shortId}.json`;
    let suffix = 2;
    while (usedDocNames.has(path)) {
      path = `dokumenty/${num}-${slug}-${shortId}-${suffix}.json`;
      suffix += 1;
    }
    usedDocNames.add(path);
    entries[path] = toJsonBytes(doc);
  });

  const readmeLines = [
    'E-Sprawozdania — Archiwum kopii zapasowej (ZIP)',
    `Wersja aplikacji: ${APP_VERSION}`,
    `Data eksportu: ${exportedAt}`,
    `Nauczyciel / specjalista: ${state.profile.fullName.trim() || 'Nie podano'}`,
    `Szkoła / placówka: ${state.profile.schoolName.trim() || 'Nie podano'}`,
    '',
    'Zawartość archiwum:',
    `- ${FULL_BACKUP_ZIP_ENTRY} — pełna kopia zapasowa do przywrócenia w zakładce „Kopia JSON”`,
    '- profil-nauczyciela.json — zapisane dane profilu, klasy, przedmioty i podręczniki',
    `- dokumenty/ (${state.documents.length} plików) — każda karta sprawozdania w osobnym pliku JSON`,
    `- bazy-danych/wlasne-wnioski.json (${state.customWnioski.length} wpisów)`,
    `- bazy-danych/szablony-wlasne.json (${state.customTemplates.length} wpisów)`,
    `- bazy-danych/paczki-nadzoru.json (${state.supervisionPackages.length} paczek nauczycieli)`,
    `- bazy-danych/notatki-klasowe-nadzoru.json (${Object.keys(state.supervisionClassNotes).length} wpisów)`,
    '',
    'Przywracanie danych:',
    'W zakładce „Kopia JSON” możesz wskazać bezpośrednio ten plik .zip albo wypakowany plik pelna-kopia-esprawozdania.json.',
    `Maksymalny rozmiar importowanego pliku: ${MAX_IMPORT_FILE_MIB} MiB.`,
    '',
    'Uwaga RODO i bezpieczeństwo:',
    'Pliki w archiwum nie są szyfrowane i mogą zawierać dane osobowe uczniów oraz nauczycieli (w tym dane szczególnych kategorii).',
    'Przechowuj archiwum wyłącznie na bezpiecznym nośniku z blokadą dostępu, nie przesyłaj niezabezpieczonym kanałem i usuń po zakończeniu użycia.',
  ];
  entries['README-archiwum.txt'] = strToU8(readmeLines.join('\n'));

  return zipSync(entries, { level: 6 });
}

export function exportStateAsZipWithSummary(
  state: AppState,
  options?: BackupScopeOptions
): BackupZipExportSummary {
  try {
    const { bytes, evaluation, filename } = buildBackupZipWithStats(state, options);
    const arrayBuffer = bytes.slice().buffer;
    const blob = new Blob([arrayBuffer], { type: 'application/zip' });
    const ok = triggerBlobDownload(blob, filename);
    if (ok) {
      void recordBackupExportNow();
    }
    return {
      ok,
      filename,
      byteLength: bytes.byteLength,
      evaluation,
    };
  } catch {
    return {
      ok: false,
      filename: '',
      byteLength: 0,
      evaluation: evaluateBackupExportSize(0),
    };
  }
}

export function exportStateAsZip(state: AppState, options?: BackupScopeOptions): boolean {
  return exportStateAsZipWithSummary(state, options).ok;
}

export async function extractBackupJsonFromZip(
  buffer: ArrayBuffer
): Promise<{ ok: true; jsonText: string } | { ok: false; error: string }> {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength === 0) {
    return {
      ok: false,
      error: 'Wybrane archiwum ZIP jest puste.',
    };
  }

  if (buffer.byteLength > MAX_IMPORT_FILE_BYTES) {
    return {
      ok: false,
      error: `Wybrane archiwum ZIP przekracza dopuszczalny limit rozmiaru (${MAX_IMPORT_FILE_MIB} MiB).`,
    };
  }

  const bytes = new Uint8Array(buffer);
  const cdCheck = inspectZipCentralDirectory(bytes);
  if (!cdCheck.ok) {
    return cdCheck;
  }

  const targetMeta = cdCheck.target;
  const unzipper = new Unzip();
  unzipper.register(UnzipPassThrough);
  unzipper.register(UnzipInflate);

  let abortedError: string | null = null;
  let streamedEntryCount = 0;
  const seenLocalNames = new Set<string>();
  let targetStreamStarted = false;
  let targetCompleted = false;
  let actualEntryBytes = 0;
  const collectedChunks: Uint8Array[] = [];

  const abortWith = (message: string) => {
    if (!abortedError) {
      abortedError = message;
    }
  };

  unzipper.onfile = (file) => {
    if (abortedError) return;

    streamedEntryCount += 1;
    if (streamedEntryCount > MAX_ZIP_ENTRIES) {
      abortWith(
        `Archiwum ZIP zawiera zbyt wiele wpisów (limit: ${MAX_ZIP_ENTRIES}) i zostało odrzucone.`
      );
      return;
    }

    if (!isSafeZipEntryName(file.name)) {
      abortWith('Archiwum ZIP zawiera niedozwoloną ścieżkę pliku.');
      return;
    }

    if (seenLocalNames.has(file.name)) {
      abortWith(
        `Archiwum ZIP zawiera zduplikowaną nazwę wpisu („${file.name}”) i zostało odrzucone ze względów bezpieczeństwa.`
      );
      return;
    }
    seenLocalNames.add(file.name);

    if (typeof file.originalSize === 'number' && file.originalSize > MAX_ZIP_ENTRY_BYTES) {
      abortWith(
        `Wpis „${file.name}” przekracza maksymalny dopuszczalny rozmiar po dekompresji (${MAX_IMPORT_FILE_MIB} MiB).`
      );
      return;
    }

    if (file.name !== targetMeta.name || targetStreamStarted) {
      return;
    }

    targetStreamStarted = true;
    const rawDeclaredComp = targetMeta.compSize > 0 ? targetMeta.compSize : (file.size || bytes.byteLength);
    const denominatorCompressed = Math.max(1, Math.min(rawDeclaredComp, bytes.byteLength));

    file.ondata = (err, chunk, final) => {
      if (abortedError) return;
      if (err) {
        abortWith(
          'Nie udało się rozpakować pliku kopii z archiwum ZIP. Sprawdź, czy plik nie jest uszkodzony.'
        );
        return;
      }

      if (chunk && chunk.byteLength > 0) {
        actualEntryBytes += chunk.byteLength;

        if (actualEntryBytes > MAX_ZIP_ENTRY_BYTES) {
          abortWith(
            `Rozpakowywany plik kopii przekroczył limit ${MAX_IMPORT_FILE_MIB} MiB. Dekompresja została natychmiast przerwana.`
          );
          return;
        }

        if (
          actualEntryBytes >= ZIP_RATIO_CHECK_MIN_BYTES &&
          actualEntryBytes / denominatorCompressed > MAX_ZIP_COMPRESSION_RATIO
        ) {
          abortWith(
            'Wykryto podejrzanie wysoki współczynnik kompresji w strumieniu ZIP. Dekompresja została przerwana.'
          );
          return;
        }

        collectedChunks.push(chunk);
      }

      if (final) {
        targetCompleted = true;
      }
    };

    try {
      file.start();
    } catch {
      abortWith(
        'Archiwum ZIP używa nieobsługiwanej metody kompresji lub ma uszkodzony nagłówek. Użyj archiwum pobranego z aplikacji lub wskaż rozpakowany plik .json.'
      );
    }
  };

  try {
    let chunkIndex = 0;
    for (let offset = 0; offset < bytes.length; offset += STREAM_CHUNK_BYTES) {
      if (abortedError) {
        return { ok: false, error: abortedError };
      }
      const end = Math.min(bytes.length, offset + STREAM_CHUNK_BYTES);
      const isFinal = end === bytes.length;
      unzipper.push(bytes.subarray(offset, end), isFinal);
      if (abortedError) {
        return { ok: false, error: abortedError };
      }
      chunkIndex += 1;
      if (!isFinal && chunkIndex % YIELD_EVERY_CHUNKS === 0) {
        await yieldToMainThread();
      }
    }
  } catch {
    return {
      ok: false,
      error:
        abortedError ??
        'Nie udało się rozpakować archiwum ZIP. Sprawdź, czy plik nie jest uszkodzony lub niekompletny.',
    };
  }

  if (abortedError) {
    return { ok: false, error: abortedError };
  }

  if (streamedEntryCount !== cdCheck.entries.length) {
    return {
      ok: false,
      error:
        'Struktura lokalnych nagłówków archiwum ZIP nie zgadza się z katalogiem centralnym.',
    };
  }

  if (!targetStreamStarted || !targetCompleted || actualEntryBytes === 0) {
    return {
      ok: false,
      error:
        'Nie udało się odczytać kompletnego pliku pełnej kopii z archiwum ZIP (plik może być pusty lub ucięty).',
    };
  }

  const assembled = new Uint8Array(actualEntryBytes);
  let writeOffset = 0;
  for (const part of collectedChunks) {
    assembled.set(part, writeOffset);
    writeOffset += part.byteLength;
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const jsonText = decoder.decode(assembled);
    return { ok: true, jsonText };
  } catch {
    return {
      ok: false,
      error: 'Plik kopii wewnątrz archiwum ZIP nie zawiera prawidłowego tekstu UTF-8.',
    };
  }
}

export async function readValidatedBackupFileForImport(
  file: Pick<File, 'name' | 'size' | 'arrayBuffer' | 'text'>
): Promise<{ ok: true; jsonText: string } | { ok: false; error: string }> {
  const precheck = validateImportFileMetadata(file, { allowZip: true });
  if (!precheck.ok) {
    return precheck;
  }

  if (file.name.toLowerCase().endsWith('.zip')) {
    const buffer = await file.arrayBuffer();
    return extractBackupJsonFromZip(buffer);
  }

  const text = await file.text();
  if (text.trim().length === 0) {
    return {
      ok: false,
      error: 'Wybrany plik JSON jest pusty.',
    };
  }
  return { ok: true, jsonText: text };
}

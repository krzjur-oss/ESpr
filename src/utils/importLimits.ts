/**
 * Wspólne limity rozmiaru i zasobów dla importu kopii zapasowych (.json, .zip),
 * paczek nadzoru oraz paczek własnych wniosków i szablonów.
 */
export const MAX_IMPORT_FILE_MIB = 25;
export const MAX_IMPORT_FILE_BYTES = MAX_IMPORT_FILE_MIB * 1024 * 1024;
export const MAX_IMPORT_JSON_CHARS = MAX_IMPORT_FILE_BYTES;
export const NEAR_IMPORT_LIMIT_RATIO = 0.8;
export const NEAR_IMPORT_LIMIT_BYTES = Math.floor(
  MAX_IMPORT_FILE_BYTES * NEAR_IMPORT_LIMIT_RATIO
);

/** Limity bezpieczeństwa podczas dekompresji archiwów .zip (ochrona przed ZIP bombami). */
export const MAX_ZIP_ENTRIES = 2000;
export const MAX_ZIP_ENTRY_BYTES = 25 * 1024 * 1024;
export const MAX_ZIP_TOTAL_BYTES = 60 * 1024 * 1024;
export const MAX_ZIP_COMPRESSION_RATIO = 200;
export const ZIP_RATIO_CHECK_MIN_BYTES = 1024 * 1024;

export interface BackupSizeEvaluation {
  bytes: number;
  limitBytes: number;
  ratio: number;
  nearLimit: boolean;
  overLimit: boolean;
}

export function evaluateBackupExportSize(
  bytes: number,
  limitBytes: number = MAX_IMPORT_FILE_BYTES
): BackupSizeEvaluation {
  const safeBytes = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  const safeLimit = limitBytes > 0 ? limitBytes : MAX_IMPORT_FILE_BYTES;
  const ratio = safeBytes / safeLimit;
  return {
    bytes: safeBytes,
    limitBytes: safeLimit,
    ratio,
    overLimit: safeBytes > safeLimit,
    nearLimit: safeBytes <= safeLimit && ratio >= NEAR_IMPORT_LIMIT_RATIO,
  };
}

export function formatFileSizeMiB(bytes: number): string {
  const mib = bytes / (1024 * 1024);
  return `${mib.toFixed(1).replace('.', ',')} MiB`;
}

export const OVERSIZED_BACKUP_RECOVERY_HINT =
  'Aby zmieścić dane w limicie aplikacji, w sesji źródłowej wybierz w zakładce „Kopia JSON” eksport wybranego roku szkolnego albo wyeksportuj osobno paczki nadzoru dla dyrektora lub samą bazę wniosków i szablonów.';

export function validateImportFileMetadata(
  file: Pick<File, 'name' | 'size'>,
  options?: { allowZip?: boolean }
): { ok: true } | { ok: false; error: string } {
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return {
      ok: false,
      error: `Wybrany plik „${file.name || 'bez nazwy'}” jest pusty (0 B). Wybierz prawidłowy plik kopii.`,
    };
  }

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    const recovery = options?.allowZip ? ` ${OVERSIZED_BACKUP_RECOVERY_HINT}` : '';
    return {
      ok: false,
      error: `Plik „${file.name || 'kopia'}” ma rozmiar ${formatFileSizeMiB(file.size)} i przekracza dopuszczalny limit ${MAX_IMPORT_FILE_MIB} MiB. Odczyt przerwano przed wczytaniem do pamięci.${recovery}`,
    };
  }

  return { ok: true };
}

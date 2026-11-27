/**
 * Wspólne limity rozmiaru i zasobów dla importu kopii zapasowych (.json, .zip),
 * paczek nadzoru oraz paczek własnych wniosków i szablonów.
 */
export const MAX_IMPORT_FILE_MIB = 25;
export const MAX_IMPORT_FILE_BYTES = MAX_IMPORT_FILE_MIB * 1024 * 1024;
export const MAX_IMPORT_JSON_CHARS = MAX_IMPORT_FILE_BYTES;

/** Limity bezpieczeństwa podczas dekompresji archiwów .zip (ochrona przed ZIP bombami). */
export const MAX_ZIP_ENTRIES = 2000;
export const MAX_ZIP_ENTRY_BYTES = 25 * 1024 * 1024;
export const MAX_ZIP_TOTAL_BYTES = 60 * 1024 * 1024;
export const MAX_ZIP_COMPRESSION_RATIO = 200;
export const ZIP_RATIO_CHECK_MIN_BYTES = 1024 * 1024;

export function formatFileSizeMiB(bytes: number): string {
  const mib = bytes / (1024 * 1024);
  return `${mib.toFixed(1).replace('.', ',')} MiB`;
}

export const OVERSIZED_BACKUP_RECOVERY_HINT =
  'Aby odzyskać dane z większej kopii: rozpakuj archiwum .zip na komputerze lub zmniejsz plik przed importem (np. dzieląc dokumenty na osobne roczniki albo wczytując osobno wybrane paczki).';

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
    const recovery = options?.allowZip
      ? ` ${OVERSIZED_BACKUP_RECOVERY_HINT}`
      : '';
    return {
      ok: false,
      error: `Plik „${file.name || 'kopia'}” ma rozmiar ${formatFileSizeMiB(file.size)} i przekracza dopuszczalny limit ${MAX_IMPORT_FILE_MIB} MiB. Odczyt przerwano przed wczytaniem do pamięci.${recovery}`,
    };
  }

  return { ok: true };
}

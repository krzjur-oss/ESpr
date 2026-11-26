import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { APP_VERSION } from '../data/changelog';
import { AppState, DOCUMENT_TYPE_LABELS } from '../types/reports';
import { triggerBlobDownload } from './download';
import { recordBackupExportNow } from './storage';

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
    '',
    'Uwaga RODO:',
    'Pliki w archiwum nie są szyfrowane i mogą zawierać dane osobowe uczniów oraz nauczycieli.',
    'Przechowuj archiwum w bezpiecznym miejscu i usuń z urządzeń publicznych po zakończeniu pracy.',
  ];
  entries['README-archiwum.txt'] = strToU8(readmeLines.join('\n'));

  return zipSync(entries, { level: 6 });
}

export function exportStateAsZip(state: AppState): boolean {
  try {
    const zipBytes = buildBackupZipBytes(state);
    const arrayBuffer = zipBytes.slice().buffer;
    const blob = new Blob([arrayBuffer], { type: 'application/zip' });
    const dateTag = new Date().toISOString().slice(0, 10);
    const ok = triggerBlobDownload(blob, `sprawozdania-archiwum-${dateTag}.zip`);
    if (ok) {
      void recordBackupExportNow();
    }
    return ok;
  } catch {
    return false;
  }
}

export function extractBackupJsonFromZip(
  buffer: ArrayBuffer
): { ok: true; jsonText: string } | { ok: false; error: string } {
  try {
    const archive = unzipSync(new Uint8Array(buffer));
    const entry = archive[FULL_BACKUP_ZIP_ENTRY];
    if (entry) {
      return { ok: true, jsonText: strFromU8(entry) };
    }

    const fallbackKey = Object.keys(archive).find(
      (name) =>
        !name.includes('/') &&
        name.toLowerCase().endsWith('.json') &&
        name !== 'profil-nauczyciela.json'
    );
    if (fallbackKey && archive[fallbackKey]) {
      return { ok: true, jsonText: strFromU8(archive[fallbackKey]) };
    }

    return {
      ok: false,
      error:
        'Wybrane archiwum ZIP nie zawiera pliku pełnej kopii (pelna-kopia-esprawozdania.json).',
    };
  } catch {
    return {
      ok: false,
      error: 'Nie udało się rozpakować archiwum ZIP. Sprawdź, czy plik nie jest uszkodzony.',
    };
  }
}

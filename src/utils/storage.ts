import { AppState, CustomWniosekEntry } from '../types/reports';
import { createInitialAppState } from './documentFactory';

function sanitizeCustomWnioski(raw: unknown): CustomWniosekEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is CustomWniosekEntry =>
      !!item &&
      typeof item === 'object' &&
      typeof (item as CustomWniosekEntry).id === 'string' &&
      typeof (item as CustomWniosekEntry).categoryId === 'string' &&
      typeof (item as CustomWniosekEntry).text === 'string' &&
      (item as CustomWniosekEntry).text.trim().length > 0
  );
}

const STORAGE_KEY = 'esprawozdania_local_state_v1';

export function loadAppState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialAppState();
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || typeof parsed !== 'object' || !parsed.profile || !Array.isArray(parsed.documents)) {
      return createInitialAppState();
    }
    const activeId =
      parsed.activeDocumentId && parsed.documents.some((d) => d.id === parsed.activeDocumentId)
        ? parsed.activeDocumentId
        : parsed.documents[0]?.id ?? null;

    return {
      version: parsed.version ?? 1,
      profile: parsed.profile,
      documents: parsed.documents,
      activeDocumentId: activeId,
      customWnioski: sanitizeCustomWnioski(parsed.customWnioski),
    };
  } catch {
    return createInitialAppState();
  }
}

export function saveAppState(state: AppState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportStateAsJson(state: AppState): void {
  const payload = {
    app: 'E-Sprawozdania',
    exportedAt: new Date().toISOString(),
    ...state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateTag = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `sprawozdania-kopia-${dateTag}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateAndParseImportedJson(jsonText: string): {
  ok: true;
  state: AppState;
} | {
  ok: false;
  error: string;
} {
  try {
    const data = JSON.parse(jsonText) as Partial<AppState>;
    if (!data || typeof data !== 'object') {
      return { ok: false, error: 'Plik nie zawiera prawidłowego obiektu JSON.' };
    }
    if (!data.profile || typeof data.profile !== 'object') {
      return { ok: false, error: 'Brak sekcji profilu nauczyciela (profile) w pliku.' };
    }
    if (!Array.isArray(data.documents)) {
      return { ok: false, error: 'Brak listy dokumentów (documents) w pliku.' };
    }

    const validTypes = new Set([
      'efekty_nauczania',
      'zbiorcze_efekty',
      'karta_informacyjna',
      'podsumowanie_specjalisty',
    ]);

    for (const doc of data.documents) {
      if (!doc || typeof doc !== 'object' || !doc.id || !validTypes.has(doc.type)) {
        return { ok: false, error: 'Jeden z dokumentów w pliku ma nieobsługiwany lub uszkodzony format.' };
      }
    }

    const activeDocumentId =
      data.activeDocumentId && data.documents.some((d) => d.id === data.activeDocumentId)
        ? data.activeDocumentId
        : data.documents[0]?.id ?? null;

    return {
      ok: true,
      state: {
        version: data.version ?? 1,
        profile: data.profile,
        documents: data.documents,
        activeDocumentId,
        customWnioski: sanitizeCustomWnioski(data.customWnioski),
      },
    };
  } catch {
    return { ok: false, error: 'Nie udało się odczytać pliku JSON. Sprawdź, czy plik nie jest uszkodzony.' };
  }
}

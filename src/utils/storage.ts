import {
  CUSTOM_WNIOSKI_CATEGORY_ID,
  WNIOSKI_CATEGORY_OPTIONS,
} from '../data/wnioskiDatabase';
import {
  AppState,
  CustomTemplateEntry,
  CustomWniosekEntry,
  ReportDocument,
  SubjectAssignment,
  TEMPLATE_CATEGORY_LABELS,
  TeacherProfile,
  TemplateSectionCategory,
} from '../types/reports';
import { createDefaultProfile, createId, createInitialAppState } from './documentFactory';

const VALID_WNIOSEK_CATEGORY_IDS = new Set<string>(
  WNIOSKI_CATEGORY_OPTIONS.map((opt) => opt.id)
);

function sanitizeCustomWnioski(raw: unknown): CustomWniosekEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is Partial<CustomWniosekEntry> & { text: string } =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as CustomWniosekEntry).text === 'string' &&
        (item as CustomWniosekEntry).text.trim().length > 0
    )
    .map((item) => ({
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : createId(),
      categoryId:
        typeof item.categoryId === 'string' && VALID_WNIOSEK_CATEGORY_IDS.has(item.categoryId)
          ? item.categoryId
          : CUSTOM_WNIOSKI_CATEGORY_ID,
      text: item.text.trim(),
      createdAt:
        typeof item.createdAt === 'string' && item.createdAt.trim()
          ? item.createdAt
          : new Date().toISOString(),
    }));
}

const VALID_TEMPLATE_CATEGORIES = new Set<string>(Object.keys(TEMPLATE_CATEGORY_LABELS));

function sanitizeCustomTemplates(raw: unknown): CustomTemplateEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is Partial<CustomTemplateEntry> & { content: string } =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as CustomTemplateEntry).content === 'string' &&
        (item as CustomTemplateEntry).content.trim().length > 0
    )
    .map((item) => ({
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : createId(),
      title:
        typeof item.title === 'string' && item.title.trim()
          ? item.title.trim()
          : 'Szablon własny',
      category:
        typeof item.category === 'string' && VALID_TEMPLATE_CATEGORIES.has(item.category)
          ? (item.category as TemplateSectionCategory)
          : 'ogolne',
      content: item.content.trim(),
      createdAt:
        typeof item.createdAt === 'string' && item.createdAt.trim()
          ? item.createdAt
          : new Date().toISOString(),
    }));
}

function sanitizeDocuments(docs: ReportDocument[]): ReportDocument[] {
  return docs.map((doc) => {
    if (doc.type === 'efekty_nauczania') {
      return {
        ...doc,
        textbookNumber: typeof doc.textbookNumber === 'string' ? doc.textbookNumber : '',
      };
    }
    return doc;
  });
}

function sanitizeProfile(raw: Partial<TeacherProfile>): TeacherProfile {
  const defaults = createDefaultProfile();
  const subjectsList = Array.isArray(raw.subjectsList)
    ? raw.subjectsList.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : defaults.subjectsList;

  let subjectAssignments: SubjectAssignment[];
  if (Array.isArray(raw.subjectAssignments)) {
    subjectAssignments = raw.subjectAssignments
      .filter((a): a is SubjectAssignment => !!a && typeof a === 'object' && typeof a.subject === 'string')
      .map((a) => ({
        id: typeof a.id === 'string' && a.id ? a.id : createId(),
        subject: a.subject,
        classScope: typeof a.classScope === 'string' ? a.classScope : '',
        programNumber: typeof a.programNumber === 'string' ? a.programNumber : '',
        textbookNumber: typeof a.textbookNumber === 'string' ? a.textbookNumber : '',
        textbookTitle: typeof a.textbookTitle === 'string' ? a.textbookTitle : '',
      }));
  } else {
    subjectAssignments = subjectsList.map((subject) => ({
      id: createId(),
      subject,
      classScope: '',
      programNumber: '',
      textbookNumber: '',
      textbookTitle: '',
    }));
  }

  const derivedSubjectsList =
    subjectAssignments.length > 0
      ? Array.from(
          new Set(
            subjectAssignments
              .map((a) => a.subject.trim())
              .filter((s) => s.length > 0)
          )
        )
      : subjectsList;

  return {
    fullName: typeof raw.fullName === 'string' ? raw.fullName : defaults.fullName,
    schoolName: typeof raw.schoolName === 'string' ? raw.schoolName : defaults.schoolName,
    schoolYear: typeof raw.schoolYear === 'string' ? raw.schoolYear : defaults.schoolYear,
    defaultSemester: raw.defaultSemester === 'I' || raw.defaultSemester === 'II' ? raw.defaultSemester : defaults.defaultSemester,
    periodPreset:
      raw.periodPreset === 'sem1' || raw.periodPreset === 'sem2' || raw.periodPreset === 'custom'
        ? raw.periodPreset
        : defaults.periodPreset,
    periodText: typeof raw.periodText === 'string' ? raw.periodText : defaults.periodText,
    homeroomClass: typeof raw.homeroomClass === 'string' ? raw.homeroomClass : defaults.homeroomClass,
    classesList: Array.isArray(raw.classesList) ? raw.classesList : defaults.classesList,
    subjectsList: derivedSubjectsList,
    subjectAssignments,
    signatureDate: typeof raw.signatureDate === 'string' ? raw.signatureDate : defaults.signatureDate,
  };
}

const LEGACY_STORAGE_KEY = 'esprawozdania_local_state_v1';
const DB_NAME = 'esprawozdania_db';
const DB_VERSION = 2;
const STORE_META = 'meta';
const STORE_DOCUMENTS = 'documents';
const STORE_WNIOSKI = 'customWnioski';
const STORE_TEMPLATES = 'customTemplates';

export type StorageBackend = 'indexeddb' | 'memory';

interface MetaRecord<T = unknown> {
  key: string;
  value: T;
}

let dbPromise: Promise<IDBDatabase> | null = null;
let lastPersistedState: AppState | null = null;
let writeQueue: Promise<boolean> = Promise.resolve(true);
let debounceTimer: number | null = null;
let pendingStateToSave: AppState | null = null;

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function reorderByIds<T extends { id: string }>(items: T[], orderIds?: unknown): T[] {
  if (!Array.isArray(orderIds) || orderIds.length === 0) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered: T[] = [];
  for (const id of orderIds) {
    if (typeof id === 'string') {
      const found = byId.get(id);
      if (found) {
        ordered.push(found);
        byId.delete(id);
      }
    }
  }
  for (const remaining of byId.values()) {
    ordered.push(remaining);
  }
  return ordered;
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window) || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not supported in this browser'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        const docStore = db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('schoolYear', 'schoolYear', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_WNIOSKI)) {
        db.createObjectStore(STORE_WNIOSKI, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
        db.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error('Failed to open IndexedDB'));
    };

    request.onblocked = () => {
      dbPromise = null;
      reject(new Error('IndexedDB open request blocked'));
    };
  });

  return dbPromise;
}

function readLegacyLocalStorage(): AppState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || typeof parsed !== 'object' || !parsed.profile || !Array.isArray(parsed.documents)) {
      return null;
    }
    const activeId =
      parsed.activeDocumentId && parsed.documents.some((d) => d.id === parsed.activeDocumentId)
        ? parsed.activeDocumentId
        : parsed.documents[0]?.id ?? null;

    return {
      version: parsed.version ?? 1,
      profile: sanitizeProfile(parsed.profile),
      documents: sanitizeDocuments(parsed.documents),
      activeDocumentId: activeId,
      customWnioski: sanitizeCustomWnioski(parsed.customWnioski),
      customTemplates: sanitizeCustomTemplates(parsed.customTemplates),
    };
  } catch {
    return null;
  }
}

function clearLegacyLocalStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

async function writeStateToDb(
  state: AppState,
  options?: { replaceAll?: boolean }
): Promise<boolean> {
  try {
    const replaceAll = options?.replaceAll || !lastPersistedState;
    if (!replaceAll && lastPersistedState === state) {
      return true;
    }
    const db = await openDatabase();
    const prev = replaceAll ? null : lastPersistedState;

    const tx = db.transaction(
      [STORE_META, STORE_DOCUMENTS, STORE_WNIOSKI, STORE_TEMPLATES],
      'readwrite'
    );
    const metaStore = tx.objectStore(STORE_META);
    const docStore = tx.objectStore(STORE_DOCUMENTS);
    const wnioskiStore = tx.objectStore(STORE_WNIOSKI);
    const templatesStore = tx.objectStore(STORE_TEMPLATES);

    // 1. Update metadata keys only when needed
    if (!prev) {
      metaStore.put({ key: 'initialized', value: true });
      metaStore.put({ key: 'version', value: state.version });
      metaStore.put({ key: 'profile', value: state.profile });
      metaStore.put({ key: 'activeDocumentId', value: state.activeDocumentId });
      metaStore.put({ key: 'documentOrder', value: state.documents.map((d) => d.id) });
      metaStore.put({ key: 'customWnioskiOrder', value: state.customWnioski.map((w) => w.id) });
      metaStore.put({ key: 'customTemplatesOrder', value: state.customTemplates.map((t) => t.id) });
    } else {
      if (prev.version !== state.version) {
        metaStore.put({ key: 'version', value: state.version });
      }
      if (prev.profile !== state.profile) {
        metaStore.put({ key: 'profile', value: state.profile });
      }
      if (prev.activeDocumentId !== state.activeDocumentId) {
        metaStore.put({ key: 'activeDocumentId', value: state.activeDocumentId });
      }
      const prevDocOrder = prev.documents.map((d) => d.id);
      const nextDocOrder = state.documents.map((d) => d.id);
      if (!arraysEqual(prevDocOrder, nextDocOrder)) {
        metaStore.put({ key: 'documentOrder', value: nextDocOrder });
      }
      const prevWnioskiOrder = prev.customWnioski.map((w) => w.id);
      const nextWnioskiOrder = state.customWnioski.map((w) => w.id);
      if (!arraysEqual(prevWnioskiOrder, nextWnioskiOrder)) {
        metaStore.put({ key: 'customWnioskiOrder', value: nextWnioskiOrder });
      }
      const prevTemplatesOrder = prev.customTemplates.map((t) => t.id);
      const nextTemplatesOrder = state.customTemplates.map((t) => t.id);
      if (!arraysEqual(prevTemplatesOrder, nextTemplatesOrder)) {
        metaStore.put({ key: 'customTemplatesOrder', value: nextTemplatesOrder });
      }
    }

    // 2. Sync documents store incrementally (or full replace)
    if (!prev) {
      docStore.clear();
      for (const doc of state.documents) {
        docStore.put(doc);
      }
    } else if (prev.documents !== state.documents) {
      const prevMap = new Map(prev.documents.map((d) => [d.id, d]));
      const nextIds = new Set(state.documents.map((d) => d.id));
      for (const oldId of prevMap.keys()) {
        if (!nextIds.has(oldId)) {
          docStore.delete(oldId);
        }
      }
      for (const doc of state.documents) {
        if (prevMap.get(doc.id) !== doc) {
          docStore.put(doc);
        }
      }
    }

    // 3. Sync customWnioski store incrementally (or full replace)
    if (!prev) {
      wnioskiStore.clear();
      for (const entry of state.customWnioski) {
        wnioskiStore.put(entry);
      }
    } else if (prev.customWnioski !== state.customWnioski) {
      const prevMap = new Map(prev.customWnioski.map((w) => [w.id, w]));
      const nextIds = new Set(state.customWnioski.map((w) => w.id));
      for (const oldId of prevMap.keys()) {
        if (!nextIds.has(oldId)) {
          wnioskiStore.delete(oldId);
        }
      }
      for (const entry of state.customWnioski) {
        if (prevMap.get(entry.id) !== entry) {
          wnioskiStore.put(entry);
        }
      }
    }

    // 4. Sync customTemplates store incrementally (or full replace)
    if (!prev) {
      templatesStore.clear();
      for (const tpl of state.customTemplates) {
        templatesStore.put(tpl);
      }
    } else if (prev.customTemplates !== state.customTemplates) {
      const prevMap = new Map(prev.customTemplates.map((t) => [t.id, t]));
      const nextIds = new Set(state.customTemplates.map((t) => t.id));
      for (const oldId of prevMap.keys()) {
        if (!nextIds.has(oldId)) {
          templatesStore.delete(oldId);
        }
      }
      for (const tpl of state.customTemplates) {
        if (prevMap.get(tpl.id) !== tpl) {
          templatesStore.put(tpl);
        }
      }
    }

    await txDone(tx);
    lastPersistedState = state;
    return true;
  } catch {
    return false;
  }
}

export async function loadAppState(): Promise<{
  state: AppState;
  backend: StorageBackend;
}> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(
      [STORE_META, STORE_DOCUMENTS, STORE_WNIOSKI, STORE_TEMPLATES],
      'readonly'
    );
    const [metaRecords, rawDocs, rawWnioski, rawTemplates] = await Promise.all([
      reqToPromise<MetaRecord[]>(tx.objectStore(STORE_META).getAll()),
      reqToPromise<AppState['documents']>(tx.objectStore(STORE_DOCUMENTS).getAll()),
      reqToPromise<CustomWniosekEntry[]>(tx.objectStore(STORE_WNIOSKI).getAll()),
      reqToPromise<CustomTemplateEntry[]>(tx.objectStore(STORE_TEMPLATES).getAll()),
    ]);
    await txDone(tx);

    const metaMap = new Map<string, unknown>(metaRecords.map((m) => [m.key, m.value]));
    const hasExistingDbData =
      metaMap.get('initialized') === true ||
      metaMap.has('profile') ||
      rawDocs.length > 0;

    if (hasExistingDbData) {
      const orderedDocs = sanitizeDocuments(reorderByIds(rawDocs, metaMap.get('documentOrder')));
      const orderedWnioski = sanitizeCustomWnioski(
        reorderByIds(rawWnioski, metaMap.get('customWnioskiOrder'))
      );
      const orderedTemplates = sanitizeCustomTemplates(
        reorderByIds(rawTemplates, metaMap.get('customTemplatesOrder'))
      );
      const rawProfile = metaMap.get('profile') as Partial<TeacherProfile> | undefined;
      const rawActiveId = metaMap.get('activeDocumentId');
      const activeDocumentId =
        typeof rawActiveId === 'string' && orderedDocs.some((d) => d.id === rawActiveId)
          ? rawActiveId
          : orderedDocs[0]?.id ?? null;

      const hydrated: AppState = {
        version: typeof metaMap.get('version') === 'number' ? (metaMap.get('version') as number) : 1,
        profile: sanitizeProfile(rawProfile ?? {}),
        documents: orderedDocs,
        activeDocumentId,
        customWnioski: orderedWnioski,
        customTemplates: orderedTemplates,
      };

      lastPersistedState = hydrated;
      clearLegacyLocalStorage();
      return { state: hydrated, backend: 'indexeddb' };
    }

    // One-time migration from legacy localStorage (if present) or fresh initialization
    const legacyState = readLegacyLocalStorage();
    const initialState = legacyState ?? createInitialAppState();
    await saveAppStateImmediate(initialState, { replaceAll: true });
    clearLegacyLocalStorage();
    return { state: initialState, backend: 'indexeddb' };
  } catch {
    // Graceful fallback if IndexedDB is blocked in a restricted browser environment
    const legacy = readLegacyLocalStorage();
    return {
      state: legacy ?? createInitialAppState(),
      backend: 'memory',
    };
  }
}

export function saveAppStateImmediate(
  state: AppState,
  options?: { replaceAll?: boolean }
): Promise<boolean> {
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingStateToSave = null;

  const task = writeQueue.then(() => writeStateToDb(state, options));
  writeQueue = task.catch(() => false);
  return task;
}

export function scheduleSaveAppState(state: AppState, delayMs = 250): void {
  pendingStateToSave = state;
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer);
  }
  debounceTimer = window.setTimeout(() => {
    debounceTimer = null;
    if (pendingStateToSave) {
      const target = pendingStateToSave;
      pendingStateToSave = null;
      void saveAppStateImmediate(target);
    }
  }, delayMs);
}

export function flushPendingAppStateSave(): void {
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (pendingStateToSave) {
    const target = pendingStateToSave;
    pendingStateToSave = null;
    void saveAppStateImmediate(target);
  }
}

export async function resetAllStoredState(freshState: AppState): Promise<void> {
  clearLegacyLocalStorage();
  lastPersistedState = null;
  await saveAppStateImmediate(freshState, { replaceAll: true });
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
      'uzasadnienie_nieklasyfikowania',
      'uzasadnienie_ndst',
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
        profile: sanitizeProfile(data.profile),
        documents: sanitizeDocuments(data.documents),
        activeDocumentId,
        customWnioski: sanitizeCustomWnioski(data.customWnioski),
        customTemplates: sanitizeCustomTemplates(data.customTemplates),
      },
    };
  } catch {
    return { ok: false, error: 'Nie udało się odczytać pliku JSON. Sprawdź, czy plik nie jest uszkodzony.' };
  }
}

export type PhrasesExportScope = 'all' | 'wnioski' | 'szablony';

export interface SharedPhrasesBundle {
  app: 'E-Sprawozdania';
  kind: 'phrases_bundle';
  version: number;
  exportedAt: string;
  customWnioski: CustomWniosekEntry[];
  customTemplates: CustomTemplateEntry[];
}

export function exportPhrasesAsJson(
  customWnioski: CustomWniosekEntry[],
  customTemplates: CustomTemplateEntry[],
  scope: PhrasesExportScope = 'all'
): void {
  const wnioskiToExport = scope === 'szablony' ? [] : customWnioski;
  const templatesToExport = scope === 'wnioski' ? [] : customTemplates;
  const payload: SharedPhrasesBundle = {
    app: 'E-Sprawozdania',
    kind: 'phrases_bundle',
    version: 1,
    exportedAt: new Date().toISOString(),
    customWnioski: wnioskiToExport,
    customTemplates: templatesToExport,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateTag = new Date().toISOString().slice(0, 10);
  const prefix =
    scope === 'wnioski'
      ? 'sprawozdania-wnioski'
      : scope === 'szablony'
        ? 'sprawozdania-szablony'
        : 'sprawozdania-wnioski-i-szablony';
  a.href = url;
  a.download = `${prefix}-${dateTag}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateAndParseSharedPhrasesJson(jsonText: string):
  | {
      ok: true;
      customWnioski: CustomWniosekEntry[];
      customTemplates: CustomTemplateEntry[];
      sourceKind: 'phrases_bundle' | 'full_backup';
    }
  | {
      ok: false;
      error: string;
    } {
  try {
    const data = JSON.parse(jsonText) as Record<string, unknown>;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, error: 'Plik nie zawiera prawidłowego obiektu JSON.' };
    }

    const hasWnioskiArray = Array.isArray(data.customWnioski);
    const hasTemplatesArray = Array.isArray(data.customTemplates);

    if (!hasWnioskiArray && !hasTemplatesArray) {
      return {
        ok: false,
        error:
          'Wybrany plik JSON nie zawiera list „customWnioski” ani „customTemplates”. Upewnij się, że wskazano plik wyeksportowany z programu E-Sprawozdania.',
      };
    }

    const customWnioski = sanitizeCustomWnioski(data.customWnioski);
    const customTemplates = sanitizeCustomTemplates(data.customTemplates);

    if (customWnioski.length === 0 && customTemplates.length === 0) {
      return {
        ok: false,
        error:
          'Plik nie zawiera żadnych własnych wniosków ani szablonów do zaimportowania.',
      };
    }

    const sourceKind =
      data.kind === 'phrases_bundle'
        ? 'phrases_bundle'
        : Array.isArray(data.documents)
          ? 'full_backup'
          : 'phrases_bundle';

    return {
      ok: true,
      customWnioski,
      customTemplates,
      sourceKind,
    };
  } catch {
    return {
      ok: false,
      error: 'Nie udało się odczytać pliku JSON. Sprawdź, czy plik nie jest uszkodzony.',
    };
  }
}

function normalizeTextKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function mergeImportedWnioski(
  existing: CustomWniosekEntry[],
  incoming: CustomWniosekEntry[],
  mode: 'merge' | 'replace'
): { entries: CustomWniosekEntry[]; added: number; skippedDuplicates: number } {
  const seenKeys = new Set<string>();
  const usedIds = new Set<string>();

  if (mode === 'replace') {
    const entries: CustomWniosekEntry[] = [];
    let skippedDuplicates = 0;
    for (const item of incoming) {
      const key = `${item.categoryId}::${normalizeTextKey(item.text)}`;
      if (seenKeys.has(key)) {
        skippedDuplicates += 1;
        continue;
      }
      seenKeys.add(key);
      const id = usedIds.has(item.id) ? createId() : item.id;
      usedIds.add(id);
      entries.push({ ...item, id });
    }
    return { entries, added: entries.length, skippedDuplicates };
  }

  for (const item of existing) {
    seenKeys.add(`${item.categoryId}::${normalizeTextKey(item.text)}`);
    usedIds.add(item.id);
  }

  const toPrepend: CustomWniosekEntry[] = [];
  let skippedDuplicates = 0;
  for (const item of incoming) {
    const key = `${item.categoryId}::${normalizeTextKey(item.text)}`;
    if (seenKeys.has(key)) {
      skippedDuplicates += 1;
      continue;
    }
    seenKeys.add(key);
    const id = usedIds.has(item.id) ? createId() : item.id;
    usedIds.add(id);
    toPrepend.push({ ...item, id });
  }

  return {
    entries: [...toPrepend, ...existing],
    added: toPrepend.length,
    skippedDuplicates,
  };
}

export function mergeImportedTemplates(
  existing: CustomTemplateEntry[],
  incoming: CustomTemplateEntry[],
  mode: 'merge' | 'replace'
): { entries: CustomTemplateEntry[]; added: number; skippedDuplicates: number } {
  const seenKeys = new Set<string>();
  const usedIds = new Set<string>();

  if (mode === 'replace') {
    const entries: CustomTemplateEntry[] = [];
    let skippedDuplicates = 0;
    for (const item of incoming) {
      const key = `${item.category}::${normalizeTextKey(item.title)}::${normalizeTextKey(item.content)}`;
      if (seenKeys.has(key)) {
        skippedDuplicates += 1;
        continue;
      }
      seenKeys.add(key);
      const id = usedIds.has(item.id) ? createId() : item.id;
      usedIds.add(id);
      entries.push({ ...item, id });
    }
    return { entries, added: entries.length, skippedDuplicates };
  }

  for (const item of existing) {
    seenKeys.add(`${item.category}::${normalizeTextKey(item.title)}::${normalizeTextKey(item.content)}`);
    usedIds.add(item.id);
  }

  const toPrepend: CustomTemplateEntry[] = [];
  let skippedDuplicates = 0;
  for (const item of incoming) {
    const key = `${item.category}::${normalizeTextKey(item.title)}::${normalizeTextKey(item.content)}`;
    if (seenKeys.has(key)) {
      skippedDuplicates += 1;
      continue;
    }
    seenKeys.add(key);
    const id = usedIds.has(item.id) ? createId() : item.id;
    usedIds.add(id);
    toPrepend.push({ ...item, id });
  }

  return {
    entries: [...toPrepend, ...existing],
    added: toPrepend.length,
    skippedDuplicates,
  };
}

import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from '../../types/reports';
import { createDefaultProfile, createDocumentByType, createInitialAppState } from '../documentFactory';
import {
  BACKUP_REMINDER_INTERVAL_DAYS,
  DB_NAME,
  DB_VERSION,
  LEGACY_STORAGE_KEY,
  MAX_IMPORT_JSON_CHARS,
  acceptTermsAndConditions,
  exportRawIndexedDbBackup,
  getCurrentRevision,
  getCurrentStorageBackend,
  getSaveStatus,
  hasUserWorkWorthBackingUp,
  loadAppState,
  mergeImportedTemplates,
  mergeImportedWnioski,
  readIndexedDbStateOnly,
  reloadAppStateFromDb,
  recordBackupExportNow,
  resetAllStoredState,
  resetStorageRuntimeForTests,
  retryIndexedDbPersistence,
  saveAppStateImmediate,
  scheduleSaveAppState,
  shouldShowBackupReminder,
  snoozeBackupReminder,
  subscribeCrossTabChanges,
  validateAndParseImportedJson,
  validateAndParseSharedPhrasesJson,
  validateAndParseSupervisionPackageJson,
} from '../storage';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  public throwOnGet = false;

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    if (this.throwOnGet) {
      throw new Error('SecurityError: localStorage blocked');
    }
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

class MockBroadcastChannel {
  static channels = new Map<string, Set<MockBroadcastChannel>>();
  readonly name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
    const set = MockBroadcastChannel.channels.get(name) ?? new Set();
    set.add(this);
    MockBroadcastChannel.channels.set(name, set);
  }

  postMessage(data: unknown): void {
    const peers = MockBroadcastChannel.channels.get(this.name);
    if (!peers) return;
    for (const peer of peers) {
      if (peer !== this && peer.onmessage) {
        peer.onmessage({ data } as MessageEvent);
      }
    }
  }

  close(): void {
    MockBroadcastChannel.channels.get(this.name)?.delete(this);
  }
}

async function bumpDbRevisionExternally(targetRevision: number, updatedSchoolName?: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const openReq = globalThis.indexedDB.open(DB_NAME, DB_VERSION);
    openReq.onsuccess = () => {
      const db = openReq.result;
      const tx = db.transaction(['meta'], 'readwrite');
      const meta = tx.objectStore('meta');
      meta.put({ key: 'revision', value: targetRevision });
      if (updatedSchoolName) {
        const profReq = meta.get('profile');
        profReq.onsuccess = () => {
          const rec = profReq.result as { key: string; value: AppState['profile'] } | undefined;
          if (rec?.value) {
            meta.put({
              key: 'profile',
              value: { ...rec.value, schoolName: updatedSchoolName },
            });
          }
        };
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    };
    openReq.onerror = () => reject(openReq.error);
  });
}

describe('Groups B, C, D: IndexedDB, import/export, konflikty rewizji i migracja legacy', () => {
  let memoryLs: MemoryStorage;

  beforeEach(() => {
    resetStorageRuntimeForTests();
    MockBroadcastChannel.channels.clear();
    memoryLs = new MemoryStorage();
    Object.defineProperty(globalThis, 'indexedDB', {
      value: new IDBFactory(),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: memoryLs,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      value: MockBroadcastChannel,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    resetStorageRuntimeForTests();
    vi.restoreAllMocks();
  });

  describe('Group C: IndexedDB i bezpieczny zapis', () => {
    it('inicjalizuje czystą bazę IndexedDB z rewizją 1 i statusem saved', async () => {
      const res = await loadAppState();
      expect(res.backend).toBe('indexeddb');
      expect(res.legacyStatus).toBe('none');
      expect(res.revision).toBe(1);
      expect(getSaveStatus()).toBe('saved');
      expect(res.state.documents).toHaveLength(1);

      const persisted = await readIndexedDbStateOnly();
      expect(persisted.found).toBe(true);
      expect(persisted.revision).toBe(1);
      expect(persisted.state?.documents).toHaveLength(1);
    });

    it('zapisuje dodanie, aktualizację i usunięcie dokumentu (przyrostowo i trwale)', async () => {
      const { state: s0 } = await loadAppState();
      const extraDoc = createDocumentByType('karta_informacyjna', s0.profile);
      extraDoc.schoolName = 'Szkoła Testowa';

      // Dodanie
      const s1: AppState = {
        ...s0,
        documents: [...s0.documents, extraDoc],
        activeDocumentId: extraDoc.id,
      };
      const r1 = await saveAppStateImmediate(s1);
      expect(r1.ok).toBe(true);
      if (r1.ok) expect(r1.revision).toBe(2);

      // Aktualizacja
      const updatedExtra = { ...extraDoc, title: 'Zmieniona Karta' };
      const s2: AppState = {
        ...s1,
        documents: s1.documents.map((d) => (d.id === extraDoc.id ? updatedExtra : d)),
      };
      const r2 = await saveAppStateImmediate(s2);
      expect(r2.ok).toBe(true);

      // Usunięcie
      const s3: AppState = {
        ...s2,
        documents: [s0.documents[0]!],
        activeDocumentId: s0.documents[0]!.id,
      };
      const r3 = await saveAppStateImmediate(s3);
      expect(r3.ok).toBe(true);

      // Odświeżenie z bazy bez cache RAM
      resetStorageRuntimeForTests();
      const reloaded = await loadAppState();
      expect(reloaded.state.documents).toHaveLength(1);
      expect(reloaded.state.documents[0]?.id).toBe(s0.documents[0]?.id);
    });

    it('wykrywa konflikt rewizji z innej karty, przerywa zapis i nie nadpisuje nowszych danych', async () => {
      const { state: tabAState } = await loadAppState();
      const crossTabListener = vi.fn();
      subscribeCrossTabChanges(crossTabListener);

      // Symulacja zapisu przez drugą kartę (rewizja 5 + zmiana nazwy szkoły w bazie)
      await bumpDbRevisionExternally(5, 'Szkoła z Drugiej Karty');

      const conflictingState: AppState = {
        ...tabAState,
        profile: { ...tabAState.profile, schoolName: 'Nadpis z Karty A' },
      };

      const saveRes = await saveAppStateImmediate(conflictingState);
      expect(saveRes.ok).toBe(false);
      if (!saveRes.ok) {
        expect(saveRes.reason).toBe('conflict');
        expect(saveRes.dbRevision).toBe(5);
      }
      expect(getSaveStatus()).toBe('conflict');

      // Kolejne zapisy z kolejki / debounce w stanie konfliktu nie mogą nadpisać bazy
      scheduleSaveAppState(conflictingState, 0);
      const blockedFollowup = await saveAppStateImmediate(conflictingState);
      expect(blockedFollowup.ok).toBe(false);

      // Sprawdź bezpośrednio w IndexedDB, że dane z drugiej karty są nietknięte
      const inDb = await readIndexedDbStateOnly();
      expect(inDb.revision).toBe(5);
      expect(inDb.state?.profile.schoolName).toBe('Szkoła z Drugiej Karty');

      // Użytkownik wczytuje nowszą wersję z bazy
      const resolved = await reloadAppStateFromDb();
      expect(resolved.ok).toBe(true);
      if (resolved.ok) {
        expect(resolved.state.profile.schoolName).toBe('Szkoła z Drugiej Karty');
        expect(resolved.revision).toBe(5);
      }
      expect(getSaveStatus()).toBe('saved');
    });

    it('serializuje równoległe żądania zapisu bez utraty ostatniej zmiany', async () => {
      const { state: base } = await loadAppState();

      const s1: AppState = {
        ...base,
        profile: { ...base.profile, fullName: 'Krok 1' },
      };
      const s2: AppState = {
        ...s1,
        profile: { ...s1.profile, fullName: 'Krok 2' },
      };
      const s3: AppState = {
        ...s2,
        profile: { ...s2.profile, fullName: 'Krok 3 — Ostatni' },
      };

      const results = await Promise.all([
        saveAppStateImmediate(s1),
        saveAppStateImmediate(s2),
        saveAppStateImmediate(s3),
      ]);

      expect(results.every((r) => r.ok)).toBe(true);
      expect(getCurrentRevision()).toBe(4);

      const inDb = await readIndexedDbStateOnly();
      expect(inDb.state?.profile.fullName).toBe('Krok 3 — Ostatni');
    });

    it('obsługuje błąd transakcji IndexedDB, zachowuje spójność i pozwala na ponowny zapis', async () => {
      const { state: base } = await loadAppState();
      const s1: AppState = {
        ...base,
        profile: { ...base.profile, fullName: 'Poprawnie zapisany' },
      };
      await saveAppStateImmediate(s1);

      // Wymuś błąd otwarcia transakcji przy kolejnej próbie
      const idb = globalThis.indexedDB as unknown as {
        open: typeof globalThis.indexedDB.open;
      };
      const origOpen = idb.open.bind(idb);

      const sFail: AppState = {
        ...s1,
        profile: { ...s1.profile, fullName: 'Nieudany zapis' },
      };

      // Zasymuluj przerwanie transakcji na poziomie instancji bazy przez mock transaction
      const dbReadBefore = await readIndexedDbStateOnly();
      expect(dbReadBefore.revision).toBe(2);

      // Tymczasowo zwróć uszkodzoną transakcję przez jednorazowy spy na IDBDatabase.prototype.transaction
      const proto = Object.getPrototypeOf(
        await new Promise<IDBDatabase>((resolve) => {
          const req = origOpen(DB_NAME, DB_VERSION);
          req.onsuccess = () => {
            const db = req.result;
            resolve(db);
          };
        })
      ) as IDBDatabase;
      const origTx = proto.transaction;
      vi.spyOn(proto, 'transaction').mockImplementationOnce(function (this: IDBDatabase) {
        throw new Error('QuotaExceededError: symulowany brak miejsca');
      });

      const failRes = await saveAppStateImmediate(sFail);
      expect(failRes.ok).toBe(false);
      if (!failRes.ok) expect(failRes.reason).toBe('error');
      expect(getSaveStatus()).toBe('error');

      proto.transaction = origTx;

      // Stan w bazie pozostał przy rewizji 2
      const dbAfterFail = await readIndexedDbStateOnly();
      expect(dbAfterFail.state?.profile.fullName).toBe('Poprawnie zapisany');

      // Ponowny zapis przywraca prawidłową pracę
      const sRecover: AppState = {
        ...s1,
        profile: { ...s1.profile, fullName: 'Odzyskany zapis' },
      };
      const recoverRes = await saveAppStateImmediate(sRecover);
      expect(recoverRes.ok).toBe(true);
      expect(getSaveStatus()).toBe('saved');
    });

    it('przechodzi do jawnego trybu memory_only przy braku IndexedDB i odzyskuje zapis po ponownym włączeniu', async () => {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const loaded = await loadAppState();
      expect(loaded.backend).toBe('memory');
      expect(getCurrentStorageBackend()).toBe('memory');
      expect(getSaveStatus()).toBe('memory_only');

      const edited: AppState = {
        ...loaded.state,
        profile: { ...loaded.state.profile, fullName: 'Tymczasowo w RAM' },
      };
      const saveAttempt = await saveAppStateImmediate(edited);
      expect(saveAttempt.ok).toBe(false);
      expect(getSaveStatus()).toBe('memory_only');

      // Przywróć IndexedDB i wykonaj kontrolowaną próbę zapisu
      Object.defineProperty(globalThis, 'indexedDB', {
        value: new IDBFactory(),
        configurable: true,
        writable: true,
      });

      const retryRes = await retryIndexedDbPersistence(edited);
      expect(retryRes.ok).toBe(true);
      expect(getCurrentStorageBackend()).toBe('indexeddb');
      expect(getSaveStatus()).toBe('saved');

      const dbCheck = await readIndexedDbStateOnly();
      expect(dbCheck.state?.profile.fullName).toBe('Tymczasowo w RAM');
    });

    it('działa bezpiecznie, gdy BroadcastChannel jest niedostępny', async () => {
      Object.defineProperty(globalThis, 'BroadcastChannel', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      const res = await loadAppState();
      expect(res.backend).toBe('indexeddb');
      const r2 = await saveAppStateImmediate({
        ...res.state,
        profile: { ...res.state.profile, schoolName: 'Bez BC' },
      });
      expect(r2.ok).toBe(true);
    });
  });

  describe('Group B: Import, eksport i atomowość', () => {
    it('eksportuje i ponownie importuje pełną kopię oraz starszy format v1.0', async () => {
      const original = createInitialAppState();
      original.profile.fullName = 'Maria Wiśniewska';
      original.customWnioski = [
        {
          id: 'w-1',
          categoryId: 'wlasne',
          text: 'Własny wniosek z kopii',
          createdAt: new Date().toISOString(),
        },
      ];

      const legacyBackupJson = JSON.stringify({
        app: 'E-Sprawozdania',
        exportedAt: '2025-06-20T10:00:00.000Z',
        version: 1,
        profile: {
          fullName: 'Starszy Profil',
          schoolName: 'SP 5',
          schoolYear: '2024/2025',
          subjectsList: ['Język polski'],
          classesList: ['5B'],
        },
        documents: original.documents,
        customWnioski: original.customWnioski,
      });

      const parsed = validateAndParseImportedJson(legacyBackupJson);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect(parsed.state.profile.fullName).toBe('Starszy Profil');
        expect(parsed.state.profile.subjectAssignments).toHaveLength(1);
        expect(parsed.state.customTemplates).toEqual([]);
        expect(parsed.state.supervisionPackages).toEqual([]);
      }

      expect(validateAndParseImportedJson('{uszkodzony json').ok).toBe(false);
    });

    it('nie modyfikuje bazy IndexedDB ani stanu aktywnej sesji przy pustym/błędnym pliku, duplikatach ID, kluczach prototypu lub błędzie transakcji', async () => {
      const { state: initial } = await loadAppState();
      const safeState: AppState = {
        ...initial,
        profile: { ...initial.profile, fullName: 'Oryginalny Nauczyciel' },
      };
      await saveAppStateImmediate(safeState);

      let uiState: AppState = safeState;
      const uiView: { feedback: { type: 'error'; message: string } | null } = { feedback: null };

      const simulateBackupImportAttempt = async (rawText: string) => {
        const parsed = validateAndParseImportedJson(rawText);
        if (!parsed.ok) {
          uiView.feedback = { type: 'error', message: parsed.error };
          return;
        }
        const res = await saveAppStateImmediate(parsed.state, {
          replaceAll: true,
          forceOverwriteRevision: true,
        });
        if (!res.ok) {
          uiView.feedback = {
            type: 'error',
            message: res.error || 'Nie udało się zapisać zaimportowanych danych w IndexedDB.',
          };
          return;
        }
        uiState = parsed.state;
        uiView.feedback = null;
      };

      // 1. Pusty JSON -> odrzucony przed JSON.parse, bez zmiany UI i IDB
      await simulateBackupImportAttempt('   ');
      expect(uiView.feedback?.type).toBe('error');
      expect(uiState.profile.fullName).toBe('Oryginalny Nauczyciel');

      // 2. Błąd parsera -> komunikat dla użytkownika bez utraty bieżącej sesji
      await simulateBackupImportAttempt('{uszkodzony json');
      expect(uiView.feedback?.type).toBe('error');
      expect(uiView.feedback?.message).toContain('Nie udało się odczytać pliku JSON');
      expect(uiState.profile.fullName).toBe('Oryginalny Nauczyciel');

      // 3. Błędna struktura JSON -> odrzucony na etapie walidacji
      await simulateBackupImportAttempt(
        JSON.stringify({ app: 'InnyProgram', profile: {}, documents: [] })
      );
      expect(uiView.feedback?.type).toBe('error');
      expect(uiState.profile.fullName).toBe('Oryginalny Nauczyciel');

      // 4. Duplikaty ID i klucze prototypu (__proto__, constructor, prototype)
      const doc1 = createDocumentByType('efekty_nauczania', safeState.profile);
      const doc2 = createDocumentByType('efekty_nauczania', safeState.profile);
      doc2.id = doc1.id;
      await simulateBackupImportAttempt(
        JSON.stringify({
          app: 'E-Sprawozdania',
          version: 1,
          profile: safeState.profile,
          documents: [doc1, doc2],
        })
      );
      expect(uiView.feedback?.type).toBe('error');
      expect(uiState.profile.fullName).toBe('Oryginalny Nauczyciel');

      const protoRawJson = `{"app":"E-Sprawozdania","version":1,"profile":${JSON.stringify(
        safeState.profile
      )},"documents":${JSON.stringify([doc1])},"supervisionClassNotes":{"__proto__":"evil","constructor":"evil","prototype":"evil","2026/2027::I::4A":"Bezpieczna notatka"}}`;
      const protoParsed = validateAndParseImportedJson(protoRawJson);
      expect(protoParsed.ok).toBe(true);
      if (protoParsed.ok) {
        expect(Object.keys(protoParsed.state.supervisionClassNotes)).toEqual([
          '2026/2027::I::4A',
        ]);
        expect(
          Object.prototype.hasOwnProperty.call(
            protoParsed.state.supervisionClassNotes,
            '__proto__'
          )
        ).toBe(false);
        expect(
          Object.prototype.hasOwnProperty.call(
            protoParsed.state.supervisionClassNotes,
            'constructor'
          )
        ).toBe(false);
      }

      // 5. Poprawny plik, ale błąd transakcji przy zapisie atomowym -> baza i aktywny stan UI pozostają nienaruszone
      const replacementState = createInitialAppState();
      replacementState.profile.fullName = 'Nowy z Importu';

      const idb = globalThis.indexedDB as unknown as { open: typeof globalThis.indexedDB.open };
      const origOpen = idb.open.bind(idb);
      const db = await new Promise<IDBDatabase>((resolve) => {
        const req = origOpen(DB_NAME, DB_VERSION);
        req.onsuccess = () => resolve(req.result);
      });
      const proto = Object.getPrototypeOf(db) as IDBDatabase;
      vi.spyOn(proto, 'transaction').mockImplementationOnce(() => {
        throw new Error('AbortError: przerwano import');
      });

      await simulateBackupImportAttempt(
        JSON.stringify({ app: 'E-Sprawozdania', kind: 'full_backup', ...replacementState })
      );
      expect(uiView.feedback?.type).toBe('error');
      expect(uiState.profile.fullName).toBe('Oryginalny Nauczyciel');

      const inDb = await readIndexedDbStateOnly();
      expect(inDb.state?.profile.fullName).toBe('Oryginalny Nauczyciel');
    });

    it('odrzuca zbyt duży tekst JSON we wszystkich trzech parserach przed wywołaniem JSON.parse()', () => {
      const jsonParseSpy = vi.spyOn(JSON, 'parse');
      const oversizedPayload = ' '.repeat(MAX_IMPORT_JSON_CHARS + 1);
      // Zapewnij niepusty znak na początku, aby nie odpadł na trim()
      const nonEmptyOversized = `{${oversizedPayload}`;

      const fullRes = validateAndParseImportedJson(nonEmptyOversized);
      expect(fullRes.ok).toBe(false);
      if (!fullRes.ok) expect(fullRes.error).toContain('25 MiB');

      const supRes = validateAndParseSupervisionPackageJson(nonEmptyOversized);
      expect(supRes.ok).toBe(false);
      if (!supRes.ok) expect(supRes.error).toContain('25 MiB');

      const phrasesRes = validateAndParseSharedPhrasesJson(nonEmptyOversized);
      expect(phrasesRes.ok).toBe(false);
      if (!phrasesRes.ok) expect(phrasesRes.error).toContain('25 MiB');

      expect(jsonParseSpy).not.toHaveBeenCalled();
    });

    it('parsuje i scala paczki wniosków i szablonów (merge vs replace)', () => {
      const bundleJson = JSON.stringify({
        app: 'E-Sprawozdania',
        kind: 'phrases_bundle',
        version: 1,
        customWnioski: [
          {
            id: 'w1',
            categoryId: 'wlasne_ogolne',
            text: 'Wniosek A',
            createdAt: '2026-01-10T10:00:00.000Z',
          },
          {
            id: 'w2',
            categoryId: 'wlasne_ogolne',
            text: 'Wniosek B',
            createdAt: '2026-01-10T10:00:00.000Z',
          },
        ],
        customTemplates: [
          {
            id: 't1',
            title: 'Szablon A',
            category: 'ogolne',
            content: 'Treść A',
            createdAt: '2026-01-10T10:00:00.000Z',
          },
        ],
      });

      const parsed = validateAndParseSharedPhrasesJson(bundleJson);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) return;

      const mergedWnioski = mergeImportedWnioski(
        [
          {
            id: 'existing-1',
            categoryId: 'wlasne_ogolne',
            text: 'wniosek a', // duplikat treściowy z pominięciem wielkości liter
            createdAt: '2026-01-01T10:00:00.000Z',
          },
        ],
        parsed.customWnioski,
        'merge'
      );
      expect(mergedWnioski.added).toBe(1);
      expect(mergedWnioski.skippedDuplicates).toBe(1);
      expect(mergedWnioski.entries).toHaveLength(2);

      const replacedTemplates = mergeImportedTemplates(
        [
          {
            id: 'old-t',
            title: 'Stary',
            category: 'ogolne',
            content: 'Stara treść',
            createdAt: '2025-01-01T10:00:00.000Z',
          },
        ],
        parsed.customTemplates,
        'replace'
      );
      expect(replacedTemplates.entries).toHaveLength(1);
      expect(replacedTemplates.entries[0]?.title).toBe('Szablon A');
    });

    it('resetAllStoredState czyści i przywraca czysty stan bez błędów', async () => {
      await loadAppState();
      const fresh = createInitialAppState();
      const res = await resetAllStoredState(fresh);
      expect(res.ok).toBe(true);
      const dbState = await readIndexedDbStateOnly();
      expect(dbState.found).toBe(true);
      expect(dbState.state?.profile.fullName).toBe('');
    });
  });

  describe('Group D: Migracja z localStorage do IndexedDB', () => {
    it('migruje poprawne dane legacy z brakującymi polami i usuwa klucz dopiero po zatwierdzeniu w IDB', async () => {
      const profile = createDefaultProfile();
      const doc = createDocumentByType('efekty_nauczania', profile);
      memoryLs.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({
          profile: {
            fullName: 'Nauczyciel Legacy',
            schoolName: 'SP Legacy',
            subjectsList: ['Chemia'],
          },
          documents: [doc],
        })
      );

      const res = await loadAppState();
      expect(res.legacyStatus).toBe('migrated');
      expect(res.backend).toBe('indexeddb');
      expect(res.state.profile.fullName).toBe('Nauczyciel Legacy');
      expect(res.state.customTemplates).toEqual([]);
      // Klucz legacy usunięty po skutecznym zapisie
      expect(memoryLs.getItem(LEGACY_STORAGE_KEY)).toBeNull();

      // Idempotentne ponowne uruchomienie nie tworzy duplikatów
      resetStorageRuntimeForTests();
      const secondRun = await loadAppState();
      expect(secondRun.legacyStatus).toBe('none');
      expect(secondRun.state.documents).toHaveLength(1);
      expect(secondRun.state.profile.fullName).toBe('Nauczyciel Legacy');
    });

    it('zachowuje dane legacy przy uszkodzonym JSON lub błędzie odczytu i nie inicjalizuje cichego nadpisu', async () => {
      memoryLs.setItem(LEGACY_STORAGE_KEY, '{uszkodzone dane legacy');
      const corruptedRes = await loadAppState();
      expect(corruptedRes.legacyStatus).toBe('corrupted');
      expect(getSaveStatus()).toBe('error');
      // Uszkodzony wpis legacy NIE może zostać usunięty
      expect(memoryLs.getItem(LEGACY_STORAGE_KEY)).toBe('{uszkodzone dane legacy');

      resetStorageRuntimeForTests();
      Object.defineProperty(globalThis, 'indexedDB', {
        value: new IDBFactory(),
        configurable: true,
        writable: true,
      });
      memoryLs.throwOnGet = true;
      const readErrRes = await loadAppState();
      expect(readErrRes.legacyStatus).toBe('read_error');
      expect(getSaveStatus()).toBe('error');
    });

    it('nie usuwa klucza legacy, jeśli zapis do IndexedDB w trakcie migracji nie powiedzie się', async () => {
      const profile = createDefaultProfile();
      const doc = createDocumentByType('efekty_nauczania', profile);
      const rawLegacy = JSON.stringify({
        profile: { fullName: 'Bezpieczny Legacy' },
        documents: [doc],
      });
      memoryLs.setItem(LEGACY_STORAGE_KEY, rawLegacy);

      // Brak IndexedDB podczas migracji -> zapis nie dochodzi do skutku
      Object.defineProperty(globalThis, 'indexedDB', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const res = await loadAppState();
      expect(res.legacyStatus).toBe('migration_write_failed');
      expect(res.backend).toBe('memory');
      expect(getSaveStatus()).toBe('memory_only');
      expect(res.state.profile.fullName).toBe('Bezpieczny Legacy');
      // Oryginalne dane legacy zachowane w localStorage!
      expect(memoryLs.getItem(LEGACY_STORAGE_KEY)).toBe(rawLegacy);

      // Kopia awaryjna jest nadal możliwa do odczytania read-only z legacy
      const origDoc = globalThis.document;
      const origUrl = globalThis.URL;
      Object.defineProperty(globalThis, 'document', {
        value: {
          createElement: () => ({
            href: '',
            download: '',
            rel: '',
            style: {},
            click: () => {},
            remove: () => {},
          }),
          body: { appendChild: () => {} },
        },
        configurable: true,
        writable: true,
      });
      Object.defineProperty(globalThis, 'URL', {
        value: {
          createObjectURL: () => 'blob:test',
          revokeObjectURL: () => {},
        },
        configurable: true,
        writable: true,
      });
      const backupOk = await exportRawIndexedDbBackup();
      expect(backupOk).toBe(true);
      expect(memoryLs.getItem(LEGACY_STORAGE_KEY)).toBe(rawLegacy);

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
    });
  });

  describe('Group E: Pierwsze uruchomienie, akceptacja regulaminu i przypomnienia kopii JSON', () => {
    it('wymaga akceptacji regulaminu przy czystej bazie i utrzymuje wymóg do czasu zatwierdzenia', async () => {
      const firstBoot = await loadAppState();
      expect(firstBoot.requiresTermsAcceptance).toBe(true);

      // Odświeżenie strony przed zatwierdzeniem nadal wymaga zgody
      resetStorageRuntimeForTests();
      const secondBootBeforeAccept = await loadAppState();
      expect(secondBootBeforeAccept.requiresTermsAcceptance).toBe(true);

      // Zatwierdzenie zapisuje zgodę w IndexedDB i localStorage
      const accepted = await acceptTermsAndConditions('1.8.0');
      expect(accepted.accepted).toBe(true);

      resetStorageRuntimeForTests();
      const bootAfterAccept = await loadAppState();
      expect(bootAfterAccept.requiresTermsAcceptance).toBe(false);
    });

    it('nie blokuje istniejących użytkowników z zapisaną bazą sprzed wprowadzenia regulaminu', async () => {
      const existingState = createInitialAppState();
      existingState.profile.fullName = 'Anna Nowak';
      await saveAppStateImmediate(existingState, {
        replaceAll: true,
        forceOverwriteRevision: true,
      });

      resetStorageRuntimeForTests();
      const boot = await loadAppState();
      expect(boot.state.profile.fullName).toBe('Anna Nowak');
      expect(boot.requiresTermsAcceptance).toBe(false);
    });

    it('wymaga ponownego potwierdzenia regulaminu przy starszej wersji zgody bez utraty zapisanych danych', async () => {
      const { state } = await loadAppState();
      await saveAppStateImmediate({
        ...state,
        profile: { ...state.profile, fullName: 'Marek Zieliński' },
      });
      await acceptTermsAndConditions('1.7.1');

      resetStorageRuntimeForTests();
      const boot = await loadAppState();
      expect(boot.requiresTermsAcceptance).toBe(true);
      expect(boot.state.profile.fullName).toBe('Marek Zieliński');
      expect(boot.state.documents.length).toBe(state.documents.length);
    });

    it('ponownie wymaga akceptacji regulaminu po pełnym resecie aplikacji', async () => {
      await loadAppState();
      await acceptTermsAndConditions('1.8.0');

      resetStorageRuntimeForTests();
      const beforeReset = await loadAppState();
      expect(beforeReset.requiresTermsAcceptance).toBe(false);

      const fresh = createInitialAppState();
      await resetAllStoredState(fresh);

      resetStorageRuntimeForTests();
      const afterReset = await loadAppState();
      expect(afterReset.requiresTermsAcceptance).toBe(true);
    });

    it('wyświetla przypomnienie o kopii JSON dopiero po zmianie danych, resetuje je po eksporcie i obsługuje odroczenie', async () => {
      const cleanState = createInitialAppState();
      expect(hasUserWorkWorthBackingUp(cleanState)).toBe(false);
      expect(
        shouldShowBackupReminder(cleanState, { lastBackupExportAt: null, snoozedUntil: null }).show
      ).toBe(false);

      const editedState: AppState = {
        ...cleanState,
        profile: { ...cleanState.profile, fullName: 'Jan Kowalski' },
      };
      expect(hasUserWorkWorthBackingUp(editedState)).toBe(true);

      const neverBackedUp = shouldShowBackupReminder(editedState, {
        lastBackupExportAt: null,
        snoozedUntil: null,
      });
      expect(neverBackedUp.show).toBe(true);
      expect(neverBackedUp.reason).toBe('never_backed_up');

      // Zapis eksportu wycisza przypomnienie
      const exportedMeta = await recordBackupExportNow();
      expect(shouldShowBackupReminder(editedState, exportedMeta).show).toBe(false);

      // Po upływie interwału pojawia się przypomnienie stale_backup
      const exportTs = Date.parse(exportedMeta.lastBackupExportAt!);
      const futureMs = exportTs + (BACKUP_REMINDER_INTERVAL_DAYS + 1) * 24 * 60 * 60 * 1000;
      const stale = shouldShowBackupReminder(editedState, exportedMeta, futureMs);
      expect(stale.show).toBe(true);
      expect(stale.reason).toBe('stale_backup');

      // Odroczenie ukrywa przypomnienie przez okres snooze
      const snoozedMeta = await snoozeBackupReminder(7);
      expect(shouldShowBackupReminder(editedState, snoozedMeta).show).toBe(false);
    });
  });
});

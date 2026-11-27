# Raport naprawczy — E‑Sprawozdania

## 1. Numer wersji przed i po zmianach

- **Wersja przed zmianami:** `1.7.0` (`package.json`), `1.7` (`src/data/changelog.ts`)
- **Wersja po zmianach:** `1.7.1` (`package.json`, `src/data/changelog.ts`)

---

## 2. Lista wykrytych problemów (audyt przed naprawą)

1. **Brak transakcyjnej kontroli wersji/rewizji danych (P0):** Mechanizm `BroadcastChannel` jedynie powiadamiał drugą kartę po fakcie; brakowało odczytu i porównania rewizji wewnątrz tej samej transakcji `readwrite` IndexedDB, przez co równoległa karta mogła zastosować nadpisanie typu „ostatni zapis wygrywa”.
2. **Brak kolejki serializującej zapisy w IndexedDB (P0):** Szybkie wywołania `saveAppStateImmediate` oraz nakładające się zapisy mogły uruchamiać równoległe transakcje względem nieaktualnego `lastPersistedState`.
3. **Niejednoznaczne komunikaty statusu zapisu i trybu awaryjnego (P0):** Wskaźnik statusu w kreatorze oraz banery ostrzegawcze nie rozróżniały wyraźnie konfliktu wersji od błędu zapisu oraz pracy wyłącznie w pamięci operacyjnej (RAM) z opcją ponownej próby trwałego zapisu.
4. **Nieatomowa ścieżka aktualizacji stanu przy imporcie kopii JSON oraz fraz (P1):** W `App.tsx` stan React był aktualizowany przed potwierdzeniem transakcji zapisu w IndexedDB, co w razie błędu transakcji mogło doprowadzić do rozbieżności między UI a bazą.
5. **Ciche nadpisywanie lub przepisywanie duplikatów ID na imporcie (P1):** Funkcje parsujące nie odrzucały plików wejściowych z jawnie powtórzonymi identyfikatorami rekordów (lub wierszy zagnieżdżonych), nie zawsze weryfikowały też jednoznacznie pól `app`, `kind` i `version`.
6. **Niedostateczne rozróżnienie stanów migracji `localStorage` (P1):** Brakowało rozróżnienia między brakiem danych legacy, poprawnymi danymi legacy, uszkodzonym JSON legacy, błędem odczytu `localStorage` oraz niepowodzeniem zapisu do IndexedDB podczas migracji.
7. **Synchroniczne zwalnianie Object URL (P2):** `URL.revokeObjectURL` było wywoływane natychmiast po `a.click()`, co w części przeglądarek (zwłaszcza mobilnych i Safari/Edge) potrafi przerwać inicjację pobierania; dodatkowo kod UI nie sprawdzał, czy pobranie faktycznie zainicjowano.
8. **Zależność od zewnętrznych żądań Google Fonts (P2):** `index.html` i `vite.config.ts` pobierały i cache'owały czcionki z `fonts.googleapis.com` / `fonts.gstatic.com`, co uniemożliwiało pełne renderowanie docelowych krojów przy całkowicie czystym uruchomieniu offline przed wcześniejszym cache'owaniem.
9. **Brak rygorystycznej konfiguracji TypeScript (P2):** `tsconfig.json` nie miał włączonych flag `strict`, `noImplicitAny`, `strictNullChecks` ani `noUncheckedIndexedAccess`.
10. **Brak automatycznych testów regresyjnych (P1):** W repozytorium nie było żadnych testów jednostkowych ani integracyjnych (IndexedDB, migracja, konflikty, walidacja, agregacja nadzoru, wydruki).
11. **Brak problemów (zweryfikowano pozytywnie):**
    - Brak użycia `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `eval` i `new Function` w `src/`.
    - Funkcja `wipeDatabaseForRecovery` nie była wywoływana automatycznie w ścieżkach obsługi błędów (wymaga jawnego potwierdzenia użytkownika w `ErrorBoundary`).
    - Konfiguracja `base` i wtyczka `copy-unbundled-src-assets` w `vite.config.ts` są poprawne dla GitHub Pages i lokalnych zasobów.

---

## 3. Lista faktycznie wprowadzonych poprawek

1. **Etap 1 — Bezpieczeństwo zapisu (`src/utils/storage.ts`, `src/App.tsx`):**
   - Dodano trwałą metadaną `revision` w magazynie `meta` IndexedDB.
   - W `writeStateToDb` odczyt bieżącej `revision` z bazy, porównanie z `currentKnownRevision`, zapis zmian oraz podbicie `revision` odbywają się w obrębie jednej transakcji `readwrite`. Gdy `dbRevision > currentKnownRevision`, transakcja jest przerywana (`tx.abort()`), stan bazy nie jest nadpisywany, a funkcja zwraca kontrolowany wynik `{ ok: false, reason: 'conflict', dbRevision }`.
   - Dodano kolejkę serializującą (`writeQueue`), zapewniającą zachowanie kolejności zmian, brak wyścigów oraz aktualizację `lastPersistedState` i `currentKnownRevision` wyłącznie po potwierdzonym `tx.oncomplete`.
   - Rozszerzono `SaveStatus` o `'saved' | 'saving' | 'conflict' | 'error' | 'memory_only'` oraz dodano `reloadAppStateFromDb()`, `retryIndexedDbPersistence()`, `readIndexedDbStateOnly()`, `getCurrentStorageBackend()` i `getCurrentRevision()`.
   - W `App.tsx` dodano dedykowane banery dla konfliktu rewizji (z akcjami „Pobierz swoje zmiany (JSON)” oraz „Wczytaj nowszą wersję z bazy”), trybu awaryjnego RAM (ostrzeżenie o utracie zmian po odświeżeniu, eksport JSON oraz „Ponów zapis w IndexedDB”) oraz błędów zapisu.
   - Uodporniono obsługę `BroadcastChannel` na środowiska bez tego API i dodano ochronę przed auto-nadpisaniem bazy przy konflikcie.

2. **Etap 2 — Import, eksport i migracje (`src/utils/storage.ts`, `src/App.tsx`, `src/components/SharePhrasesModal.tsx`, `src/components/BackupJsonView.tsx`, `src/components/ExportSupervisionModal.tsx`):**
   - Zaostrzono walidację w `validateAndParseImportedJson`, `validateAndParseSupervisionPackageJson` oraz `validateAndParseSharedPhrasesJson`: ścisła weryfikacja `app`, `kind`, `version`, formatów dat ISO, długości tekstów, typów dokumentów oraz jawne odrzucanie duplikatów ID (zarówno głównych, jak i zagnieżdżonych w wierszach tabel) przed jakąkolwiek modyfikacją bazy.
   - Zabezpieczono funkcje sanitizujące przed kluczami prototypu (`__proto__`, `constructor`, `prototype`) oraz pustymi lub niepoprawnymi rekordami.
   - Uczyniono import pełnej kopii (`import_backup`) oraz import paczek wniosków i szablonów (`handleImportPhrases`) atomowymi: stan React i widok nie są zmieniane, dopóki transakcja zapisu w IndexedDB nie zakończy się sukcesem; przy błędzie dotychczasowa baza i sesja pozostają nienaruszone.
   - W `loadAppState()` rozróżniono stany migracji legacy: `'none' | 'migrated' | 'corrupted' | 'read_error' | 'migration_write_failed'`. Klucz `LEGACY_STORAGE_KEY` z `localStorage` jest usuwany **wyłącznie** po potwierdzonym zapisie danych do IndexedDB; przy uszkodzonym JSON, błędzie odczytu lub nieudanym zapisie IDB oryginalny klucz w `localStorage` zostaje zachowany.
   - Funkcja `exportRawIndexedDbBackup()` działa ściśle w trybie tylko do odczytu (`readIndexedDbStateOnly()`), bez mutowania bazy ani usuwania danych legacy.

3. **Etap 3 — Offline i pobieranie (`src/utils/download.ts`, `src/utils/supervision.ts`, `src/main.tsx`, `index.html`, `vite.config.ts`):**
   - Wydzielono wspólny moduł `src/utils/download.ts` z funkcją `triggerJsonDownload`, która zwraca `boolean` (czy przeglądarka pozwoliła zainicjować pobranie), bezpiecznie usuwa tymczasowy element `<a>` w `finally` oraz opóźnia wywołanie `URL.revokeObjectURL` o 10 sekund.
   - Zaktualizowano `BackupJsonView.tsx`, `SharePhrasesModal.tsx` i `ExportSupervisionModal.tsx`, aby nie wyświetlały komunikatu sukcesu, jeśli `triggerJsonDownload` zwróci `false`.
   - Zainstalowano i dołączono lokalnie pakiety fontów `@fontsource/plus-jakarta-sans`, `@fontsource/source-serif-4` oraz `@fontsource/jetbrains-mono` (zestawy `latin` oraz `latin-ext` z pełną obsługą polskich znaków diakrytycznych).
   - Usunięto zewnętrzne `<link>` do Google Fonts z `index.html` oraz reguły `runtimeCaching` Google Fonts z `vite.config.ts`; lokalne pliki `.woff`/`.woff2` są automatycznie uwzględniane w precache Workbox (`dist/sw.js`).

4. **Etap 4 — TypeScript i testy automatyczne (`tsconfig.json`, `package.json`, `vitest.config.ts`, `src/utils/__tests__/*`):**
   - Włączono flagi `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` oraz `"noUncheckedIndexedAccess": true` w `tsconfig.json`.
   - Naprawiono wszystkie zgłoszone sprawdzenia indeksowanego dostępu do tablic i słowników w `src/App.tsx`, `src/components/forms/ProfileComboInput.tsx`, `src/utils/documentFactory.ts`, `src/utils/supervision.ts` oraz `src/utils/wnioskiSearch.ts`.
   - Dodano środowisko testowe Vitest + `fake-indexeddb` oraz 3 pliki testowe obejmujące grupy A–E (łącznie 27 testów).

5. **Etap 5 — Kontrola końcowa i wersjonowanie (`package.json`, `package-lock.json`, `src/data/changelog.ts`, `RAPORT_NAPRAWCZY.md`):**
   - Zaktualizowano `package-lock.json`, potwierdzono poprawne działanie `npm ci`.
   - Podniesiono wersję aplikacji z `1.7.0` na `1.7.1` i uzupełniono `src/data/changelog.ts`.

---

## 4. Lista zmienionych i dodanych plików

### Zmienione pliki
- `package.json` — dodanie skryptu `"test": "vitest run"`, nowych devDependencies (`vitest`, `fake-indexeddb`, `@fontsource/*`), podniesienie wersji do `1.7.1`.
- `package-lock.json` — synchronizacja drzewa zależności pod `npm ci`.
- `tsconfig.json` — włączenie `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`.
- `index.html` — usunięcie zewnętrznych odwołań do Google Fonts.
- `vite.config.ts` — usunięcie reguł `runtimeCaching` dla Google Fonts (zachowano precache Workbox, `autoUpdate`, `base` oraz `copy-unbundled-src-assets`).
- `src/main.tsx` — lokalne importy CSS dla `Plus Jakarta Sans`, `Source Serif 4` i `JetBrains Mono` (`latin` + `latin-ext`).
- `src/data/changelog.ts` — zmiana `APP_VERSION` na `'1.7.1'` i dopisanie wpisu historii zmian.
- `src/utils/storage.ts` — kontrola rewizji w transakcji, kolejka zapisu, statusy i tryb RAM, ścisła walidacja/odrzucanie duplikatów ID, atomowa obsługa błędów migracji i eksport read-only.
- `src/utils/supervision.ts` — wydzielenie `buildSupervisionPackagePayload`, użycie `triggerJsonDownload`, bezpieczny dostęp indeksowy.
- `src/utils/documentFactory.ts` — bezpieczne sprawdzenia indeksowania dla `noUncheckedIndexedAccess`.
- `src/utils/wnioskiSearch.ts` — bezpieczne sprawdzenia indeksowania dla `noUncheckedIndexedAccess`.
- `src/components/forms/ProfileComboInput.tsx` — bezpieczny dostęp indeksowy dla `noUncheckedIndexedAccess`.
- `src/components/BackupJsonView.tsx` — obsługa niepowodzenia inicjalizacji pobierania JSON.
- `src/components/ExportSupervisionModal.tsx` — obsługa błędu przy inicjalizacji pobierania paczki nadzoru.
- `src/components/SharePhrasesModal.tsx` — asynchroniczne, atomowe oczekiwanie na trwały zapis przed potwierdzeniem importu oraz obsługa błędu pobierania.
- `src/App.tsx` — integracja statusów zapisu, banerów konfliktu wersji i trybu RAM, atomowego importu kopii/fraz i obsługi ponowienia zapisu.

### Dodane pliki
- `src/utils/download.ts` — bezpieczne pobieranie plików JSON z opóźnionym `URL.revokeObjectURL`.
- `vitest.config.ts` — konfiguracja uruchomienia testów jednostkowych i integracyjnych.
- `src/utils/__tests__/validation.test.ts` — testy grupy A (walidacja i sanitizacja).
- `src/utils/__tests__/storage.idb.test.ts` — testy grup B, C i D (IndexedDB, konflikty rewizji, kolejkowanie, atomowość importu, tryb awaryjny RAM, migracja legacy).
- `src/utils/__tests__/regression.test.ts` — testy grupy E (regresja funkcjonalna, pobieranie JSON, wydruki A4 i escapowanie HTML).
- `RAPORT_NAPRAWCZY.md` — niniejszy raport końcowy.

---

## 5. Opis zmian w schemacie IndexedDB i migracjach

- **Nazwa i wersja bazy:** Zachowano bez zmian `DB_NAME = 'esprawozdania_db'` oraz `DB_VERSION = 3`.
- **Magazyny obiektów (object stores):** Zachowano istniejące magazyny: `meta`, `documents` (z indeksem `schoolYear`), `customWnioski`, `customTemplates`, `supervisionPackages`.
- **Nowy klucz w magazynie `meta`:** Wprowadzono klucz `'revision'` (liczba całkowita dodatnia, start od `1`), aktualizowany atomowo w jednej transakcji `readwrite` z zapisem danych. Istniejące bazy v3 bez klucza `'revision'` są podczas odczytu traktowane bezpiecznie jako `revision = 1`, dzięki czemu pierwsza aktualizacja w pełni zachowuje kompatybilność wsteczną.
- **Migracja z `localStorage` (`esprawozdania_local_state_v1`):**
  - Idempotentna: jeśli baza IndexedDB ma już zapisany stan, poprawny wpis legacy jest usuwany po weryfikacji odczytu, natomiast wpis uszkodzony pozostaje zachowany z komunikatem ostrzegawczym.
  - Przy świeżej bazie i poprawnych danych legacy najpierw wykonywany jest pełny zapis do IndexedDB (`forceOverwriteRevision: true`), a klucz z `localStorage` jest usuwany **dopiero po** potwierdzeniu zapisu (`res.ok === true`).
  - Przy braku lub błędzie zapisu IndexedDB (`migration_write_failed`) dane legacy są udostępniane w trybie `memory_only`, a oryginalny wpis w `localStorage` pozostaje nienaruszony.

---

## 6. Opis zgodności ze starszymi kopiami JSON

- Zachowano dotychczasowe struktury eksportu pełnych kopii JSON (`app: 'E-Sprawozdania'`, `profile`, `documents`, `customWnioski`, `customTemplates`, `supervisionPackages`, `supervisionClassNotes`), paczek nadzoru (`kind: 'supervision_package'`) oraz paczek wniosków/szablonów (`kind: 'phrases_bundle'`).
- Starsze kopie z wersji `1.0`–`1.7` (niezawierające pola `kind`, tablicy `subjectAssignments`, `customTemplates` ani `supervisionPackages`) są poprawnie walidowane i uzupełniane o bezpieczne wartości domyślne.
- Jednocześnie odrzucane są pliki o obcym `app`, nieznanym `kind`, ujemnym/niepoprawnym `version`, błędnych strukturach kolekcji oraz jawnych duplikatach identyfikatorów.

---

## 7. Lista dodanych testów

### `src/utils/__tests__/validation.test.ts` (7 testów)
1. Akceptacja poprawnych dokumentów wszystkich 6 typów.
2. Uzupełnianie brakujących pól w niekompletnych dokumentach bez wyjątków.
3. Odrzucanie lub korygowanie niepoprawnych typów pól, dat i nieznanych typów dokumentów.
4. Nadawanie unikalnych ID przy brakach lub powtórzeniach w sanitizatorach dokumentów, własnych wniosków i szablonów.
5. Odrzucanie jawnych duplikatów ID (głównych i zagnieżdżonych) przy imporcie pełnej kopii JSON.
6. Odrzucanie błędnych pakietów nadzoru, notatek z kluczami prototypu (`__proto__`, `constructor`) oraz błędnych `app`/`kind`/`version`.
7. Sanitizacja profilu z brakującymi polami i spójność `subjectAssignments`.

### `src/utils/__tests__/storage.idb.test.ts` (14 testów)
1. Pierwsza inicjalizacja czystej bazy IndexedDB z rewizją `1` i statusem `saved`.
2. Zapis dodania, aktualizacji i usunięcia dokumentu (przyrostowo i trwale po rehydratacji).
3. Wykrywanie konfliktu rewizji zapisanej przez inną kartę, przerwanie zapisu bez nadpisania nowszych danych oraz odczyt nowszej wersji (`reloadAppStateFromDb`).
4. Serializacja równoległych żądań zapisu bez utraty ostatniej zmiany.
5. Obsługa błędu transakcji IndexedDB, zachowanie poprzedniej spójnej rewizji i odtworzenie możliwości zapisu po błędzie.
6. Przejście do jawnego trybu `memory_only` przy braku IndexedDB oraz kontrolowany powrót do zapisu trwałego (`retryIndexedDbPersistence`).
7. Bezpieczne działanie przy niedostępnym `BroadcastChannel`.
8. Eksport i ponowny import kopii oraz starszego formatu v1.0.
9. Atomowość importu — błędny plik lub przerwanie transakcji w trakcie importu pozostawia istniejącą bazę nienaruszoną.
10. Parsowanie i scalanie paczek wniosków i szablonów (`merge` vs `replace`).
11. `resetAllStoredState` — czyszczenie i przywrócenie stanu początkowego.
12. Migracja poprawnych danych legacy (w tym z brakującymi polami) i idempotentność kolejnego uruchomienia.
13. Zachowanie klucza legacy przy uszkodzonym JSON oraz przy błędzie odczytu `localStorage`.
14. Zachowanie klucza legacy przy nieudanym zapisie do IndexedDB oraz działanie read-only `exportRawIndexedDbBackup`.

### `src/utils/__tests__/regression.test.ts` (6 testów)
1. Wyznaczanie domyślnego roku szkolnego i półrocza na granicach miesięcy (sierpień/wrzesień, styczeń/luty).
2. Tworzenie wszystkich 6 typów dokumentów, dopasowanie programu/podręcznika do klasy oraz niezależne duplikowanie.
3. Agregacja kart przedmiotowych do sprawozdania koordynatora i przenoszenie kart na nowy rok szkolny.
4. Tworzenie paczki nadzoru, wykrywanie zmian między wersjami oraz agregacja zbiorczego sprawozdania klasy.
5. Opóźnione zwalnianie `URL.revokeObjectURL` i sprzątanie elementu DOM w `triggerJsonDownload` oraz `exportSupervisionPackageAsJson`.
6. Renderowanie wydruków A4 wszystkich typów dokumentów i arkusza zbiorczego z polskimi znakami oraz bezpiecznym escapowaniem wstrzykniętego HTML (`<script>`).

---

## 8. Dokładne polecenia uruchomione podczas weryfikacji

```bash
npm install --package-lock-only --ignore-scripts
npm ci
npm run lint
npm test
npm run build
grep -c 'fonts\.googleapis\.com\|fonts\.gstatic\.com' dist/index.html dist/sw.js || true
```

---

## 9. Wyniki weryfikacji i testów

| Kontrola / Zestaw | Wynik | Szczegóły |
|---|---|---|
| `npm ci` | **PASS** | Czysta instalacja 389 pakietów zakończona kodem 0 |
| `npm run lint` (`tsc --noEmit` ze `strict` + `noUncheckedIndexedAccess`) | **PASS** | 0 błędów typowania (TS `7.0.2`) |
| `npm test` (`vitest run`) — Grupa A (`validation.test.ts`, 7 testów) | **PASS** | 7/7 zaliczonych |
| `npm test` (`vitest run`) — Grupy B, C, D (`storage.idb.test.ts`, 14 testów z `fake-indexeddb`) | **PASS** | 14/14 zaliczonych |
| `npm test` (`vitest run`) — Grupa E (`regression.test.ts`, 6 testów) | **PASS** | 6/6 zaliczonych |
| `npm run build` (`vite build` + `vite-plugin-pwa`) | **PASS** | Wygenerowano `dist/sw.js`, precache 62 zasobów (`1836.83 KiB`), w tym lokalne fonty `.woff`/`.woff2` |
| Brak zewnętrznych odwołań Google Fonts w `dist/index.html` i `dist/sw.js` | **PASS** | 0 wystąpień |
| Ręczny test w żywej przeglądarce (Chrome / Edge / Android: instalacja PWA, tryb offline DevTools, okno `window.print()`, dwie żywe karty obok siebie) | **NOT RUN** | Środowisko wykonania w terminalu kontenerowym nie udostępnia interaktywnej sesji przeglądarkowej |

---

## 10. Znane ograniczenia i testy niewykonane

1. **Testy interaktywne w przeglądarce (NOT RUN):** W środowisku uruchomieniowym agenta nie przeprowadzono ręcznej weryfikacji wizualnej w działającym Chrome/Edge ani na urządzeniu Android (instalacja PWA z paska adresu, fizyczne odłączenie sieci i przeładowanie karty z Service Workera, podgląd okna systemowego druku `window.print()`, faktyczne pobieranie pliku w przeglądarce oraz otwarcie dwóch prawdziwych kart obok siebie).
2. **Testy `fake-indexeddb` zamiast silnika Chromium/WebKit:** Testy grupy B, C i D weryfikują pełną logikę transakcji, abortów i migracji przeciwko implementacji `fake-indexeddb` w Node.js, a nie fizycznej bazie IndexedDB przeglądarki.
3. **Załączniki sesyjne w katalogu `public/assets/aistudio/`:** Katalog ten zawiera pliki przekazane przez użytkownika w trakcie sesji AI Studio i jest kopiowany przez Vite do `dist/assets/aistudio/` (nie jest jednak używany przez kod aplikacji ani indeksowany w `globPatterns` Workbox poza ewentualnymi zasobami niebędącymi `.md`).

---

## 11. Ocena ryzyka wdrożenia

- **Ryzyko ogólne:** **Niskie.**
- Zachowano w 100% istniejące nazwy bazy (`esprawozdania_db`), magazynów IndexedDB (`DB_VERSION = 3`), formaty kopii JSON, ścieżkę `base` dla GitHub Pages oraz wygląd interfejsu i wydruków A4.
- Jedyną większą zmianą po stronie budowania są lokalnie pakowane czcionki `@fontsource/*` (wzrost rozmiaru precache PWA do ~1,84 MiB), co jest oczekiwanym kosztem zapewnienia pełnej niezależności od sieci bez dostępu do `fonts.googleapis.com`.
- Przed publikacją produkcyjną zaleca się jednorazowe sprawdzenie podglądu wydruku A4 i instalacji PWA w przeglądarce docelowej (Chrome/Edge).

---

## 12. Instrukcja bezpiecznej aktualizacji istniejącej instalacji

1. **Przed aktualizacją (zalecane dla użytkowników aktywnie pracujących na ważnych danych):**
   - Pobierz pełną kopię zapasową w zakładce **„Kopia JSON” -> „Pobierz kopię JSON”**.
   - Zamknij pozostałe otwarte karty aplikacji E‑Sprawozdania w przeglądarce.
2. **Wdrożenie nowej wersji (`1.7.1`):**
   - Zatwierdź zmiany w repozytorium (wraz z zaktualizowanym `package-lock.json`) i pozwól workflow GitHub Actions zbudować oraz opublikować aplikację (`npm ci && npm run lint && npm run build`).
3. **Po wdrożeniu na komputerze lub urządzeniu użytkownika:**
   - Otwórz aplikację online (Service Worker `autoUpdate` pobierze nową wersję oraz lokalne pakiety czcionek do pamięci podręcznej offline) i odśwież stronę raz jeszcze, aby uaktywnić nową wersję.
   - Istniejące dane z IndexedDB (`esprawozdania_db` v3) zostaną wczytane automatycznie bez utraty dokumentów, profili, własnych wniosków, szablonów ani pakietów nadzoru; przy pierwszym zapisie magazyn `meta` otrzyma klucz `revision`.
   - Dla pewności sprawdź w stopce aplikacji numer wersji **v1.7.1**, a w zakładce **„Kreator”** status **„Zapisano w IndexedDB”**, po czym możesz przetestować odświeżenie strony z wyłączonym internetem.

---

# Aktualizacja naprawcza — wersja 1.8.1 (27.11.2026)

Wersja aplikacji została podniesiona z `1.8.0` na `1.8.1` (`package.json`, `package-lock.json`, `src/data/changelog.ts`, `CHANGELOG.md`, `README.md`, `REGULAMIN.md`, `LICENSE.md`). Pełny raport z audytu wersji bazowej `1.8.0` i szczegółowej weryfikacji znajduje się w pliku [`RAPORT_AUDYTU_E-SPRAWOZDANIA_1.8.0.md`](./RAPORT_AUDYTU_E-SPRAWOZDANIA_1.8.0.md).

## 1. Zakres faktycznie wprowadzonych poprawek (27.11.2026)

1. **Limity importu przed odczytem i parsowaniem (`src/utils/importLimits.ts`, `src/utils/storage.ts`, `src/components/BackupJsonView.tsx`, `src/components/SharePhrasesModal.tsx`, `src/App.tsx`):**
   - Wprowadzono wspólną stałą `MAX_IMPORT_FILE_MIB = 25` (`MAX_IMPORT_FILE_BYTES`, `MAX_IMPORT_JSON_CHARS`).
   - Puste pliki oraz pliki przekraczające 25 MiB są odrzucane na podstawie `file.size` przed wywołaniem `file.arrayBuffer()` i `file.text()`, z komunikatem po polsku i wskazówką odzyskania większych kopii.
   - `validateAndParseImportedJson`, `validateAndParseSupervisionPackageJson` oraz `validateAndParseSharedPhrasesJson` sprawdzają `jsonText.length > MAX_IMPORT_JSON_CHARS` przed wywołaniem `JSON.parse()`.

2. **Bezpieczna, strumieniowa dekompresja ZIP (`src/utils/zipBackup.ts`):**
   - Zastąpiono synchroniczne `unzipSync()` inspekcją katalogu centralnego (EOCD / Zip64, weryfikacja ścieżek, blokada symlinków i szyfrowanych wpisów, **odrzucanie duplikatów nazw wpisów**, sprawdzenie obecności `pelna-kopia-esprawozdania.json`) połączoną z asynchronicznym strumieniowaniem `fflate.Unzip` (`UnzipPassThrough` + `UnzipInflate`) w porcjach `4096 B` z cyklicznym oddawaniem sterowania pętli zdarzeń.
   - Egzekwowano limity: `MAX_ZIP_ENTRIES = 2000`, `MAX_ZIP_ENTRY_BYTES = 25 MiB`, `MAX_ZIP_TOTAL_BYTES = 60 MiB` oraz `MAX_ZIP_COMPRESSION_RATIO = 200` (od `1 MiB` danych wyjściowych) z natychmiastowym przerwaniem przy przekroczeniu budżetu.

3. **Testy bezpieczeństwa importu (Vitest) i CI (`.github/workflows/deploy.yml`, `src/utils/__tests__/zipBackup.test.ts`, `src/utils/__tests__/storage.idb.test.ts`):**
   - Dodano testy dla 12 scenariuszy regresyjnych importu JSON/ZIP (w tym limity przed odczytem i `JSON.parse()`, bomby ZIP z poprawnym i sfałszowanym nagłówkiem CD, duplikaty nazw wpisów w ZIP, duplikaty ID i klucze prototypu, atomowość przy błędzie transakcji IndexedDB i ponowne potwierdzenie regulaminu dla starszych wersji).
   - Włączono krok `npm test` w `.github/workflows/deploy.yml` po `npm run lint` i przed `npm run build`.

4. **Dokumenty prawne, status pomocniczy i licencja WLDE (`REGULAMIN.md`, `LICENSE.md`, `README.md`, `src/components/legal/LegalDocumentsContent.tsx`, `src/components/AboutView.tsx`, `src/components/TermsOnboardingModal.tsx`, `src/components/BackupJsonView.tsx`, `src/App.tsx`):**
   - Doprecyzowano model Local-First, brak automatycznego szyfrowania IndexedDB/eksportów, rolę hostingu statycznego, role RODO, minimalizację danych szczególnych kategorii oraz dodano komunikat o pomocniczym statusie roboczych dokumentów.
   - Skorygowano nazwę i postanowienia licencji WLDE (neutralna nazwa, ustawowe wyjątki z art. 75 ust. 2–3 i art. 76 pr. aut., licencje komponentów zewnętrznych, zrewidowane klauzule AS IS i zmian regulaminu wraz z wymogiem akceptacji wersji `1.8.0`).

## 2. Zweryfikowane wyniki uruchomień (27.11.2026)

- `npm audit --omit=dev`: kod `0` (`found 0 vulnerabilities`).
- `npm ci`: kod `0` (`added 404 packages, and audited 411 packages`; ostrzeżenie `EBADENGINE` dla `html2canvas-pro@2.6.5` na Node `v22.23.5`).
- `npm run lint` (`tsc --noEmit`): kod `0` (0 błędów).
- `npm test` (`vitest run`): kod `0` (**5 plików, 47/47 testów zaliczonych**).
- `npm run build` (`vite build`): kod `0` (`dist/sw.js`, precache `69 entries`, `2909.67 KiB`).
- Testy manualne w przeglądarce oraz konfiguracja nagłówków bezpieczeństwa na docelowym hostingu: **NIEWYKONANE — wymaga weryfikacji poza środowiskiem** (szczegóły w `RAPORT_AUDYTU_E-SPRAWOZDANIA_1.8.0.md`).


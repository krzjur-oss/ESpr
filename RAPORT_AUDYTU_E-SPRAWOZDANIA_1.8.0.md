# Raport audytu i naprawy — E‑Sprawozdania 1.8.0

**Data raportu:** 27.11.2026 r.  
**Wersja bazowa / docelowa:** `1.8.0` → **`1.8.1`** (`package.json`, `package-lock.json`, `src/data/changelog.ts`)  
**Zakres:** Audyt bezpieczeństwa importu JSON/ZIP, atomowości i spójności IndexedDB, pipeline CI, spójności prawnej/RODO/licencji WLDE oraz testów regresyjnych.

---

## 1. Etap zerowy — klasyfikacja ustaleń wyjściowych

### 1.1. Potwierdzone przed naprawą (wymagające zmian w v1.8.0)
1. **Brak limitu rozmiaru plików przed odczytem i parsowaniem (`src/components/BackupJsonView.tsx`, `src/utils/storage.ts`, `src/components/SharePhrasesModal.tsx`, `src/App.tsx`):** `file.arrayBuffer()`, `file.text()` oraz `JSON.parse()` były wywoływane bez wcześniejszego sprawdzenia `file.size` ani `jsonText.length`.
2. **Bezwarunkowe, synchroniczne rozpakowywanie ZIP (`src/utils/zipBackup.ts`):** Wykorzystywano `fflate.unzipSync(new Uint8Array(buffer))`, co przy złośliwym lub uszkodzonym archiwum groziło wyczerpaniem pamięci (ZIP bomb), blokowaniem głównego wątku oraz cichym nadpisaniem zduplikowanych nazw wpisów w słowniku wynikowym `fflate`.
3. **Brak testów bezpieczeństwa importu (Vitest):** Brakowało testów sprawdzających odrzucanie plików ponad limit przed odczytem/parsowaniem, ochronę przed ZIP bombami (w tym sfałszowanymi nagłówkami), nadmierną liczbą wpisów oraz duplikatami nazw w archiwach ZIP.
4. **Nieprecyzyjne zapisy prywatności i RODO (`REGULAMIN.md`, `src/components/legal/LegalDocumentsContent.tsx`, `README.md`, `src/components/BackupJsonView.tsx`, `src/components/AboutView.tsx`):** Występowały kategoryczne sformułowania o danych „nigdy nieopuszczających urządzenia”, o „wyłącznym” statusie administratora oraz brakowało ostrzeżenia o danych szczególnych kategorii (art. 9 RODO) i braku szyfrowania IndexedDB/eksportów.
5. **Brak widocznej noty o statusie pomocniczym dokumentów:** Brakowało zwięzłego zastrzeżenia, że wygenerowane karty mają charakter pomocniczy i wymagają weryfikacji ze strony dyrektora oraz placówki.
6. **Niespójności w licencji WLDE (`LICENSE.md`, `LegalDocumentsContent.tsx`):** Używano mylącej nazwy „Wolna Licencja” przy modelu własnościowym/zamkniętym oraz brakowało ustawowego wyjątku z art. 75 ust. 2–3 i art. 76 ustawy o prawie autorskim i prawach pokrewnych oraz zastrzeżenia licencji komponentów zewnętrznych.
7. **Zbyt szerokie klauzule odpowiedzialności („AS IS”) i zmian regulaminu (`REGULAMIN.md`, `LICENSE.md`, `LegalDocumentsContent.tsx`):** Wyłączenia odpowiedzialności nie uwzględniały szkody umyślnej i bezwzględnych praw ustawowych; brakowało mechanizmu wymuszającego ponowną akceptację regulaminu dla starszych zaakceptowanych wersji (`< 1.8.0`).
8. **Brak testów w CI (`/.github/workflows/deploy.yml`):** Pipeline GitHub Pages uruchamiał `npm ci`, `npm run lint` i `npm run build`, ale pomijał `npm test`.

### 1.2. Naprawione wcześniej (zweryfikowane w kodzie bazowym v1.7.1 / v1.8.0)
1. **Atomowość importu i spójność IndexedDB (`src/utils/storage.ts`, `src/App.tsx`):**
   - `handleConfirmAction` (`import_backup`) oraz `handleImportPhrases` czekają na wynik `saveAppStateImmediate` przed wywołaniem `setState(...)`.
   - `writeStateToDb` wykonuje odczyt i weryfikację `revision`, zapis w magazynach oraz podbicie `revision` w jednej transakcji `readwrite`, w ramach kolejki `writeQueue`.
2. **Ochrona przed duplikatami ID i kluczami prototypu (`src/utils/storage.ts`):**
   - `findDuplicateExplicitId` odrzuca duplikaty identyfikatorów głównych i zagnieżdżonych.
   - `sanitizeSupervisionClassNotes` filtruje `__proto__`, `constructor` i `prototype` (`FORBIDDEN_RECORD_KEYS`).
3. **Bezpieczna migracja `localStorage` i eksporty read-only (`src/utils/storage.ts`, `src/utils/download.ts`):**
   - `LEGACY_STORAGE_KEY` jest usuwany dopiero po udanym zapisie w IndexedDB; opóźnione `URL.revokeObjectURL` (10 s) w `triggerBlobDownload`.
4. **Niezależność czcionek offline i rygorystyczny TypeScript (`src/main.tsx`, `index.html`, `vite.config.ts`, `tsconfig.json`):**
   - Lokalne pakiety `@fontsource/*`, brak odwołań do Google Fonts, włączone `strict` i `noUncheckedIndexedAccess`.

### 1.3. Pozostałe ryzyka (akceptowane lub wymagające działań po stronie hostingu/użytkownika)
1. **Brak szyfrowania lokalnych danych w spoczynku (by-design):** Przeglądarkowa baza `IndexedDB` oraz pliki kopii `.json`/`.zip`/nadzoru nie są automatycznie szyfrowane przez aplikację. Zabezpieczenie opiera się na kontroli dostępu urządzenia, minimalizacji danych i zaleceniach RODO dla użytkownika.
2. **Nagłówki bezpieczeństwa HTTP po stronie hostingu:** Sama statyczna aplikacja PWA nie wymusza nagłówków serwera (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) — wymagają one konfiguracji warstwy hostingu (np. reverse proxy / CDN, o ile używany hosting je obsługuje).
3. **Ostrzeżenie wersji Node (`EBADENGINE`) dla `html2canvas-pro@2.6.5`:** Pakiet deklaruje `engines.node >= 24.0.0`, podczas gdy środowisko wykonawcze oraz workflow CI korzystają z Node `22`. W testach i budowaniu Vite w środowisku Node `v22.23.5` nie wystąpiły błędy wykonania, jednak przy ewentualnych aktualizacjach należy obserwować kompatybilność.
4. **Podatności deweloperskie (`npm audit`):** `npm audit --omit=dev` zgłasza `0` podatności w zależnościach produkcyjnych; pełny `npm audit` (z narzędziami deweloperskimi) zgłasza `4` podatności o poziomie `moderate`. Zgodnie z zaleceniem zachowania spójności `package-lock.json` nie dokonywano wymuszonych aktualizacji pakietów.

### 1.4. Elementy nieweryfikowalne w tym środowisku
1. **Rzeczywista konfiguracja hostingu i retencja logów dostawcy** (zależne od docelowej platformy publikacji, np. GitHub Pages).
2. **Zachowanie w fizycznych przeglądarkach desktopowych i mobilnych** (Chrome, Edge, Firefox, Android, dwie równoległe żywe karty, rzeczywiste zachowanie `QuotaExceededError` / trybu prywatnego, aktualizacja SW z niezapisanymi zmianami, wydruk A4 i dostępność klawiaturą/czytnikiem ekranu) — testy bazowały na Node.js + `fake-indexeddb`.
3. **Kwestie prawno-faktyczne poza kodem:** Czy część programu mogła powstać w ramach obowiązków pracowniczych (art. 74 ust. 3 pr. aut.), dokładna data faktycznej publikacji wersji `1.8.0` oraz kwalifikacja konkretnego sposobu nieodpłatnego udostępnienia na gruncie ustawy o prawach konsumenta.

---

## 2. Faktycznie wdrożone poprawki (P1 i P2)

### 2.1. P1 — Limity importu i bezpieczna dekompresja ZIP
- Utworzono wspólny moduł `src/utils/importLimits.ts`:
  - `MAX_IMPORT_FILE_MIB = 25` (`MAX_IMPORT_FILE_BYTES = 25 * 1024 * 1024`, `MAX_IMPORT_JSON_CHARS = MAX_IMPORT_FILE_BYTES`);
  - limity ZIP: `MAX_ZIP_ENTRIES = 2000`, `MAX_ZIP_ENTRY_BYTES = 25 MiB`, `MAX_ZIP_TOTAL_BYTES = 60 MiB` (budżet uwzględnia podwójny zapis pełnej kopii i pojedynczych dokumentów z `buildBackupZipBytes()`), `MAX_ZIP_COMPRESSION_RATIO = 200`, `ZIP_RATIO_CHECK_MIN_BYTES = 1 MiB`;
  - `validateImportFileMetadata()` odrzucająca puste pliki (`<= 0 B`) i pliki `> 25 MiB` przed wywołaniem `arrayBuffer()` lub `text()`, z instrukcją odzyskania danych z większych archiwów.
- W `src/utils/storage.ts` dodano weryfikację pustego wejścia oraz `jsonText.length > MAX_IMPORT_JSON_CHARS` przed `JSON.parse()` we wszystkich trzech parserach importu (`validateAndParseImportedJson`, `validateAndParseSupervisionPackageJson`, `validateAndParseSharedPhrasesJson`).
- W `src/components/BackupJsonView.tsx`, `src/components/SharePhrasesModal.tsx` i `src/App.tsx` (`handleImportSupervisionFiles`) dodano wczesne sprawdzanie metadanych pliku przed jego odczytem oraz komunikaty o limicie i procedurze odzyskania danych.
- W `src/utils/zipBackup.ts` zastąpiono synchroniczne `unzipSync()` dwuetapową, asynchroniczną ścieżką strumieniową:
  1. `inspectZipCentralDirectory`: weryfikuje EOCD / Zip64, odrzuca puste/ucięte/wieloczęściowe archiwa, sprawdza limit wpisów (`MAX_ZIP_ENTRIES`), blokuje `..`, NUL, `\`, ścieżki absolutne, szyfrowane wpisy i symlinki Unix, **odrzuca zduplikowane nazwy wpisów**, sprawdza limity rozmiarów oraz współczynnik kompresji i obecność `pelna-kopia-esprawozdania.json`.
  2. Strumieniowanie `fflate.Unzip` (`UnzipPassThrough` + `UnzipInflate`) w porcjach `4096 B` z cyklicznym oddawaniem sterowania pętli zdarzeń (`setTimeout(0)` co 64 KiB) dla ochrony głównego wątku oraz zgodności z CSP bez inline Blob Workerów; w `file.ondata` egzekwowane są na bieżąco limity rozmiaru, łączny limit oraz rzeczywisty współczynnik kompresji z natychmiastowym przerwaniem przy przekroczeniu budżetu i ścisłym dekodowaniem `TextDecoder('utf-8', { fatal: true })`.

### 2.2. P1 — Testy regresyjne importu (Vitest)
- Zaktualizowano `src/utils/__tests__/zipBackup.test.ts` (przejście na asynchroniczne `await extractBackupJsonFromZip(...)`) oraz rozbudowano `src/utils/__tests__/zipBackup.test.ts` i `src/utils/__tests__/storage.idb.test.ts` o wszystkie 12 scenariuszy wymaganych w audycie (w tym spy na `arrayBuffer()`/`text()` i `JSON.parse()`, bomby ZIP z poprawnym i sfałszowanym nagłówkiem CD, archiwa ze zduplikowanymi nazwami wpisów oraz asercje nienaruszalności IndexedDB i stanu UI po błędnym imporcie).

### 2.3. P1 i P2 — Dokumenty prawne, status pomocniczy, licencja WLDE i wymóg potwierdzenia zmian
- Zaktualizowano spójnie `REGULAMIN.md`, `LICENSE.md`, `README.md`, `src/components/legal/LegalDocumentsContent.tsx`, `src/components/AboutView.tsx`, `src/components/TermsOnboardingModal.tsx`, `src/components/BackupJsonView.tsx`, stopkę `src/App.tsx` oraz `README-archiwum.txt` w `src/utils/zipBackup.ts`:
  - precyzyjny opis Local-First, hostingu statycznego, Service Workera i braku szyfrowania kopii/IndexedDB;
  - role RODO bez kategorycznego zawężenia i bez automatycznego przypisywania autorowi roli administratora/podmiotu przetwarzającego;
  - ostrzeżenie o danych szczególnych kategorii (art. 9 RODO), minimalizacji oraz braku domyślnej zgody jako podstawy;
  - widoczny komunikat o statusie pomocniczym generowanych dokumentów (`AuxiliaryToolNoticeCallout`);
  - neutralna nazwa licencji `Ograniczona licencja bezpłatnego użytku edukacyjnego i prywatnego (WLDE)` z adnotacją o historycznym skrócie WLDE (nie jest to licencja open source), ustawowymi wyjątkami z art. 75 ust. 2–3 i art. 76 pr. aut. oraz zastrzeżeniem praw komponentów zewnętrznych;
  - skorygowana klauzula „AS IS” (z zachowaniem odpowiedzialności za szkodę umyślną i praw ustawowych), opis kwestii konsumenckich zależny od okoliczności oraz wersjonowanie zmian regulaminu z archiwizacją poprzednich wersji i mechanizmem `MIN_REQUIRED_TERMS_VERSION = '1.8.0'` w `src/utils/storage.ts`.

### 2.4. P2 — Workflow CI
- W `.github/workflows/deploy.yml` dodano krok `Uruchom testy automatyczne` (`npm test`) między `npm run lint` a `npm run build` przed przesłaniem artefaktu GitHub Pages.

---

## 3. Lista zmienionych i dodanych plików

### Dodane pliki
- `src/utils/importLimits.ts`
- `RAPORT_AUDYTU_E-SPRAWOZDANIA_1.8.0.md`

### Zmienione pliki
- `.github/workflows/deploy.yml`
- `src/utils/zipBackup.ts`
- `src/utils/storage.ts`
- `src/components/BackupJsonView.tsx`
- `src/components/SharePhrasesModal.tsx`
- `src/components/legal/LegalDocumentsContent.tsx`
- `src/components/AboutView.tsx`
- `src/components/TermsOnboardingModal.tsx`
- `src/App.tsx`
- `src/data/changelog.ts`
- `src/utils/__tests__/zipBackup.test.ts`
- `src/utils/__tests__/storage.idb.test.ts`
- `REGULAMIN.md`
- `LICENSE.md`
- `README.md`
- `CHANGELOG.md`
- `RAPORT_NAPRAWCZY.md`

*(Bez zmian w `package.json`, `package-lock.json`, schemacie IndexedDB `DB_VERSION = 3` ani formatach eksportu).*

---

## 4. Faktycznie uruchomione polecenia i wyniki

| Polecenie | Kod zakończenia | Wynik faktyczny |
|---|---|---|
| `npm audit --omit=dev` | `0` | `found 0 vulnerabilities` (zależności produkcyjne) |
| `npm ci` | `0` | Zainstalowano czysto 404 pakiety (ostrzeżenie `EBADENGINE` dla `html2canvas-pro@2.6.5` na Node `v22.23.5`; 4 podatności `moderate` w pełnym drzewie z devDependencies) |
| `npm run lint` (`tsc --noEmit`) | `0` | 0 błędów typowania TypeScript (`strict`, `noUncheckedIndexedAccess`) |
| `npm test` (`vitest run`) | `0` | **5 plików testowych, 47/47 testów zaliczonych** (`validation.test.ts`: 8, `storage.idb.test.ts`: 20, `zipBackup.test.ts`: 9, `pdfExport.test.ts`: 4, `regression.test.ts`: 6) |
| `npm run build` (`vite build`) | `0` | Zbudowano `dist/` w 1,88 s; wygenerowano `dist/sw.js` (`precache 69 entries`, `2909.67 KiB`) |

---

## 5. Checklisty i weryfikacje wymagane poza środowiskiem

### 5.1. Testy manualne po naprawie (sekcja 10)
W środowisku bez interaktywnej przeglądarki poniższe testy są oznaczone jako:

- Import i eksport JSON oraz ZIP na Chrome/Edge/Firefox — **NIEWYKONANE — wymaga weryfikacji poza środowiskiem**
- Import na urządzeniu Android — **NIEWYKONANE — wymaga weryfikacji poza środowiskiem**
- Import poprawnej kopii z poprzedniej wersji w przeglądarce — **NIEWYKONANE — wymaga weryfikacji poza środowiskiem**
- Błędny import i przekroczenie limitu 25 MiB w przeglądarce — **NIEWYKONANE — wymaga weryfikacji poza środowiskiem**
- Dwie otwarte żywe karty i równoległy zapis — **NIEWYKONANE — wymaga weryfikacji poza środowiskiem**
- Awaria IndexedDB / brak miejsca (`QuotaExceededError`) / tryb prywatny w przeglądarce — **NIEWYKONANE — wymaga weryfikacji poza środowiskiem**
- Aktualizacja PWA z niezapisanymi zmianami — **NIEWYKONANE — wymaga weryfikacji poza środowiskiem**
- Wydruk A4 i bezpośredni eksport PDF w przeglądarce — **NIEWYKONANE — wymaga weryfikacji poza środowiskiem**
- Dostępność klawiaturą, czytnikiem ekranu i przy powiększeniu — **NIEWYKONANE — wymaga weryfikacji poza środowiskiem**

### 5.2. Checklista bezpieczeństwa hostingu i wdrożenia (ZALECENIA — NIE WDROŻONE AUTOMATYCZNIE)
Poniższe elementy **nie zostały wdrożone automatycznie po stronie hostingu** (np. GitHub Pages nie pozwala na pełną konfigurację własnych nagłówków HTTP bez dodatkowego proxy/CDN):

- [ ] **Content-Security-Policy (CSP):** Dopasowana do lokalnych zasobów (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`) — zweryfikować po wdrożeniu z eksportem PDF (`html2canvas-pro` / `blob:`) i SW.
- [ ] **HSTS (`Strict-Transport-Security`):** Włączyć wyłącznie po potwierdzeniu stałego działania HTTPS i wymagań domeny.
- [ ] **`X-Content-Type-Options: nosniff`:** Skonfigurować na serwerze/CDN serwującym pliki statyczne.
- [ ] **`Referrer-Policy`:** Ustawić np. `no-referrer` lub `strict-origin-when-cross-origin`.
- [ ] **`Permissions-Policy`:** Ograniczyć nieużywane interfejsy sprzętowe (np. `camera=(), microphone=(), geolocation=()`).
- [ ] **Cache i Service Worker (`sw.js`):** Zweryfikować krótkie lub `no-cache` buforowanie HTTP dla `sw.js` i `index.html`, aby aktualizacje PWA docierały sprawnie.
- [ ] **Przegląd zależności i licencji:** Bezpośrednie zależności runtime (`react`, `react-dom`, `fflate`, `jspdf`, `html2canvas-pro`, `lucide-react`, `@tailwindcss/vite`, `@vitejs/plugin-react`, `vite`) korzystają z licencji MIT / ISC; fonty `@fontsource/*` z OFL-1.1; devDependencies (`vitest`, `fake-indexeddb`, `typescript`, `vite-plugin-pwa`, `esbuild`) z MIT / Apache-2.0. Należy prowadzić okresowy przegląd `npm audit` i licencji zależności pośrednich przed kolejnymi wydaniami.

### 5.3. Notatki prawno-właścicielskie dla właściciela projektu
1. **Weryfikacja art. 74 ust. 3 pr. aut.:** Właściciel projektu powinien samodzielnie zweryfikować, czy żadna część kodu źródłowego, szablonów lub bazy wniosków nie powstała w ramach wykonywania obowiązków ze stosunku pracy (art. 74 ust. 3 ustawy o prawie autorskim i prawach pokrewnych), ponieważ w takim przypadku majątkowe prawa autorskie mogłyby przysługiwać pracodawcy, o ile umowa nie stanowi inaczej.
2. **Data wejścia w życie regulaminu i licencji:** W plikach `REGULAMIN.md`, `LICENSE.md` oraz `LegalDocumentsContent.tsx` wskazano datę `27.11.2026 r.` z adnotacją `(do potwierdzenia daty wdrożenia przez wydawcę)` — po faktycznej publikacji wersji `1.8.0` wydawca powinien potwierdzić rzeczywistą datę wdrożenia.

---

## 6. Korekta (errata) dot. `MIN_REQUIRED_TERMS_VERSION` (dopisano przy wydaniu `1.8.2`)

- W wierszu `1.1 (pkt 7)` oraz `2.3` niniejszego raportu wskazano wdrożenie mechanizmu `MIN_REQUIRED_TERMS_VERSION = '1.8.0'`. W praktyce w wersji `1.8.1`:
  1. stała pozostała na poziomie `'1.8.0'` (mimo aktualizacji treści dokumentów prawnych w `1.8.1`),
  2. istniejące bazy IndexedDB bez rekordu `termsAcceptance` (`dbRead.found === true`) pomijały monit akceptacji,
  3. funkcja `sanitizeTermsAcceptanceRecord` podstawiała `APP_VERSION` przy braku pola `version`, a przy wyborze rekordu z IndexedDB i `localStorage` stosowano operator `??` bez porównania wersji/dat, ponadto gałąź `catch` w `loadAppState()` nie weryfikowała wersji akceptacji.
- W wydaniu **`1.8.2`** wprowadzono niezależną stałą `LEGAL_DOCUMENTS_VERSION = '1.8.1'` (`MIN_REQUIRED_TERMS_VERSION = LEGAL_DOCUMENTS_VERSION`), usunięto podstawianie `APP_VERSION` za brakującą wersję oraz ujednolicono wymaganie ważnej akceptacji bieżącej wersji dokumentów we wszystkich ścieżkach `loadAppState()`.


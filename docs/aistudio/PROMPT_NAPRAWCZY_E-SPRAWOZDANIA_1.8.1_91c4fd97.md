# Prompt naprawczy — E‑Sprawozdania 1.8.1 → 1.8.2

**Projekt wejściowy:** `ESpr-main` (wersja `1.8.1`)
**Podstawa:** `RAPORT_AUDYTU_E-SPRAWOZDANIA_1.8.1.md` (ustalenia F‑01 … F‑14, I‑01 … I‑04)
**Cel:** naprawa potwierdzonych błędów i niespójności bez zmiany interfejsu, formatów danych i architektury Local‑First.

---

## 1. Rola i zasady pracy

Działaj jako starszy inżynier React/TypeScript/IndexedDB/PWA. Pracuj na istniejącym projekcie, małymi etapami; najpierw odczytaj wskazane pliki, potem zmieniaj. Raport audytu traktuj jako hipotezy do potwierdzenia w kodzie – jeśli ustalenie okaże się nieaktualne, opisz to i nie zmieniaj kodu na siłę.

### Bezwzględne wymagania

1. Zachowaj interfejs, nawigację, kolory, nazwy funkcji, sześć typów dokumentów, szablony, bazę wniosków, nadzór dyrektora, PDF, druk A4, JSON, ZIP, PWA i pracę offline.
2. Zachowaj Local‑First: bez backendu, kont, synchronizacji i wysyłania treści dokumentów.
3. Nie zmieniaj schematu IndexedDB (`DB_VERSION = 3`), kluczy, identyfikatorów ani formatu kopii; zachowaj import starszych kopii.
4. Żadnych destrukcyjnych migracji; nie usuwaj danych użytkownika bez jawnej akcji i kopii.
5. Nie usuwaj ani nie osłabiaj istniejących testów (47 musi nadal przechodzić). Nie deklaruj uruchomienia testów, których nie uruchomiono.
6. Nie wymyślaj opcji bibliotek; sprawdzaj w zainstalowanych wersjach.
7. Nie dodawaj fikcyjnych faktów prawnych ani informacji o hostingu. Teksty prawne zmieniaj minimalnie i redakcyjnie ostrożnie; nie udzielaj wiążącej opinii prawnej.
8. Każdą zmianę powiąż z plikiem i testem. Na końcu uruchom `npm ci`, `npm run lint`, `npm test`, `npm run build`, `npm audit --omit=dev` i podaj faktyczne wyniki; testy w przeglądarce oznacz „NIEWYKONANE”, jeśli nie były możliwe.

---

## 2. Etap zerowy

Przeczytaj: `package.json`, `vite.config.ts`, `index.html`, `.github/workflows/deploy.yml`, `src/utils/storage.ts` (`loadAppState`, `sanitizeTermsAcceptanceRecord`, `acceptTermsAndConditions`, `exportStateAsJson`, walidatory), `src/utils/zipBackup.ts`, `src/utils/importLimits.ts`, `src/utils/pdfExport.ts`, `src/App.tsx` (hydratacja, `handleImportSupervisionFiles`, eksport), `src/components/TermsOnboardingModal.tsx`, `REGULAMIN.md`, `LICENSE.md`, testy w `src/utils/__tests__/`. Zapisz krótką listę: potwierdzone / nieaktualne / do decyzji.

---

## 3. P1 — Akceptacja regulaminu (F‑01)

Plik: `src/utils/storage.ts`, `src/data/changelog.ts`, `src/components/TermsOnboardingModal.tsx`.

1. Wprowadź osobną stałą wersji **dokumentów prawnych** (np. `LEGAL_DOCUMENTS_VERSION = '1.8.1'`) i używaj jej zamiast `MIN_REQUIRED_TERMS_VERSION = '1.8.0'`; ustaw wartość na `1.8.1`. Zachowaj eksport `MIN_REQUIRED_TERMS_VERSION` (testy go importują) albo zaktualizuj testy jawnie.
2. Zdefiniuj zasadę: monit pojawia się, gdy **nie ma ważnej akceptacji aktualnej wersji dokumentów** – czyli gdy rekord nie istnieje, nie ma pola `version`, `accepted !== true` lub wersja jest niższa od wymaganej. Dotyczy to także istniejących baz (`dbRead.found === true`) bez rekordu akceptacji.
3. `sanitizeTermsAcceptanceRecord` nie może podstawiać `APP_VERSION` za brakującą wersję; brak wersji = akceptacja nieważna.
4. Przy wyborze rekordu porównaj **daty/wersje** rekordów z IndexedDB i `localStorage` i użyj nowszego, zamiast `??`.
5. Gałąź `catch` w `loadAppState` (tryb pamięciowy) ma stosować tę samą regułę.
6. Okno zgody ma pozostać nieblokujące dla danych: bez usuwania, ukrywania i nadpisywania danych (`inert` tylko na tło, jak obecnie). Odmowa/zamknięcie nie może kasować danych.
7. Testy (Vitest, `fake-indexeddb`):
   - baza z danymi bez rekordu akceptacji → `requiresTermsAcceptance === true`;
   - rekord `1.8.0` → `true`; rekord `1.8.1` → `false`;
   - rekord bez `version` → `true`;
   - IndexedDB ma `1.8.0`, `localStorage` ma `1.8.1` → `false`;
   - brak IndexedDB (tryb pamięciowy) + rekord `1.8.0` → `true`;
   - świeża instalacja → `true`, po `acceptTermsAndConditions()` → `false` po ponownym załadowaniu;
   - dane użytkownika po akceptacji i odmowie pozostają nienaruszone.

## 4. P1 — Eksport większy niż limit importu (F‑02)

Pliki: `src/utils/importLimits.ts`, `src/utils/storage.ts`, `src/utils/zipBackup.ts`, `src/components/BackupJsonView.tsx`, `src/App.tsx`.

1. Przed eksportem JSON/ZIP oblicz rozmiar (JSON: `Blob.size`; ZIP: `length` bajtów) i porównaj z limitem importu (`MAX_IMPORT_FILE_BYTES`, `MAX_ZIP_ENTRY_BYTES`).
2. Gdy kopia **przekroczyłaby limit importu**: nie ukrywaj eksportu (dane użytkownika są ważniejsze), ale pokaż wyraźne ostrzeżenie w języku polskim „Ta kopia przekracza limit importu (25 MiB) i nie zostanie wczytana przez aplikację w tej wersji” wraz z propozycją: eksport wybranego roku szkolnego albo wybranych dokumentów. Powyżej ~80% limitu pokaż łagodniejsze ostrzeżenie.
3. Zaimplementuj minimalny eksport zawężony (np. wybór roku szkolnego) – używając istniejącej struktury `full_backup`, tak by wynik dał się zaimportować bez zmian formatu. Jeśli to zbyt duża zmiana, zostaw samo ostrzeżenie i opisz decyzję w raporcie.
4. Skoryguj komunikat `OVERSIZED_BACKUP_RECOVERY_HINT`, aby opisywał wyłącznie działania możliwe w aplikacji.
5. Rozważ podniesienie limitu do 50 MiB tylko po sprawdzeniu pamięci/czasu na urządzeniu mobilnym; jeśli zmieniasz, zmień wszystkie powiązane stałe i testy spójnie.
6. Testy: eksport > limit zwraca ostrzeżenie; kopia zawężona do roku mieści się w limicie i przechodzi `validateAndParseImportedJson`.

## 5. P2 — Eksport PDF (F‑03)

Plik: `src/utils/pdfExport.ts`, `src/App.tsx`, `src/components/PdfProgressBar.tsx`.

1. Zamiast `continue` przy pustym płótnie zapisuj numer/tytuł pominiętego arkusza i zwróć w `PdfExportResult` listę `skipped`; UI ma pokazać ostrzeżenie „Pominięto X z Y kart…” zamiast samego sukcesu. Gdy pominięto wszystko – błąd.
2. Przed `html2canvas` oszacuj wysokość płótna (`scrollHeight * scale`); jeśli przekracza bezpieczny limit (przyjmij konserwatywnie 16 384 px wysokości lub ~16 mln pikseli powierzchni), zmniejsz `scale` dla tego arkusza (min. 1) lub renderuj w częściach; zachowaj dotychczasowy wygląd dla zwykłych kart.
3. Zachowaj `findSafeSliceHeightPx`, A4 i bieżące marginesy.
4. W „O programie”/pomocy dopisz jednozdaniową informację, że PDF jest obrazem, a druk systemowy („Drukuj”) zachowuje tekst do zaznaczania.
5. Testy w `pdfExport.test.ts` (z mockiem `html2canvas`): płótno 0×0 → `skipped`; mieszany zestaw → ostrzeżenie; tylko puste → `ok: false`.

## 6. P2 — Higiena publikacji i licencje (F‑04, F‑05, I‑01, I‑02)

1. Usuń `public/assets/aistudio/` (prompty i zrzut ekranu) z katalogu publikowanego. Jeśli dokumenty mają zostać w repozytorium, przenieś je do `docs/` (poza `public/`). Upewnij się, że `dist/` ich nie zawiera.
2. Dodaj `THIRD_PARTY_NOTICES.txt` w `public/` lub generuj go w buildzie (np. własna wtyczka Vite czytająca `node_modules/*/LICENSE*` dla zależności produkcyjnych, w tym `@fontsource/*`, `dompurify`, `fflate`, `jspdf`, `html2canvas-pro`, `lucide-react`, `react`, `react-dom`). Linkuj plik w „O programie” i `LICENSE.md`. Nie wymyślaj treści licencji – kopiuj z paczek.
3. Wybierz jeden lockfile: zachowaj `package-lock.json` (używany w CI) i usuń `bun.lock`, albo odwrotnie – po zgodzie właściciela; nie zmieniaj wersji zależności.
4. Usuń lub opisz pozostałości: `metadata.json`, komentarze `DISABLE_HMR`, wtyczkę `copy-unbundled-src-assets` (jeśli `src/assets` nie istnieje), `experimentalDecorators`, `useDefineForClassFields`, `allowJs` – tylko jeśli `npm run lint` i `build` nadal przechodzą.

## 7. P2 — Hardening i CI (F‑06, F‑07, F‑08)

1. **CSP w `index.html`** przez `<meta http-equiv="Content-Security-Policy">`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`. Zweryfikuj `npm run build` + `npm run preview`: aplikacja, SW, eksport PDF, pobieranie JSON/ZIP, druk. Jeśli coś wymaga poluzowania – poluzuj minimalnie i opisz powód. Nie dodawaj `frame-ancestors` (nie działa w meta).
2. **Node w CI:** zmień `node-version` na `24` (zgodnie z `engines` `html2canvas-pro`) albo przypnij zależność do wersji zgodnej z Node 22 – wybierz jedną opcję, sprawdź `npm ci` bez `EBADENGINE`. Dodaj pole `engines` w `package.json`.
3. Sprawdź pochodzenie `html2canvas-pro@2.6.5` (`npm view html2canvas-pro dist-tags versions`), przypnij dokładną wersję w `package.json` i opisz wynik.
4. Dodaj krok `npm audit --omit=dev --audit-level=high` do workflow (build ma się wywalać tylko na produkcyjnych podatnościach). **Nie** wykonuj `npm audit fix --force` (degraduje `vite-plugin-pwa`).
5. Opcjonalnie przypnij akcje GitHub do SHA.
6. Dodaj `og:image`/`twitter:image` (istniejąca ikona 512 px) albo zmień `twitter:card` na `summary`; dodaj `<noscript>` z komunikatem po polsku.

## 8. P3 — Import, nadzór, zapis (F‑09 … F‑12)

1. **Walidacja (`storage.ts`):**
   - rozdziel błędy parsowania JSON od błędów wewnętrznych (osobne `try/catch` wokół `JSON.parse`; wyjątki sanitizerów zwracaj jako „Nie udało się przetworzyć kopii” z kodem w konsoli deweloperskiej tylko w `import.meta.env.DEV`);
   - dla pełnej kopii wymagaj `app === 'E-Sprawozdania'`, ale **dopuść** starsze kopie bez `app`, jeśli mają poprawną strukturę (`profile` + `documents`) – zachowując wsteczną zgodność (sprawdź testy zgodności v1.0);
   - zliczaj i zwracaj ostrzeżenia o obcięciu pól (`asStr`) i odrzuconych elementach (`asStringArray`), a w UI potwierdzenia importu pokaż „Obcięto N pól dłuższych niż 100 000 znaków”; nie zmieniaj limitów;
   - odrzuć kopie o `version` wyższej niż obsługiwana z czytelnym komunikatem.
2. **Nadzór dyrektora (`App.tsx`):**
   - ogranicz liczbę plików (np. 50) i łączny rozmiar jednej partii; czytaj pliki **sekwencyjnie**, nie przez `Promise.all`;
   - przy dopasowaniu po imieniu i nazwisku (bez zgodnego `teacherKey`) nie scalaj automatycznie – pokaż użytkownikowi wybór „to ten sam nauczyciel / dodaj jako nowego”;
   - wywołuj `mergeIncomingPackages` raz na partię i przekazuj wynik do `setState`, a `importedAt` ustalaj jednokrotnie przed aktualizacją.
3. **Zapis (`storage.ts`):**
   - usuń nieosiągalny skrót `lastPersistedState === state && currentSaveStatus === 'saved'` lub popraw kolejność tak, by miał sens;
   - w `wipeDatabaseForRecovery` nie raportuj sukcesu przy `onblocked` – pokaż komunikat „Zamknij pozostałe karty aplikacji i spróbuj ponownie”; nie kasuj rekordu akceptacji regulaminu bez potrzeby (albo opisz tę decyzję);
   - rozważ `registerType: 'prompt'` lub wywołanie `flushPendingAppStateSave()` i oczekiwanie na zapis przed automatycznym przeładowaniem po aktualizacji SW; zachowaj działanie offline.
4. **ZIP (`zipBackup.ts`):**
   - usuń lub uzasadnij martwy test `totalStreamedBytes`;
   - zmniejsz narzut przekazań sterowania (np. większa porcja strumienia lub `MessageChannel` zamiast `setTimeout(0)`), bez utraty responsywności; zmierz czas importu pliku ~20 MiB w teście lub opisz brak pomiaru;
   - dla archiwów z nieobsługiwaną metodą/deskryptorem pokaż konkretny komunikat „Użyj archiwum pobranego z aplikacji lub wskaż rozpakowany plik .json”.
5. Testy dla każdego punktu, który zmieniasz.

## 9. P3 — Dokumentacja i spójność (F‑13, F‑14, I‑03, I‑04)

1. Usuń z `REGULAMIN.md`, `LICENSE.md` i `LegalDocumentsContent.tsx` robocze adnotacje „do potwierdzenia daty wdrożenia przez wydawcę; pierwotnie od 24.11.2026 r.”. **Nie wpisuj daty na własną rękę** – zostaw w raporcie listę miejsc, w których wydawca musi wstawić rzeczywistą datę wejścia w życie. Jeśli nie można zostawić pola pustego, użyj neutralnego sformułowania i oznacz je w raporcie jako „do uzupełnienia”.
2. Wprowadź w dokumentach jawną „Wersję dokumentów prawnych” (patrz P1) niezależną od numeru wersji aplikacji; uzupełnij archiwum wersji dokumentu.
3. `package.json`: przenieś `vite`, `@tailwindcss/vite`, `@vitejs/plugin-react`, `vite-plugin-pwa` do jednego spójnego miejsca (`devDependencies`), zamień `clean` na rozwiązanie wieloplatformowe (np. `node -e "fs.rmSync('dist',{recursive:true,force:true})"`). Zmiany sprawdź `npm ci` + `npm run build`.
4. Podbij wersję do `1.8.2`: `package.json`, `package-lock.json`, `src/data/changelog.ts`, `CHANGELOG.md`, `README.md`, `REGULAMIN.md`, `LICENSE.md`. Wpis changelogu opisz zgodnie z faktycznymi zmianami (bez zawyżania liczby testów).
5. Zaktualizuj `RAPORT_NAPRAWCZY.md` (nowa sekcja 1.8.2) oraz dopisz poprawkę do twierdzeń o `MIN_REQUIRED_TERMS_VERSION` w poprzednim raporcie audytu.

---

## 10. Kryteria akceptacji

- `npm ci` bez `EBADENGINE`; `npm run lint` – 0 błędów; `npm test` – wszystkie dotychczasowe (47) plus nowe testy przechodzą; `npm run build` – sukces; `npm audit --omit=dev` – 0 podatności.
- Użytkownik z istniejącą bazą bez rekordu akceptacji oraz użytkownik z akceptacją `1.8.0` widzą okno zgody; dane pozostają nietknięte.
- Kopia powyżej limitu importu nie jest eksportowana „po cichu”.
- PDF z pominiętą kartą pokazuje ostrzeżenie, nie sukces.
- W `dist/` brak `assets/aistudio/`; jest `THIRD_PARTY_NOTICES.txt`.
- Aplikacja uruchomiona z CSP działa (SW, PDF, pobieranie, druk) – lub odstępstwa są opisane.
- Format kopii JSON/ZIP i schemat IndexedDB bez zmian; stare kopie (v1.0–v1.8.1) nadal się importują.

## 11. Raport końcowy (wymagany)

Podaj: wersję przed/po; listę ustaleń z statusem (naprawione / nieaktualne / odroczone z uzasadnieniem); listę zmienionych i dodanych plików; dokładne polecenia i ich wyniki; listę testów dodanych; elementy „NIEWYKONANE – wymaga przeglądarki” (Chrome/Edge/Android: PDF długich kart, CSP, aktualizacja SW z niezapisanymi zmianami, dwie karty, druk A4, instalacja PWA); listę miejsc wymagających decyzji wydawcy (daty w dokumentach prawnych, wybór lockfile, limit importu).

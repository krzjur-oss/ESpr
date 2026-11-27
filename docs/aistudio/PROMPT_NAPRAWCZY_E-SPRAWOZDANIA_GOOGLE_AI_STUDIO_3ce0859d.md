# Prompt naprawczy dla Google AI Studio — E‑Sprawozdania

**Projekt wejściowy:** `ESpr-main`  
**Wersja wskazana w `package.json`:** `1.7.0`  
**Cel:** bezpieczne utwardzenie istniejącej aplikacji bez przebudowy interfejsu, zmiany jej przeznaczenia ani usuwania funkcji.

---

## 1. Rola i sposób pracy

Działaj jako starszy inżynier oprogramowania specjalizujący się w React, TypeScript, IndexedDB, PWA, bezpieczeństwie danych i testowaniu aplikacji webowych.

Pracuj **bezpośrednio na aktualnym projekcie znajdującym się w środowisku Google AI Studio**. Najpierw przeanalizuj istniejący kod i zależności. Następnie wdrażaj poprawki małymi, kontrolowanymi etapami.

Nie twórz nowej aplikacji od zera. Nie zastępuj istniejących modułów uproszczonymi odpowiednikami. Nie usuwaj funkcjonalności, ekranów, typów dokumentów, pól formularzy, szablonów, danych, mechanizmów eksportu ani obsługi PWA.

### Bezwzględne zasady

1. Zachowaj obecny interfejs użytkownika, układ, kolorystykę, nazewnictwo, nawigację i dotychczasowy sposób obsługi.
2. Zachowaj wszystkie istniejące funkcjonalności i formaty danych, w szczególności pełne kopie JSON, paczki wniosków/szablonów, dokumenty, profile oraz pakiety nadzoru pedagogicznego.
3. Zachowaj architekturę Local‑First: dane użytkownika mają być przechowywane lokalnie, przede wszystkim w IndexedDB. Nie dodawaj wymogu konta, logowania, serwera ani połączenia z chmurą.
4. Zachowaj możliwość działania offline oraz instalowania aplikacji jako PWA.
5. Nie zmieniaj bez potrzeby biblioteki, frameworka, wersji zależności ani konfiguracji budowania.
6. Nie wykonuj destrukcyjnych migracji. Nie usuwaj ani nie nadpisuj danych użytkownika bez jawnego, bezpiecznego procesu.
7. Nie zmieniaj semantyki dokumentów, obliczeń, treści merytorycznych ani reguł biznesowych bez wykazania błędu i opisania wpływu.
8. Nie dodawaj fikcyjnych testów ani nie deklaruj zaliczenia testu, którego faktycznie nie uruchomiono.
9. Nie kończ pracy na przedstawieniu listy zaleceń. Wprowadzaj poprawki w kodzie, dodaj testy i zweryfikuj wynik.
10. Jeżeli środowisko nie pozwala wykonać konkretnego testu, opisz to w raporcie jako ograniczenie, nie jako wynik pozytywny.

---

## 2. Kontekst techniczny projektu

W archiwum projektu stwierdzono m.in.:

- React 19 i TypeScript;
- Vite 8;
- Tailwind CSS 4;
- `vite-plugin-pwa`;
- aplikację Local‑First PWA;
- bazę IndexedDB oraz migrację starszych danych z `localStorage`;
- przyrostowy zapis danych;
- synchronizację powiadomień między kartami przez `BroadcastChannel`;
- eksport i import danych JSON;
- osobne kolekcje dokumentów, własnych wniosków, szablonów i pakietów nadzoru;
- obsługę wydruków i eksportu dokumentów;
- konfigurację wdrożenia GitHub Actions.

Najważniejsze pliki do przeanalizowania przed zmianami:

- `src/utils/storage.ts`
- `src/App.tsx`
- `src/types/reports.ts`
- `src/utils/documentFactory.ts`
- `src/utils/supervision.ts`
- `src/components/BackupJsonView.tsx`
- `src/components/print/PrintDocumentRenderer.tsx`
- `src/components/print/ClassCollectivePrintSheet.tsx`
- `vite.config.ts`
- `index.html`
- `package.json`
- `tsconfig.json`
- `.github/workflows/deploy.yml`

To lista punktów wejścia, a nie ograniczenie zakresu analizy. Przed modyfikacją prześledź rzeczywiste zależności i przepływ danych.

---

## 3. Etap zerowy — audyt przed naprawą

Zanim zmienisz kod:

1. Przejrzyj strukturę całego projektu.
2. Sprawdź wszystkie skrypty z `package.json`.
3. Sprawdź konfigurację TypeScript, Vite, PWA i workflow wdrożeniowego.
4. Prześledź pełny przepływ:
   - uruchomienie aplikacji;
   - odczyt IndexedDB;
   - migracja danych legacy;
   - inicjalizacja stanu;
   - zapis przyrostowy;
   - import pełnej kopii;
   - eksport pełnej kopii;
   - import/eksport paczek wniosków i szablonów;
   - operacje na dokumentach;
   - obsługa wielu kart;
   - odzyskiwanie po błędach.
5. Wskaż miejsca, w których stan aplikacji może różnić się od stanu trwale zapisanego.
6. Sprawdź, czy operacje importu są atomowe i czy błędny plik może pozostawić bazę w stanie częściowo zmienionym.
7. Zapisz krótką listę ustaleń: **potwierdzony problem / potencjalne ryzyko / brak problemu**.

Nie zakładaj, że wcześniejszy raport jest nieomylny. Zweryfikuj każde wskazane ryzyko w aktualnym kodzie. Jeśli problem nie występuje albo jest już rozwiązany, nie wprowadzaj zbędnej zmiany.

---

## 4. Priorytet P0/P1 — integralność danych i konflikt zapisu

### 4.1. Ochrona przed nadpisaniem zmian z innej karty

W projekcie istnieje `BroadcastChannel` oraz powiadomienia o zapisie (`state_saved`). Samo powiadomienie nie gwarantuje jednak ochrony przed konfliktem.

Zaimplementuj mechanizm kontroli wersji danych:

1. Dodaj trwałą metad daną wersję/revision stanu w IndexedDB.
2. Każdy zapis powinien w jednej transakcji:
   - odczytać aktualną rewizję z bazy;
   - porównać ją z rewizją, na której oparto edytowany stan;
   - zapisać dane i zwiększyć rewizję tylko wtedy, gdy wersje są zgodne.
3. Jeżeli rewizja w bazie jest nowsza:
   - przerwij zapis konfliktowego stanu;
   - nie nadpisuj danych z bazy;
   - zgłoś kontrolowany konflikt do warstwy UI;
   - umożliw użytkownikowi odświeżenie danych z bazy.
4. Nie rozwiązuj konfliktu przez automatyczne „ostatni zapis wygrywa”.
5. Rozróżnij powiadomienie o zmianie od potwierdzenia, że zapis bieżącej karty zakończył się powodzeniem.
6. Zadbaj o zgodność z przeglądarkami, w których `BroadcastChannel` nie jest dostępny.
7. Nie blokuj bezterminowo pracy aplikacji, jeśli karta źródłowa zostanie zamknięta.

Ważne: kontrola rewizji musi być odporna na wyścigi. Samo wykonanie `get()` przed rozpoczęciem osobnej transakcji zapisu nie wystarcza. Odczyt rewizji, porównanie i zapis muszą być zabezpieczone w odpowiedniej transakcji IndexedDB.

### 4.2. Kolejkowanie zapisów

Sprawdź, czy kilka szybkich zmian stanu może uruchomić konkurujące zapisy.

Jeśli tak, wprowadź kolejkę zapisów lub równoważny mechanizm serializacji. Zapewnij:

- zachowanie kolejności zmian;
- brak utraty ostatniej zmiany;
- poprawną obsługę błędów;
- aktualizację `lastPersistedState` dopiero po potwierdzonym zatwierdzeniu transakcji;
- prawidłowe odtworzenie możliwości zapisu po błędzie.

Nie oznaczaj danych jako zapisanych przed `transaction.oncomplete`.

### 4.3. Widoczny status zapisu

Wykorzystaj istniejący mechanizm statusu zapisu, zamiast tworzyć drugi niezależny system.

Użytkownik musi rozróżniać co najmniej:

- zapisywanie;
- zapisano;
- konflikt z nowszą wersją danych;
- błąd zapisu / tryb bez trwałego zapisu.

Komunikaty powinny być zrozumiałe po polsku i nie mogą sugerować, że dane są bezpieczne, gdy istnieją wyłącznie w pamięci RAM.

### 4.4. Tryb awaryjny bez IndexedDB

Jeżeli aplikacja przechodzi do pamięci operacyjnej po błędzie IndexedDB:

- wyraźnie oznacz ten tryb;
- ostrzeż użytkownika, że zmiany mogą zniknąć po odświeżeniu lub zamknięciu karty;
- zapewnij eksport aktualnego stanu z pamięci, jeśli jest to możliwe;
- nie pokazuj statusu „zapisano” dla danych, których nie zapisano trwale;
- umożliw kontrolowaną próbę ponownego uruchomienia trwałego zapisu;
- nie usuwaj automatycznie bazy w ramach zwykłej obsługi błędu.

---

## 5. Priorytet P1 — walidacja importu i identyfikatory

Przeanalizuj funkcje sanitizujące w `src/utils/storage.ts`, w szczególności:

- `sanitizeCustomWnioski`;
- `sanitizeCustomTemplates`;
- `sanitizeDocuments`;
- `sanitizeSupervisionPackages`;
- `sanitizeSupervisionClassNotes`;
- `validateAndParseImportedJson`;
- `validateAndParseSharedPhrasesJson`.

### Wymagania

1. Zweryfikuj unikalność identyfikatorów w każdej kolekcji, w której ID jest kluczem głównym IndexedDB.
2. Sprawdź również identyfikatory zagnieżdżone, jeśli są wykorzystywane jako klucze lub referencje.
3. Nie pozwalaj, aby dwa rekordy o tym samym ID zostały po cichu nadpisane przez `put()`.
4. Ustal jednoznaczną politykę:
   - odrzucenie importu z czytelnym błędem albo
   - bezpieczne wygenerowanie nowego ID wraz z naprawieniem wszystkich referencji.
5. Preferuj odrzucenie niejednoznacznych danych, jeśli automatyczna naprawa mogłaby zmienić powiązania dokumentów.
6. Waliduj typy, wymagane pola, długości tekstów, daty, wartości liczbowe i dozwolone warianty.
7. Nie ufaj polom `app`, `kind` ani `version` bez ich sprawdzenia.
8. Nie dopuszczaj do importu danych o nieoczekiwanej strukturze, które mogłyby spowodować wyjątek w dalszej części aplikacji.
9. Zwracaj użytkownikowi konkretny komunikat, bez ujawniania stosu technicznego.
10. Walidacja musi nastąpić przed jakąkolwiek modyfikacją bazy.

### Atomowość importu

Import pełnej kopii powinien być operacją „wszystko albo nic”:

- najpierw sparsuj i zwaliduj cały plik;
- przygotuj kompletny stan docelowy;
- wykonaj zapis w jednej odpowiednio zaprojektowanej transakcji IndexedDB;
- przy błędzie transakcja ma zostać przerwana;
- po błędzie stara baza ma pozostać nienaruszona;
- dopiero po potwierdzonym zapisie zaktualizuj stan aplikacji.

Analogicznie zabezpiecz import paczek wniosków i szablonów. Nie zmieniaj ich dotychczasowego formatu bez konieczności.

---

## 6. Priorytet P1 — migracja i odzyskiwanie danych

Przeanalizuj migrację z `localStorage` do IndexedDB oraz inicjalizację świeżej bazy.

Wymagania:

1. Migracja musi być idempotentna — ponowne uruchomienie nie może tworzyć duplikatów ani usuwać danych.
2. Nie usuwaj klucza legacy z `localStorage`, dopóki zapis danych do IndexedDB nie zostanie potwierdzony.
3. Po błędzie migracji zachowaj oryginalne dane legacy.
4. Rozróżnij:
   - brak danych legacy;
   - poprawne dane legacy;
   - uszkodzone dane legacy;
   - błąd odczytu;
   - błąd zapisu do IndexedDB.
5. Nie traktuj błędnego odczytu jako pustej bazy i nie inicjalizuj w takim przypadku danych domyślnych bez ostrzeżenia.
6. Zadbaj o migracje schematu IndexedDB w kolejnych wersjach.
7. Przygotuj testy dla przerwania migracji w różnych punktach.
8. Nie zmieniaj istniejących danych ani ich znaczenia.

Sprawdź również `wipeDatabaseForRecovery`. Upewnij się, że funkcja usuwająca bazę nie jest uruchamiana automatycznie w zwykłej ścieżce obsługi błędów i że użytkownik nie może przypadkowo utracić danych bez wyraźnego potwierdzenia.

---

## 7. Priorytet P2 — bezpieczne pobieranie plików

W `src/utils/storage.ts` i innych modułach wyszukaj użycia:

- `URL.createObjectURL`;
- `URL.revokeObjectURL`.

Zweryfikuj sposób pobierania plików JSON i paczek.

Jeżeli URL jest zwalniany bezpośrednio po `a.click()`, zmień to na bezpieczny mechanizm opóźnionego zwolnienia, który nie powoduje wycieku zasobów i działa w Chrome, Edge, Firefox oraz przeglądarkach mobilnych.

Wymagania:

- zachowaj nazwy plików i dotychczasowe formaty;
- nie zmieniaj zawartości eksportów bez uzasadnienia;
- zapewnij poprawne sprzątanie elementów DOM;
- obsłuż błędy tam, gdzie przeglądarka pozwala je wykryć;
- nie deklaruj, że pobieranie zakończyło się sukcesem, jeśli aplikacja nie ma takiego potwierdzenia.

---

## 8. Priorytet P2 — pełna niezależność offline i czcionki

Obecny `index.html` odwołuje się do Google Fonts, a `vite.config.ts` zawiera reguły cache dla zasobów Google.

Zbadaj możliwość dołączenia używanych rodzin i wariantów czcionek lokalnie do projektu.

Jeżeli licencje i rozmiar zasobów na to pozwalają:

1. Dołącz lokalne pliki fontów.
2. Zmień `@font-face` i odwołania w CSS.
3. Usuń zależność od zewnętrznych żądań fontów.
4. Zaktualizuj konfigurację Workbox, aby fonty lokalne były uwzględniane w precache.
5. Zachowaj wygląd aplikacji możliwie identyczny z obecnym.

Jeżeli nie można legalnie lub technicznie dołączyć fontów, pozostaw bezpieczny lokalny fallback i opisz ograniczenie. Nie pobieraj fontów z niezweryfikowanych źródeł.

Przetestuj:

- pierwszą wizytę online;
- kolejne uruchomienie offline;
- instalację PWA;
- odświeżenie aplikacji offline;
- aktualizację service workera.

Nie usuwaj konfiguracji PWA ani mechanizmu `autoUpdate` bez wykazania konkretnego problemu i zapewnienia równoważnego rozwiązania.

---

## 9. Priorytet P2 — TypeScript i jakość kodu

Obecny `tsconfig.json` nie włącza `strict`.

Nie włączaj wszystkich rygorystycznych flag jednym ruchem, jeśli spowoduje to dużą liczbę niekontrolowanych zmian. Zastosuj podejście etapowe:

1. Uruchom istniejący skrypt `npm run lint`.
2. Zapisz aktualny wynik.
3. Włącz `strict` lub najpierw jego bezpieczne składowe w zakresie, który można naprawić bez zmiany logiki.
4. Napraw błędy typowania bez nadużywania `any`, rzutowań `as` i operatora `!`.
5. Rozważ `noUncheckedIndexedAccess` oraz `exactOptionalPropertyTypes` jako kolejne etapy.
6. Nie obniżaj poziomu kontroli typów tylko po to, aby kompilacja przeszła.

Ważne: TypeScript w projekcie ma wersję zadeklarowaną jako `^7.0.2`. Sprawdź rzeczywiście zainstalowaną wersję i zgodność użytych flag z tą wersją.

---

## 10. Priorytet P1 — testy automatyczne

Dodaj testy automatyczne. Preferuj Vitest, jeśli jest zgodny z aktualnym Vite i środowiskiem projektu. Nie instaluj niepotrzebnie ciężkiego stosu testowego.

### Minimalny zakres testów

**A. Walidacja i sanitizacja**
- poprawny dokument;
- niekompletny dokument;
- niepoprawne typy;
- brakujące ID;
- powtarzające się ID;
- błędne daty;
- nieznane typy dokumentów;
- błędne rekordy własnych wniosków;
- błędne szablony;
- błędne pakiety nadzoru.

**B. Import i eksport**
- eksport pełnej kopii;
- ponowny import eksportowanej kopii;
- import starej wersji danych;
- import uszkodzonego JSON;
- import pliku o niezgodnym `app`/`kind`;
- import z duplikatami ID;
- import paczki wniosków;
- import paczki szablonów;
- błąd zapisu w trakcie importu i potwierdzenie, że baza pozostała niezmieniona.

**C. IndexedDB i zapis**
- pierwsza inicjalizacja;
- zapis nowego dokumentu;
- aktualizacja dokumentu;
- usunięcie dokumentu;
- zapis przyrostowy;
- zapis pełny;
- błąd transakcji;
- konflikt rewizji;
- równoległe żądania zapisu;
- brak IndexedDB.

**D. Migracja**
- brak legacy;
- poprawne legacy;
- legacy z brakującymi polami;
- uszkodzony JSON;
- błąd zapisu do IndexedDB;
- ponowienie migracji;
- potwierdzenie, że legacy nie jest usuwane przed skutecznym zapisem.

**E. Regresja funkcjonalna**
- tworzenie każdego typu dokumentu;
- edycja i zapis;
- duplikowanie;
- usuwanie z potwierdzeniem;
- zmiana aktywnego dokumentu;
- przenoszenie na kolejny rok szkolny;
- tworzenie i eksport pakietu nadzoru;
- porównywanie pakietów;
- wydruk dokumentu i arkusza zbiorczego.

Nie ograniczaj się do testów typu „funkcja zwraca wartość”. Testuj również niezmienniki danych i skutki uboczne.

---

## 11. Bezpieczeństwo i prywatność

Aplikacja może przechowywać dane uczniów, nauczycieli i dokumentację szkolną. Zachowaj zasadę minimalizacji danych i lokalnego przechowywania.

Sprawdź:

1. Czy importowany tekst może zostać zinterpretowany jako HTML lub kod.
2. Czy dane użytkownika są renderowane przez bezpieczne mechanizmy React.
3. Czy w kodzie występuje `dangerouslySetInnerHTML`, `eval`, `new Function` lub niebezpieczne wstrzykiwanie treści.
4. Czy błędy nie ujawniają danych osobowych w konsoli lub komunikatach.
5. Czy eksport wyraźnie informuje, że plik JSON może zawierać dane osobowe i nie jest domyślnie szyfrowany.
6. Czy interfejs nie sugeruje, że IndexedDB zapewnia szyfrowanie danych.

Nie dodawaj własnego, pozornego szyfrowania. Jeśli proponujesz szyfrowanie kopii, zaprojektuj je jako osobną, opcjonalną funkcję z prawidłowym zarządzaniem hasłem i wersjonowaniem formatu — nie wdrażaj jej kosztem kompatybilności obecnych kopii.

---

## 12. Wydruki i formularze — testy regresyjne

Nie zmieniaj wyglądu dokumentów bez potrzeby.

Sprawdź:

- polskie znaki;
- łamanie stron;
- nagłówki i stopki;
- tabele i długie teksty;
- puste i opcjonalne pola;
- dokumenty wielostronicowe;
- wydruk zbiorczy;
- skalowanie na A4;
- marginesy;
- podgląd wydruku w Chrome i Edge.

Wprowadź poprawki wyłącznie tam, gdzie występuje potwierdzony błąd. Zachowaj istniejące nazwy dokumentów, treści, pola i układ.

---

## 13. Wymagania dotyczące wersjonowania i kompatybilności

1. Nie zmieniaj formatu kopii JSON bez konieczności.
2. Jeżeli zmiana formatu jest nieunikniona, wprowadź jawne wersjonowanie i obsługę importu starszych wersji.
3. Nie usuwaj obsługi dotychczasowych kopii.
4. Zachowaj identyfikatory i powiązania dokumentów.
5. Nie zmieniaj `DB_NAME` ani istniejących kluczy magazynów IndexedDB bez uzasadnienia i migracji.
6. Nie zmieniaj ścieżek routingu ani `base` dla GitHub Pages.
7. Zachowaj możliwość uruchomienia aplikacji lokalnie i wdrożenia przez obecny workflow.
8. Nie usuwaj niestandardowego kroku kopiowania `src/assets` do `dist` w `vite.config.ts` — przed zmianą sprawdź, do czego służy.
9. Zwiększ wersję aplikacji dopiero po zakończeniu prac i zgodnie z przyjętą konwencją changeloga.
10. Uzupełnij `src/data/changelog.ts` o rzeczywiście wdrożone zmiany.

---

## 14. Kolejność realizacji

Wykonuj prace w następujących etapach. Po każdym etapie uruchom odpowiednie testy i sprawdź, czy aplikacja nadal się buduje.

### Etap 1 — bezpieczeństwo zapisu
- analiza i poprawa zapisu IndexedDB;
- serializacja zapisów;
- rewizje i wykrywanie konfliktów;
- statusy zapisu;
- bezpieczny tryb awaryjny.

### Etap 2 — import, eksport i migracje
- walidacja wszystkich kolekcji;
- kontrola unikalności ID;
- atomowy import;
- zabezpieczenie migracji legacy;
- testy kopii i odzyskiwania.

### Etap 3 — offline i pobieranie
- bezpieczne zwalnianie Object URL;
- lokalne fonty lub lokalny fallback;
- testy PWA i offline.

### Etap 4 — TypeScript i testy
- stopniowe zaostrzenie kontroli typów;
- testy jednostkowe i integracyjne;
- testy regresji kluczowych procesów.

### Etap 5 — kontrola końcowa
- pełny build;
- pełny zestaw testów;
- przegląd zmian;
- aktualizacja dokumentacji i changeloga;
- raport końcowy.

Nie przechodź do kolejnego etapu, jeśli poprzedni pozostawia błędy krytyczne lub ryzyko utraty danych.

---

## 15. Kryteria akceptacji — warunki wydania

Wydanie można uznać za gotowe dopiero wtedy, gdy wszystkie poniższe warunki są spełnione albo jawnie opisane jako niewykonalne w danym środowisku:

- [ ] `npm ci` kończy się powodzeniem.
- [ ] `npm run lint` kończy się powodzeniem.
- [ ] `npm run build` kończy się powodzeniem.
- [ ] Wszystkie dodane testy przechodzą.
- [ ] Import błędnego pliku nie modyfikuje istniejących danych.
- [ ] Import poprawnej kopii odtwarza dane.
- [ ] Eksport tworzy poprawny plik JSON.
- [ ] Migracja legacy nie usuwa danych przed potwierdzonym zapisem.
- [ ] Powtarzające się ID nie powodują cichego nadpisania rekordów.
- [ ] Konflikt między kartami nie powoduje utraty zmian.
- [ ] Błąd IndexedDB nie jest przedstawiany jako udany zapis.
- [ ] Aplikacja nadal działa offline.
- [ ] PWA można zainstalować i uruchomić.
- [ ] Wszystkie dotychczasowe typy dokumentów i funkcje są dostępne.
- [ ] Wydruki i eksporty zachowują dotychczasową funkcjonalność.
- [ ] Nie ma niezamierzonych zmian wizualnych.
- [ ] Nie ma nowych błędów w konsoli.
- [ ] Dotychczasowe kopie JSON pozostają obsługiwane.

---

## 16. Raport końcowy — wymagany plik Markdown

Po zakończeniu prac utwórz w katalogu głównym projektu plik:

`RAPORT_NAPRAWCZY.md`

Raport ma zawierać:

1. numer wersji przed i po zmianach;
2. listę wykrytych problemów;
3. listę faktycznie wprowadzonych poprawek;
4. listę zmienionych i dodanych plików;
5. opis zmian w schemacie IndexedDB i migracjach;
6. opis zgodności ze starszymi kopiami JSON;
7. listę dodanych testów;
8. dokładne polecenia uruchomione podczas weryfikacji;
9. wyniki `npm ci`, `npm run lint`, `npm run build` i testów;
10. znane ograniczenia i testy niewykonane;
11. ocenę ryzyka wdrożenia;
12. instrukcję bezpiecznej aktualizacji istniejącej instalacji.

Każdy wynik testu oznacz jako:
- **PASS** — faktycznie wykonany i zaliczony;
- **FAIL** — wykonany i niezaliczony;
- **NOT RUN** — niewykonany;
- **BLOCKED** — niemożliwy do wykonania z powodu ograniczeń środowiska.

Nie wpisuj PASS na podstawie samej analizy kodu.

---

## 17. Instrukcja końcowa dla agenta

Rozpocznij od analizy aktualnego repozytorium, a następnie wykonaj naprawy w opisanej kolejności.

**Najważniejszy priorytet to ochrona danych użytkownika.** Jeśli poprawka może naruszyć istniejące dane, format kopii lub kompatybilność, najpierw przygotuj test i bezpieczną migrację.

Przed każdą większą zmianą:
- sprawdź istniejące rozwiązanie;
- ustal wpływ na pozostałe moduły;
- zachowaj kompatybilność;
- dodaj test regresyjny.

Po każdej zmianie uruchom odpowiednie testy. Nie maskuj błędów przez wyciszanie wyjątków, wyłączanie kontroli typów ani usuwanie funkcjonalności.

Nie przebudowuj interfejsu. Nie zmieniaj wyglądu aplikacji „przy okazji”. Nie usuwaj żadnych istniejących opcji. Nie zastępuj prawdziwej funkcjonalności atrapą.

**Oczekiwany rezultat:** poprawiony, przetestowany i nadal kompatybilny projekt E‑Sprawozdania, gotowy do dalszej weryfikacji przed wdrożeniem, wraz z plikiem `RAPORT_NAPRAWCZY.md`.

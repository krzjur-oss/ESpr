# Prompt naprawczy dla Google AI Studio — E‑Sprawozdania 1.8.0

**Projekt wejściowy:** `ESpr-main` z archiwum `ESpr-main (2).zip`  
**Wersja bazowa:** `1.8.0`  
**Cel:** naprawa potwierdzonych problemów bezpieczeństwa importu, doprecyzowanie informacji prawnych i prywatności oraz uzupełnienie testów, bez przebudowy aplikacji i bez utraty danych.

---

## 1. Rola i zasady pracy

Działaj jako starszy inżynier oprogramowania specjalizujący się w React, TypeScript, IndexedDB, PWA, bezpieczeństwie aplikacji webowych i testach. Dodatkowo przygotuj technicznie poprawne, ostrożne redakcyjnie dokumenty prawne, ale nie udzielaj wiążącej opinii prawnej.

Pracuj bezpośrednio na istniejącym projekcie E‑Sprawozdania w środowisku Google AI Studio. Najpierw zbadaj aktualny kod, następnie wprowadzaj zmiany małymi etapami. Nie twórz nowej aplikacji od zera.

### Bezwzględne wymagania

1. Zachowaj istniejący interfejs, układ, kolory, nawigację, nazwy funkcji i sposób obsługi.
2. Zachowaj wszystkie sześć typów dokumentów, pola formularzy, szablony, bazę wniosków, profile, archiwum lat szkolnych, nadzór dyrektora, porównywanie wersji, eksport PDF, druk A4, JSON, ZIP, PWA i pracę offline.
3. Zachowaj architekturę Local‑First. Nie dodawaj kont, logowania, backendu, synchronizacji chmurowej ani przesyłania treści dokumentów na serwer.
4. Nie zmieniaj bez potrzeby bibliotek, frameworka, schematu IndexedDB, kluczy, identyfikatorów ani formatu kopii.
5. Nie wykonuj destrukcyjnych migracji. Nie usuwaj, nie nadpisuj i nie resetuj danych użytkownika bez jawnej, odrębnej akcji i bezpiecznej kopii.
6. Zachowaj kompatybilność wsteczną importu kopii utworzonych przez wcześniejsze wersje, chyba że wykryta struktura jest niebezpieczna lub niepoprawna. W takim przypadku pokaż zrozumiały błąd, nie modyfikując danych.
7. Nie zmieniaj merytorycznej treści generowanych dokumentów, obliczeń ani reguł biznesowych, chyba że jest to konieczne do naprawy potwierdzonego błędu.
8. Nie usuwaj istniejących testów. Nie zastępuj ich testami pozornymi.
9. Nie deklaruj zaliczenia testów, których faktycznie nie uruchomiono.
10. Nie dodawaj fikcyjnych informacji o hostingu, administratorze, retencji logów ani certyfikatach.

---

## 2. Etap zerowy — audyt przed zmianą

Przed edycją:

1. Odczytaj `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `.github/workflows/deploy.yml`, `src/utils/storage.ts`, `src/utils/zipBackup.ts`, `src/components/BackupJsonView.tsx`, `src/components/legal/LegalDocumentsContent.tsx`, `REGULAMIN.md`, `LICENSE.md` oraz wszystkie testy.
2. Ustal rzeczywiste ścieżki importu JSON i ZIP, walidacji, zapisu IndexedDB i aktualizacji stanu React.
3. Sprawdź, czy import zachowuje atomowość: nie może zmienić stanu React ani IndexedDB przed przejściem pełnej walidacji i zatwierdzeniem zapisu.
4. Zweryfikuj, czy dotychczasowe mechanizmy rewizji, kolejki zapisów, migracji `localStorage`, eksportu i konfliktów wielu kart działają i nie wymagają niepotrzebnych zmian.
5. Zapisz listę ustaleń: potwierdzone / naprawione wcześniej / ryzyko / nieweryfikowalne.

Nie zakładaj, że ten prompt lub poprzedni raport są bezbłędne. Każde działanie powiąż z konkretnym plikiem i testem.

---

## 3. P1 — zabezpieczenie importu JSON i ZIP

### 3.1. Limity przed odczytem pliku

W `src/components/BackupJsonView.tsx`:

- przed `file.arrayBuffer()` i `file.text()` sprawdzaj `file.size`;
- odrzucaj plik przekraczający limit i wyświetl komunikat w języku polskim;
- limit powinien być wspólną, nazwaną stałą, udokumentowaną i używaną zarówno dla JSON, jak i ZIP;
- dobierz rozsądny domyślny limit (np. 25 MiB) i opisz, jak użytkownik może odzyskać dane, jeśli kopia jest większa; nie zmieniaj eksportu bez konieczności;
- nie rozpoczynaj odczytu pliku po przekroczeniu limitu.

Po odczytaniu JSON sprawdź także długość tekstu przed `JSON.parse` w funkcji walidującej, aby zabezpieczenie nie zależało wyłącznie od interfejsu.

### 3.2. Ochrona dekompresji ZIP

W `src/utils/zipBackup.ts` zastąp bezwarunkowe, synchroniczne `unzipSync()` bezpieczniejszą ścieżką, która kontroluje zasoby. Wykorzystaj możliwości `fflate` zgodne z zainstalowaną wersją; nie wymyślaj nieistniejących opcji biblioteki.

Wymagane zabezpieczenia:

- maksymalna liczba wpisów archiwum;
- maksymalny rozmiar pojedynczego wpisu po dekompresji;
- maksymalny łączny rozmiar danych po dekompresji;
- kontrola deklarowanych rozmiarów i współczynnika kompresji, jeśli format i parser udostępniają wiarygodne dane;
- przerwanie operacji natychmiast po przekroczeniu budżetu;
- ochrona przed długotrwałym blokowaniem głównego wątku (preferuj przetwarzanie strumieniowe/asynchroniczne albo Web Worker, jeśli da się go wdrożyć bez naruszenia kompatybilności Vite/PWA);
- sprawdzenie, czy archiwum zawiera wymagany `pelna-kopia-esprawozdania.json` i czy wpis jest prawidłowym plikiem;
- odrzucanie archiwów uszkodzonych, niekompletnych i przekraczających limity z jednoznacznym komunikatem.

Nie zapisuj rozpakowanych plików do systemu plików. Nie otwieraj ścieżek z archiwum jako URL. Nie wprowadzaj obsługi dowolnych archiwów — import ma obsługiwać format kopii aplikacji.

### 3.3. Atomowość i bezpieczeństwo danych

- Walidacja całej kopii musi zakończyć się przed zmianą danych.
- Błąd parsera, limitu, walidacji lub transakcji ma pozostawić dotychczasowy stan bez zmian.
- Nie usuwaj bieżącej kopii ani nie wykonuj automatycznego resetu.
- Przed importem pokaż ostrzeżenie, że bieżąca sesja zostanie zastąpiona; zalecaj wykonanie aktualnej kopii.
- Nie zmieniaj zachowania przy poprawnym pliku, poza dodaniem limitów i bezpiecznej obsługi błędów.

---

## 4. P1 — testy regresyjne importu

Dodaj testy do istniejącego Vitest. Użyj fixture’ów generowanych w teście, nie dodawaj wielkich binarnych plików do repozytorium.

Obowiązkowe scenariusze:

1. Poprawny JSON eksportowany przez aplikację — import przechodzi.
2. Poprawny ZIP z `buildBackupZipBytes()` — import przechodzi.
3. Pusty plik JSON i pusty ZIP — odrzucenie bez zmian danych.
4. Niepoprawny JSON, ucięty ZIP i ZIP bez głównego pliku kopii — odrzucenie.
5. Plik przekraczający limit — odrzucenie przed `arrayBuffer()`/`text()`.
6. ZIP z bardzo dużą liczbą wpisów — odrzucenie.
7. ZIP z małym rozmiarem skompresowanym, ale nadmiernym rozmiarem po dekompresji (ZIP bomb) — bez przekroczenia budżetu pamięci.
8. ZIP z pojedynczym wpisem przekraczającym limit — odrzucenie.
9. ZIP z duplikatami nazw wpisów — jednoznaczna i bezpieczna obsługa; preferuj odrzucenie.
10. JSON z duplikatami ID i kluczami prototypu — zachowanie dotychczasowej walidacji i odrzucenie.
11. Błąd transakcji IndexedDB podczas importu — stary stan pozostaje aktywny.
12. Błąd parsera — komunikat dla użytkownika bez utraty bieżącej sesji.

Testy muszą asertywnie sprawdzać, że dane IndexedDB i stan UI nie uległy zmianie po nieudanym imporcie.

---

## 5. P1 — poprawa regulaminu i informacji o prywatności

Zaktualizuj jednocześnie:

- `REGULAMIN.md`;
- `src/components/legal/LegalDocumentsContent.tsx`;
- ewentualne komunikaty w `README.md` i `src/components/BackupJsonView.tsx`.

Wersja pliku i wersja wyświetlana w aplikacji muszą być zgodne. Nie zmieniaj daty wejścia w życie na fikcyjną. Zastosuj rzeczywistą datę wdrożenia albo oznacz ją jako wymagającą uzupełnienia przez wydawcę.

### 5.1. Precyzyjny opis danych

Zastąp absolutne stwierdzenia w rodzaju „żadne dane nie opuszczają urządzenia” precyzyjnym komunikatem:

- treść formularzy, dokumentów, profilu i baz użytkownika jest przechowywana lokalnie w IndexedDB;
- przegląd kodu aplikacji nie wykazuje wysyłania treści dokumentów do backendu aplikacji;
- strona jest publikowana jako statyczna aplikacja (sprawdź aktualną konfigurację wdrożenia); dostawca hostingu może przetwarzać dane techniczne połączenia, zgodnie ze swoją dokumentacją i konfiguracją;
- Service Worker pobiera i buforuje statyczne zasoby aplikacji;
- aplikacja nie szyfruje automatycznie IndexedDB ani eksportów JSON/ZIP.

Nie twierdź, że hosting nie zbiera adresów IP ani że logi są usuwane po określonym czasie, jeżeli nie masz potwierdzenia w dokumentacji dostawcy.

### 5.2. Role RODO

Usuń kategoryczne stwierdzenie, że administratorem jest „wyłącznie użytkownik lub placówka”. Wyjaśnij:

- role wynikają z rzeczywistego celu i sposobu przetwarzania;
- przy użyciu służbowym danych uczniów administratorem jest zwykle szkoła/placówka, a nauczyciel działa w ramach upoważnienia i instrukcji administratora;
- autor aplikacji nie staje się automatycznie administratorem treści lokalnych tylko dlatego, że stworzył program;
- rola dostawcy hostingu w odniesieniu do danych technicznych wymaga oceny na podstawie jego warunków i rzeczywistych przepływów.

Nie przypisuj autorowi roli podmiotu przetwarzającego, jeżeli nie ma dowodów na przetwarzanie treści dokumentów w jego imieniu.

### 5.3. Minimalizacja i dane szczególnych kategorii

Dodaj ostrzeżenie, że pola opisowe mogą zawierać dane o zdrowiu, niepełnosprawności lub innych szczególnych kategoriach. Zalecaj:

- wpisywanie tylko danych niezbędnych do celu;
- unikanie zbędnych danych identyfikujących ucznia;
- używanie aplikacji wyłącznie zgodnie z upoważnieniem i procedurami szkoły;
- ustalenie przez administratora właściwej podstawy z art. 6 i, jeśli dotyczy, art. 9 RODO;
- nieprzyjmowanie zgody rodzica/ucznia jako domyślnej podstawy przetwarzania.

Nie dawaj użytkownikowi gotowej, uniwersalnej podstawy prawnej — zależy ona od konkretnej placówki i celu.

### 5.4. Kopie i bezpieczeństwo

Wyraźnie napisz, że:

- IndexedDB nie jest szyfrowane przez aplikację;
- JSON, ZIP i paczki nadzoru nie są szyfrowane;
- pliki mogą zawierać dane uczniów i nauczycieli;
- należy używać kont systemowych chronionych hasłem, blokady ekranu, bezpiecznego nośnika i ograniczonego dostępu;
- nie należy wysyłać kopii zwykłym, niezabezpieczonym kanałem;
- usunięcie danych witryny nie usuwa plików kopii zapisanych poza przeglądarką.

---

## 6. P1 — status prawny generowanych dokumentów

Dodaj widoczny, zwięzły komunikat w opisie aplikacji i w widoku informacji prawnych:

„E‑Sprawozdania jest narzędziem pomocniczym do przygotowywania roboczych kart, zestawień i sprawozdań. Nie zastępuje dzienników, arkuszy ocen ani innej dokumentacji, której prowadzenie, treść, forma, podpisy i przechowywanie wynikają z przepisów prawa lub procedur placówki. Przed wykorzystaniem dokumentu należy zweryfikować jego zgodność z wymaganiami dyrektora i szkoły.”

Nie deklaruj, że każdy dokument generowany przez aplikację spełnia wymogi rozporządzenia o dokumentacji przebiegu nauczania. Nie usuwaj istniejących typów dokumentów.

---

## 7. P1 — korekta licencji WLDE

Zaktualizuj `LICENSE.md` i `WldeLicenseContent` w `LegalDocumentsContent.tsx` spójnie.

1. Zmień mylącą nazwę „Wolna Licencja” na neutralną nazwę, np. „Ograniczona licencja bezpłatnego użytku edukacyjnego i prywatnego (WLDE)”. Jeśli nazwa WLDE ma pozostać z powodów historycznych, wyraźnie zaznacz, że nie jest to licencja wolnego oprogramowania/open source.
2. Zachowaj zamierzony zakres bezpłatnego użytku nauczycieli, specjalistów, placówek i użytkowników prywatnych.
3. W zakazach kopiowania, testowania, dekompilacji i inżynierii wstecznej dodaj wyjątek dla bezwzględnie obowiązujących uprawnień wynikających z art. 75 ust. 2 i 3 oraz art. 76 ustawy o prawie autorskim i prawach pokrewnych.
4. Nie twierdź, że użytkownik nie może sporządzić kopii zapasowej w warunkach przewidzianych ustawą.
5. Nie zakazuj obserwowania, badania i testowania w zakresie chronionym ustawą.
6. Nie twórz postanowień, które próbują wyłączyć ustawowe prawa użytkownika.
7. Zachowaj prawa autora do kodu i prawidłowo oznacz prawa do własnych dokumentów użytkownika.
8. Dodaj zastrzeżenie, że prawa do elementów zewnętrznych (biblioteki, fonty, grafiki) są regulowane ich własnymi licencjami.

Nie przesądzaj, że autor ma wyłączne prawa do całego kodu bez weryfikacji pochodzenia. Dodaj notatkę do raportu, że właściciel powinien sprawdzić, czy część programu nie powstała w ramach obowiązków pracowniczych (art. 74 ust. 3).

---

## 8. P2 — odpowiedzialność i zmiany regulaminu

Przeredaguj klauzule „AS IS” w regulaminie i licencji:

- nie wyłączaj odpowiedzialności w zakresie, w którym zakazuje tego prawo;
- nie wyłączaj odpowiedzialności za szkodę wyrządzoną umyślnie;
- nie sugeruj, że użytkownik traci ustawowe prawa lub roszczenia;
- zachowaj uczciwe zastrzeżenie, że aplikacja jest udostępniana bez gwarancji nieprzerwanego działania i że użytkownik powinien wykonywać kopie zapasowe.

Zmień klauzulę o zmianie regulaminu:

- podawaj numer wersji i datę wejścia w życie;
- archiwizuj poprzednie wersje;
- informuj o istotnych zmianach w aplikacji;
- żądaj ponownego potwierdzenia, jeśli zmiana istotnie zmienia warunki korzystania;
- nie przyjmuj, że dalsze korzystanie automatycznie legalizuje każdą zmianę w każdej relacji.

Jeżeli nie da się ustalić, czy ustawa o prawach konsumenta ma zastosowanie do konkretnego modelu bezpłatnego udostępnienia, opisz to jako kwestię zależną od statusu dostawcy i okoliczności, zamiast przesądzać.

---

## 9. P2 — CI, testy i bezpieczeństwo wdrożenia

W `.github/workflows/deploy.yml` dodaj uruchamianie `npm test` po `npm ci` i przed wdrożeniem. Kolejność minimalna:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. dopiero potem publikacja artefaktu.

Nie aktualizuj zależności do najnowszych wersji bez potrzeby. Nie zmieniaj `package-lock.json`, jeżeli nie ma realnej zmiany zależności.

Przygotuj checklistę w raporcie dla hostingu:

- CSP dopasowana do rzeczywistych źródeł zasobów;
- HSTS, jeśli działa HTTPS i domena spełnia warunki;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy`;
- `Permissions-Policy` ograniczająca nieużywane API;
- weryfikacja konfiguracji cache i Service Workera;
- przegląd zależności i ich licencji.

Nie deklaruj, że nagłówki zostały wdrożone, jeśli zmiany w hostingu nie zostały rzeczywiście wykonane i zweryfikowane.

---

## 10. Testy manualne po naprawie

Wykonaj lub opisz jako niewykonane:

- import i eksport JSON oraz ZIP na Chrome/Edge/Firefox;
- import na Androidzie;
- import poprawnej kopii z poprzedniej wersji;
- błędny import i przekroczenie limitów;
- dwie otwarte karty i równoległy zapis;
- awaria IndexedDB / brak miejsca / tryb prywatny;
- aktualizacja PWA z niezapisanymi zmianami;
- wydruk A4 i eksport PDF;
- dostępność klawiaturą, czytnikiem ekranu i powiększeniem.

---

## 11. Wymagane pliki wynikowe

Po zakończeniu utwórz i zaktualizuj:

1. `RAPORT_AUDYTU_E-SPRAWOZDANIA_1.8.0.md` — raport stanu wyjściowego, lista zmian, pliki zmienione, testy z rzeczywistymi wynikami, ograniczenia i pozostałe ryzyka.
2. `RAPORT_NAPRAWCZY.md` — raport faktycznie wdrożonych poprawek, jeśli jest to plik używany w repozytorium; nie wpisuj działań, których nie wykonano.
3. `REGULAMIN.md` — aktualny regulamin i informacja o prywatności.
4. `LICENSE.md` — skorygowana licencja.

Nie nadpisuj istniejącego raportu historycznego bez zachowania jego treści; jeżeli to konieczne, przenieś go do historii albo dopisz nową sekcję z datą.

---

## 12. Raportowanie postępu i kryteria zakończenia

Pracuj etapami. Po każdym etapie podaj:

- pliki zmienione;
- problem, który rozwiązano;
- testy dodane;
- polecenia faktycznie uruchomione i ich kody zakończenia;
- znane ograniczenia.

Pracę uznaj za zakończoną dopiero wtedy, gdy:

- import ma limity i ochronę dekompresji;
- wszystkie wymagane testy bezpieczeństwa importu istnieją i przechodzą;
- `npm run lint`, `npm test` i `npm run build` przechodzą w czystym środowisku po `npm ci`;
- CI uruchamia testy przed wdrożeniem;
- treści prawne w Markdown i interfejsie są spójne;
- zachowano istniejący UI, funkcje, formaty danych, dane i PWA;
- raport odróżnia wykonane naprawy od zaleceń i rzeczy nieweryfikowalnych.

Jeżeli środowisko Google AI Studio nie pozwala uruchomić testu lub zmienić konfiguracji hostingu, nie oznaczaj tego jako sukcesu. Pozostaw jasny wpis „NIEWYKONANE — wymaga weryfikacji poza środowiskiem”.

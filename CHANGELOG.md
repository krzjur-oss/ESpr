# Historia zmian (Changelog) — E-Sprawozdania

Wszystkie istotne zmiany w programie **E-Sprawozdania — Kreator Sprawozdań Szkolnych** są dokumentowane poniżej oraz w zakładce **O programie → Historia zmian** w samej aplikacji.

---

## [1.8.0] — 26.11.2026

**Bezpośredni eksport PDF, archiwum ZIP, blokada kart oraz zgoda startowa**

Dodano bezpośrednie pobieranie plików PDF z paskiem postępu, pełne archiwa kopii zapasowej `.zip`, blokadę zatwierdzonych kart dokumentów, wskaźnik ostatniej modyfikacji oraz obowiązkową akceptację regulaminu przy pierwszym uruchomieniu.

- Wprowadzono obowiązkową akceptację Regulaminu, Polityki Prywatności (RODO), Licencji WLDE oraz noty o kopiach zapasowych przy pierwszym uruchomieniu programu (lub na pustej bazie), wraz z wyróżnioną ramką i automatycznymi przypomnieniami o kopii JSON/ZIP.
- Dodano eksport i import pełnego archiwum kopii zapasowej w formacie `.zip` w zakładce **„Kopia JSON”** (zawierającego pełną kopię do przywrócenia, profil, wszystkie karty dokumentów w osobnych plikach oraz bazy własnych wniosków, szablonów i paczek nadzoru).
- Zintegrowano bibliotekę `jsPDF` (wraz z `html2canvas-pro`) umożliwiającą bezpośrednie generowanie i pobieranie pojedynczych kart, kompletów sprawozdań oraz zbiorczych raportów klas w Nadzorze dyrektora jako pliki `.pdf`.
- Dodano widoczny pasek postępu (progress bar) i licznik przetwarzanych dokumentów podczas generowania plików PDF, z zachowaniem przycisku **„Drukuj”** jako alternatywy.
- Dodano wskaźnik **„Ostatnia modyfikacja”** (data i godzina) obok tytułu karty w widoku edycji dokumentów.
- Dodano funkcję blokady i archiwizacji pojedynczych kart dokumentów (**„Zablokuj (archiwum)” / „Odblokuj”**) w panelu bocznym oraz nagłówku formularza — chroniącą zatwierdzone lub archiwalne dokumenty przed przypadkową edycją, czyszczeniem, usunięciem, nadpisaniem z Profilu oraz wstawianiem wniosków i szablonów (przy duplikowaniu lub przenoszeniu na nowy rok kopie pozostają odblokowane).
- Rozbudowano zestaw testów automatycznych Vitest (40 testów) o weryfikację eksportu/importu archiwów `.zip`, generowania PDF, zgody startowej, przypomnień o kopiach oraz blokowania kart dokumentów.

---

## [1.7.1] — 25.11.2026

**Utwardzenie zapisu IndexedDB, walidacji kopii i pełny tryb offline**

Wprowadzono ochronę przed konfliktami zapisu między kartami, atomowy import danych, bezpieczną migrację starszego archiwum, lokalne fonty offline oraz zestaw testów automatycznych.

- Dodano transakcyjną kontrolę rewizji danych w IndexedDB oraz kolejkę serializującą zapisy, chroniącą przed nadpisaniem nowszych zmian z innej karty przeglądarki.
- Rozszerzono wskaźnik i komunikaty statusu zapisu (zapisywanie, zapisano, konflikt wersji z możliwością wczytania nowszych danych z bazy, błąd zapisu oraz tryb awaryjny w pamięci RAM z ponowną próbą zapisu i eksportem JSON).
- Uszczelniono walidację oraz atomowość importu pełnych kopii JSON, paczek nadzoru oraz paczek wniosków i szablonów (odrzucanie duplikatów identyfikatorów i nieprawidłowych struktur przed jakąkolwiek zmianą w bazie).
- Zabezpieczono migrację ze starszego zapisu `localStorage` oraz wydłużono bezpieczne zwalnianie adresów Blob przy pobieraniu plików JSON.
- Dołączono lokalnie używane kroje pisma (`Plus Jakarta Sans`, `Source Serif 4`, `JetBrains Mono`), eliminując zewnętrzne żądania do Google Fonts i zapewniając 100% niezależności offline PWA.
- Zaostrzono konfigurację TypeScript (`strict` oraz `noUncheckedIndexedAccess`) i dodano testy automatyczne Vitest + `fake-indexeddb`.

---

## [1.7] — 25.11.2026

**Nadzór dyrektora i zaawansowane wyszukiwanie wniosków**

- Dodano eksport podpisanej profilem nauczyciela paczki sprawozdań do nadzoru (z wyborem roku, semestru i kart).
- Dodano panel **„Nadzór dyrektora”** z wielokrotnym importem paczek nauczycieli, wykrywaniem poprawek oraz interaktywnym porównaniem zmian przed aktualizacją.
- Wprowadzono automatyczne budowanie i aktualizowanie jednego sprawozdania zbiorczego dla każdej klasy z gotowym wydrukiem A4.
- Rozbudowano wyszukiwanie w bazie wniosków oraz w oknie wstawiania wniosków o przeszukiwanie treści i tytułów, obsługę wielu słów, dokładnych fraz, ignorowanie polskich znaków oraz podświetlanie dopasowań.

---

## [1.6] — 25.11.2026

**Poziomy klas i numery zatwierdzenia podręczników w Profilu**

- Dodano pole „Poziom / klasy” (np. `1-4`, `5-8`, `4`, `5A`) oraz „Numer podręcznika / zatwierdzenia” przy stałych przypisaniach w Profilu, wraz z szybkim powielaniem wpisu dla kolejnych klas.
- Rozbudowano Kartę efektów nauczania oraz wydruk A4 o dedykowane pole i komórkę tabeli dla numeru podręcznika.
- Wprowadzono automatyczne dopasowywanie programu, tytułu oraz numeru podręcznika na podstawie zarówno wybranego przedmiotu, jak i klasy.

---

## [1.5] — 25.11.2026

**Nowe formularze NKL / NDST oraz Historia zmian**

- Dodano formularz i wydruk A4: „Uzasadnienie nieklasyfikowania ucznia z przedmiotu” (wariant za I półrocze oraz roczny).
- Dodano formularz i wydruk A4: „Uzasadnienie oceny niedostatecznej z przedmiotu” (za I półrocze / rocznej) z pełną listą obserwacji ucznia, podjętych działań nauczyciela, współpracy z rodzicami oraz planu pracy na kolejny okres.
- Dodano obsługę nowych załączników w archiwum lat szkolnych, przenoszeniu na nowy rok, szablonach własnych oraz kopii JSON.
- Dodano sekcję Historia zmian (Changelog) w zakładce „O programie”.

---

## [1.4] — 24.11.2026

**Sortowanie kart i bezpośredni wydruk kompletu z panelu bocznego**

- Dodano menu sortowania w panelu bocznym według daty utworzenia (Najnowsze / Najstarsze) oraz tytułu (A–Z).
- Dodano pola wyboru przy kartach w panelu bocznym oraz przycisk jednego kliknięcia do natychmiastowego wydruku lub eksportu przefiltrowanych albo zaznaczonych dokumentów z wybranego roku szkolnego.

---

## [1.3] — 24.11.2026

**Szablony własne fragmentów i wymiana baz JSON**

- Wprowadzono „Szablony własne” z opcją zapisania zaznaczonego fragmentu lub całej treści pola oraz szybkiego wstawiania do formularzy.
- Rozbudowano zakładkę „Wnioski i szablony” o pełne zarządzanie i edycję szablonów.
- Dodano niezależny eksport i import samych własnych wniosków oraz szablonów jako lekki plik JSON (z opcją scalania bez duplikatów lub zastąpienia).

---

## [1.2] — 24.11.2026

**Rozwijane podpowiedzi z Profilu oraz dokumentacja WLDE**

- Dodano rozwijane podpowiedzi z Profilu nauczyciela i archiwum (szkoła, przedmiot, klasa, program, podręcznik, rok, data) w polach kreatora.
- Dodano zakładkę „O programie, regulamin i licencja” z Regulaminem i Polityką Prywatności (RODO) oraz Wolną Licencją Domowo-Edukacyjną (WLDE).

---

## [1.1] — 24.11.2026

**Baza IndexedDB, archiwum lat szkolnych i stałe programy**

- Zmieniono silnik zapisu z `localStorage` na lokalną bazę `IndexedDB` z przyrostowym zapisem zmian i automatyczną migracją danych.
- Dodano filtrowanie i grupowanie archiwum dokumentów według lat szkolnych w panelu bocznym.
- Dodano stałe przypisanie numeru programu i tytułu podręcznika do przedmiotów w Profilu oraz kreator przenoszenia wybranych kart na nowy rok szkolny.

---

## [1.0] — 24.11.2026

**Pierwsze wydanie E-Sprawozdań (Offline-First PWA)**

- Udostępniono 4 główne formularze: Karta efektów nauczania, Zbiorcze sprawozdanie koordynatora (z automatycznym zliczaniem kart klasowych), Karta informacyjna nauczyciela oraz Podsumowania specjalistów.
- Dodano wbudowaną bazę wniosków do dalszej pracy, podgląd wydruku A4 na żywo, izolowane drukowanie PDF, eksport/import pełnej sesji JSON oraz wsparcie instalacji PWA offline.

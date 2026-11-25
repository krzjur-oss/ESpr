export const APP_VERSION = '1.5';
export const APP_RELEASE_DATE = 'listopad 2026';

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: string[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: '1.5',
    date: '25.11.2026',
    title: 'Nowe formularze NKL / NDST oraz Historia zmian',
    summary:
      'Dodano oficjalne załączniki klasyfikacyjne dla nieklasyfikowania i oceny niedostatecznej oraz zakładkę Changelog.',
    changes: [
      'Dodano formularz i wydruk A4: „Uzasadnienie nieklasyfikowania ucznia z przedmiotu” (wariant za I półrocze oraz roczny).',
      'Dodano formularz i wydruk A4: „Uzasadnienie oceny niedostatecznej z przedmiotu” (za I półrocze / rocznej) z pełną listą obserwacji ucznia, podjętych działań nauczyciela, współpracy z rodzicami oraz planu pracy na kolejny okres.',
      'Dodano obsługę nowych załączników w archiwum lat szkolnych, przenoszeniu na nowy rok, szablonach własnych oraz kopii JSON.',
      'Dodano sekcję Historia zmian (Changelog) w zakładce „O programie”, w której najnowsze wydanie jest rozwinięte domyślnie, a starsze wersje pozostają zwinięte.',
    ],
  },
  {
    version: '1.4',
    date: '24.11.2026',
    title: 'Sortowanie kart i bezpośredni wydruk kompletu z panelu bocznego',
    summary:
      'Usprawniono nawigację po archiwum oraz uruchamianie drukowania zbiorczego jednym kliknięciem.',
    changes: [
      'Dodano menu sortowania w panelu bocznym według daty utworzenia (Najnowsze / Najstarsze) oraz tytułu (A–Z).',
      'Dodano pola wyboru przy kartach w panelu bocznym oraz przycisk jednego kliknięcia do natychmiastowego wydruku lub eksportu PDF przefiltrowanych albo zaznaczonych dokumentów z wybranego roku szkolnego.',
    ],
  },
  {
    version: '1.3',
    date: '24.11.2026',
    title: 'Szablony własne fragmentów i wymiana baz JSON',
    summary:
      'Możliwość zapisywania dowolnych fragmentów tekstu jako szablony oraz dzielenia się wpisami między nauczycielami.',
    changes: [
      'Wprowadzono „Szablony własne” z opcją zapisania zaznaczonego fragmentu lub całej treści pola oraz szybkiego wstawiania do formularzy.',
      'Rozbudowano zakładkę „Wnioski i szablony” o pełne zarządzanie i edycję szablonów.',
      'Dodano niezależny eksport i import samych własnych wniosków oraz szablonów jako lekki plik JSON (z opcją scalania bez duplikatów lub zastąpienia).',
    ],
  },
  {
    version: '1.2',
    date: '24.11.2026',
    title: 'Rozwijane podpowiedzi z Profilu oraz dokumentacja WLDE',
    summary:
      'Szybsze wypełnianie formularzy danymi z Profilu oraz wbudowane informacje o licencji i prywatności.',
    changes: [
      'Dodano rozwijane podpowiedzi z Profilu nauczyciela i archiwum (szkoła, przedmiot, klasa, program, podręcznik, rok, data) w polach kreatora.',
      'Dodano zakładkę „O programie, regulamin i licencja” z Regulaminem i Polityką Prywatności (RODO) oraz Wolną Licencją Domowo-Edukacyjną (WLDE).',
    ],
  },
  {
    version: '1.1',
    date: '24.11.2026',
    title: 'Baza IndexedDB, archiwum lat szkolnych i stałe programy',
    summary:
      'Bezpieczne przechowywanie dużych archiwów oraz przygotowanie pracy na kolejne lata szkolne.',
    changes: [
      'Zmieniono silnik zapisu z localStorage na lokalną bazę IndexedDB z przyrostowym zapisem zmian i automatyczną migracją danych.',
      'Dodano filtrowanie i grupowanie archiwum dokumentów według lat szkolnych w panelu bocznym.',
      'Dodano stałe przypisanie numeru programu i tytułu podręcznika do przedmiotów w Profilu oraz kreator przenoszenia wybranych kart na nowy rok szkolny.',
    ],
  },
  {
    version: '1.0',
    date: '24.11.2026',
    title: 'Pierwsze wydanie E-Sprawozdań (Offline-First PWA)',
    summary:
      'Podstawowa wersja aplikacji do tworzenia, podglądu A4 i drukowania sprawozdań szkolnych.',
    changes: [
      'Udostępniono 4 główne formularze: Karta efektów nauczania, Zbiorcze sprawozdanie koordynatora (z automatycznym zliczaniem kart klasowych), Karta informacyjna nauczyciela oraz Podsumowania specjalistów.',
      'Dodano wbudowaną bazę wniosków do dalszej pracy, podgląd wydruku A4 na żywo, izolowane drukowanie PDF, eksport/import pełnej sesji JSON oraz wsparcie instalacji PWA offline.',
    ],
  },
];

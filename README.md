# E-Sprawozdania — Kreator Sprawozdań Szkolnych (Local-First PWA)

**Aktualna wersja:** `1.8.2` (listopad 2026) · [Historia zmian (`CHANGELOG.md`)](./CHANGELOG.md)

Aplikacja webowa w modelu Local-First PWA (działająca offline w przeglądarce po wczytaniu zasobów przez Service Worker) dla nauczycieli, wychowawców, specjalistów i dyrektorów szkół do tworzenia, archiwizowania, podglądu A4, bezpośredniego eksportu PDF oraz drukowania sprawozdań semestralnych i rocznych.

> **Status prawny dokumentów:** E‑Sprawozdania jest narzędziem pomocniczym do przygotowywania roboczych kart, zestawień i sprawozdań. Nie zastępuje dzienników, arkuszy ocen ani innej dokumentacji, której prowadzenie, treść, forma, podpisy i przechowywanie wynikają z przepisów prawa lub procedur placówki. Przed wykorzystaniem dokumentu należy zweryfikować jego zgodność z wymaganiami dyrektora i szkoły.

## Najważniejsze funkcje (v1.8.2)

- **6 typów roboczych dokumentów szkolnych:** Karta efektów nauczania, Zbiorcze sprawozdanie koordynatora, Karta informacyjna nauczyciela, Podsumowanie efektów pracy specjalisty (6 ról), Uzasadnienie nieklasyfikowania (NKL) oraz Uzasadnienie oceny niedostatecznej (NDST).
- **Bezpośredni eksport PDF z paskiem postępu:** Generowanie i pobieranie pojedynczych kart, zaznaczonych kompletów oraz raportów zbiorczych klas jako pliki `.pdf` (`jsPDF` + `html2canvas-pro`) z adaptacyjnym skalowaniem wysokich kart i zachowaniem systemowego drukowania tekstowego A4.
- **Kopia zapasowa JSON oraz archiwum `.zip` (limit importu 25 MiB):** Eksport pełnej kopii lub kopii zawężonej do wybranego roku szkolnego z podglądem szacowanego rozmiaru oraz bezpieczne przywracanie ze strumieniową ochroną dekompresji.
- **Archiwum lat szkolnych i blokada kart:** Filtrowanie i sortowanie dokumentów, przenoszenie kart na nowy rok szkolny, wskaźnik ostatniej modyfikacji oraz blokada zatwierdzonych lub archiwalnych dokumentów (`Zablokuj (archiwum)`).
- **Nadzór dyrektora:** Eksport podpisanych paczek sprawozdań, porównywanie zmian wersji oraz automatyczne sprawozdania zbiorcze dla każdej klasy.
- **Architektura Local-First i przejrzystość RODO:** Treści formularzy i dokumentów zapisywane są lokalnie w `IndexedDB` z kontrolą rewizji (bez wysyłania treści dokumentów na serwer i bez automatycznego szyfrowania plików kopii), z lokalnymi fontami oraz obowiązkową zgodą startową (Regulamin RODO, Licencja WLDE, nota o kopiach zapasowych).

## Publikacja na GitHub Pages

Repozytorium jest gotowe do automatycznej publikacji na **GitHub Pages** dzięki plikowi `.github/workflows/deploy.yml` oraz automatycznemu wykrywaniu ścieżki bazowej (`base`) w `vite.config.ts`.

### Kroki wdrożenia:
1. Utwórz nowe repozytorium na GitHubie i wypchnij pliki projektu na gałąź `main` (lub `master`).
2. W repozytorium na GitHubie przejdź do **Settings → Pages**.
3. W sekcji **Build and deployment → Source** wybierz **GitHub Actions**.
4. Po zakończeniu pracy workflow **Publikacja na GitHub Pages** aplikacja będzie dostępna pod adresem:
   `https://<twoja-nazwa-uzytkownika>.github.io/<nazwa-repozytorium>/`

> **Własna domena (Custom Domain):** Jeśli podepniesz własną domenę w ustawieniach GitHub Pages, ustaw zmienną środowiskową `VITE_BASE_PATH=/` w konfiguracji budowania lub w workflow.

## Uruchomienie lokalne i weryfikacja

```bash
npm install
npm run dev
```

Sprawdzenie typów TypeScript, testy automatyczne oraz budowanie wersji produkcyjnej:

```bash
npm run lint
npm test
npm run build
```

## Licencja, regulamin i historia zmian

Program jest udostępniany **bezpłatnie dla nauczycieli, specjalistów szkolnych, placówek oświatowych oraz do użytku domowego** na warunkach dokumentu **Ograniczona licencja bezpłatnego użytku edukacyjnego i prywatnego (WLDE)** (historycznie WLDE — nie jest to licencja wolnego oprogramowania ani open source; komponenty zewnętrzne podlegają własnym licencjom).

- Historia zmian (Changelog): [`CHANGELOG.md`](./CHANGELOG.md)
- Szczegóły licencji: [`LICENSE.md`](./LICENSE.md)
- Noty licencyjne komponentów zewnętrznych: [`public/THIRD_PARTY_NOTICES.txt`](./public/THIRD_PARTY_NOTICES.txt)
- Regulamin i Polityka Prywatności (RODO / IndexedDB): [`REGULAMIN.md`](./REGULAMIN.md)

**Autor:** mgr Krzysztof Jureczek (`kjureczek@proton.me` · `github.com/krzjur-oss`)

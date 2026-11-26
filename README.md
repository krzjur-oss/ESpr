# E-Sprawozdania — Kreator Sprawozdań Szkolnych (Local-First PWA)

**Aktualna wersja:** `1.8.0` (listopad 2026) · [Historia zmian (`CHANGELOG.md`)](./CHANGELOG.md)

Aplikacja webowa działająca w 100% offline w przeglądarce (Local-First PWA) dla nauczycieli, wychowawców, specjalistów i dyrektorów szkół do tworzenia, archiwizowania, podglądu A4, bezpośredniego eksportu PDF oraz drukowania sprawozdań semestralnych i rocznych.

## Najważniejsze funkcje (v1.8.0)

- **6 typów dokumentów szkolnych:** Karta efektów nauczania, Zbiorcze sprawozdanie koordynatora, Karta informacyjna nauczyciela, Podsumowanie efektów pracy specjalisty (6 ról), Uzasadnienie nieklasyfikowania (NKL) oraz Uzasadnienie oceny niedostatecznej (NDST).
- **Bezpośredni eksport PDF z paskiem postępu:** Generowanie i pobieranie pojedynczych kart, zaznaczonych kompletów oraz raportów zbiorczych klas jako pliki `.pdf` (`jsPDF` + `html2canvas-pro`) z zachowaniem systemowego drukowania A4.
- **Kopia zapasowa JSON oraz archiwum `.zip`:** Eksport i przywracanie pełnej kopii sesji w pliku `.json` lub jednym spakowanym archiwum `.zip` (zawierającym profil, wszystkie dokumenty w osobnych plikach oraz bazy wniosków, szablonów i paczek nadzoru).
- **Archiwum lat szkolnych i blokada kart:** Filtrowanie i sortowanie dokumentów, przenoszenie kart na nowy rok szkolny, wskaźnik ostatniej modyfikacji oraz blokada zatwierdzonych lub archiwalnych dokumentów (`Zablokuj (archiwum)`).
- **Nadzór dyrektora:** Eksport podpisanych paczek sprawozdań, porównywanie zmian wersji oraz automatyczne sprawozdania zbiorcze dla każdej klasy.
- **100% Offline & Local-First:** Lokalne przechowywanie danych w `IndexedDB` z kontrolą rewizji, lokalne fonty offline oraz wbudowany system zgody startowej (Regulamin RODO, Licencja WLDE, nota o kopiach zapasowych).

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

Program jest udostępniany **bezpłatnie dla nauczycieli, specjalistów szkolnych, placówek oświatowych oraz do użytku domowego** na warunkach **Wolnej Licencji Domowo-Edukacyjnej (WLDE)**.

- Historia zmian (Changelog): [`CHANGELOG.md`](./CHANGELOG.md)
- Szczegóły licencji: [`LICENSE.md`](./LICENSE.md)
- Regulamin i Polityka Prywatności (RODO / IndexedDB): [`REGULAMIN.md`](./REGULAMIN.md)

**Autor:** mgr Krzysztof Jureczek (`kjureczek@proton.me` · `github.com/krzjur-oss`)

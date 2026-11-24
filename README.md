# E-Sprawozdania — Kreator Sprawozdań Szkolnych (Local-First PWA)

Aplikacja webowa działająca w 100% offline w przeglądarce (Local-First PWA) dla nauczycieli i specjalistów szkoły do przygotowywania, podglądu i drukowania sprawozdań semestralnych i rocznych.

## Publikacja na GitHub Pages

Repozytorium jest gotowe do automatycznej publikacji na **GitHub Pages** dzięki plikowi `.github/workflows/deploy.yml` oraz automatycznemu wykrywaniu ścieżki bazowej (`base`) w `vite.config.ts`.

### Kroki wdrożenia:
1. Utwórz nowe repozytorium na GitHubie i wypchnij pliki projektu na gałąź `main` (lub `master`).
2. W repozytorium na GitHubie przejdź do **Settings → Pages**.
3. W sekcji **Build and deployment → Source** wybierz **GitHub Actions**.
4. Po zakończeniu pracy workflow **Publikacja na GitHub Pages** aplikacja będzie dostępna pod adresem:
   `https://<twoja-nazwa-uzytkownika>.github.io/<nazwa-repozytorium>/`

> **Własna domena (Custom Domain):** Jeśli podepniesz własną domenę w ustawieniach GitHub Pages, ustaw zmienną środowiskową `VITE_BASE_PATH=/` w konfiguracji budowania lub w workflow.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Budowanie wersji produkcyjnej:

```bash
npm run build
```

## Licencja i regulamin

Program jest udostępniany **bezpłatnie dla nauczycieli, specjalistów szkolnych, placówek oświatowych oraz do użytku domowego** na warunkach **Wolnej Licencji Domowo-Edukacyjnej (WLDE)**.

- Szczegóły licencji: [`LICENSE.md`](./LICENSE.md)
- Regulamin i Polityka Prywatności (RODO / IndexedDB): [`REGULAMIN.md`](./REGULAMIN.md)

**Autor:** mgr Krzysztof Jureczek (`kjureczek@proton.me` · `github.com/krzjur-oss`)


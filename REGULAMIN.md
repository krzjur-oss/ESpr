# Regulamin i Polityka Prywatności aplikacji „E-Sprawozdania — Kreator Sprawozdań Szkolnych”

**Wersja 1.0 · obowiązuje od 24.11.2026 r.**

---

## § 1. Postanowienia ogólne

1. Niniejszy Regulamin określa zasady korzystania z aplikacji **„E-Sprawozdania — Kreator Sprawozdań Szkolnych”** (dalej: „Aplikacja”), udostępnianej bezpłatnie w przeglądarce internetowej oraz w trybie offline (PWA) pod adresem publikacji Autora (`github.com/krzjur-oss` / GitHub Pages).
2. Właścicielem, twórcą i jedynym autorem Aplikacji jest **mgr Krzysztof Jureczek** (dalej: „Autor”).
3. Aplikacja dystrybuowana jest na warunkach **Wolnej Licencji Domowo-Edukacyjnej (Zastrzeżonej) — WLDE** — pełna treść znajduje się w pliku `LICENSE.md` oraz w zakładce **O programie**. Regulamin i Licencja stanowią całość i obowiązują łącznie.
4. Korzystanie z Aplikacji oznacza pełną akceptację niniejszego Regulaminu oraz Licencji.

---

## § 2. Przeznaczenie Aplikacji

Aplikacja jest narzędziem typu **Local-First PWA** przeznaczonym wyłącznie do:
1. **Bezpłatnego użytku nauczycieli i specjalistów szkolnych** — tworzenie, archiwizowanie według lat szkolnych, podgląd oraz drukowanie sprawozdań semestralnych i rocznych (w tym kart efektów nauczania, sprawozdań zbiorczych koordynatorów, kart informacyjnych nauczyciela oraz podsumowań pedagoga, psychologa, logopedy, biblioteki, świetlicy i nauczycieli współorganizujących) w ramach pracy dydaktycznej i wychowawczej, zarówno w szkole, jak i w domu.
2. **Użytku edukacyjnego i instytucjonalnego** — nieodpłatne wykorzystanie w placówkach oświatowych (przedszkola, szkoły podstawowe i ponadpodstawowe, uczelnie, świetlice, poradnie, placówki opiekuńczo-wychowawcze i terapeutyczne).
3. **Użytku domowego / prywatnego** — korzystanie przez osoby fizyczne w celach własnych i samokształceniowych.

Wszelkie inne zastosowania, w tym komercyjne, wymagają uprzedniej pisemnej zgody Autora.

---

## § 3. Zasady korzystania

1. Aplikacja jest całkowicie bezpłatna dla wszystkich nauczycieli, specjalistów, szkół i użytkowników wskazanych w § 2.
2. Aplikacja nie zawiera reklam, mikropłatności, ukrytych opłat ani płatnych subskrypcji.
3. Użytkownik zobowiązuje się korzystać z Aplikacji zgodnie z jej przeznaczeniem oraz obowiązującym prawem.
4. Zabronione jest podejmowanie działań mogących zakłócić działanie Aplikacji lub narazić innych użytkowników na szkodę.

---

## § 4. Prawa autorskie i licencja

Wszelkie prawa do Aplikacji — kod źródłowy, interfejs graficzny, projekt wizualny, treści i dokumentacja — należą wyłącznie do Autora i są chronione prawem autorskim. Użytkownik zachowuje pełnię praw do własnych dokumentów, sprawozdań i wpisanych wniosków utworzonych przy użyciu Aplikacji.

| | |
|---|---|
| ❌ **Zabronione** | Kopiowanie, modyfikowanie, dekompilowanie, rozpowszechnianie, sprzedaż lub komercjalizacja Aplikacji bądź jej części bez pisemnej zgody Autora |
| ✅ **Dozwolone** | Bezpłatne korzystanie z Aplikacji przez nauczycieli, szkoły i osoby prywatne zgodnie z jej przeznaczeniem (§ 2) oraz udostępnianie linku do Aplikacji innym osobom |

Szczegółowe warunki licencyjne określa plik `LICENSE.md`. W sprawach zgody na inne wykorzystanie prosimy o kontakt z Autorem.

---

## § 5. Dane i prywatność (RODO/GDPR)

1. Aplikacja **nie wymaga rejestracji ani logowania**, nie posiada backendu i nie zbiera ani nie wysyła żadnych danych osobowych na zewnętrzne serwery.
2. Wszystkie dane wprowadzane do Aplikacji (m.in. dane profilu nauczyciela/specjalisty, klasy, przedmioty, przypisane numery programów i podręczniki, treść sprawozdań, karty informacyjne, podsumowania pracy specjalistów, archiwum lat szkolnych oraz własne wnioski do pracy) przechowywane są **wyłącznie lokalnie w bazie przeglądarki użytkownika (`IndexedDB`)** i nigdy nie opuszczają jego urządzenia. W przypadku starszych sesji zapisanych wcześniej w `localStorage` dane są jednorazowo przenoszone do `IndexedDB`, a stary wpis jest usuwany.
3. Administratorem danych wprowadzanych do programu (w tym ewentualnych danych osobowych zawartych w treści sprawozdań) jest wyłącznie Użytkownik końcowy lub placówka oświatowa — Autor nie ma jakiegokolwiek technicznego dostępu do tych danych.
4. Aplikacja nie używa plików cookie, narzędzi analitycznych ani reklamowych systemów śledzenia. Mechanizm PWA (Service Worker) zapisuje w pamięci podręcznej przeglądarki wyłącznie statyczne pliki samej aplikacji, umożliwiając jej działanie bez dostępu do internetu (100% offline).
5. Użytkownik może w każdej chwili wyeksportować swoje dane do pliku JSON, wczytać kopię zapasową lub trwale usunąć wszystkie dane z bazy `IndexedDB` za pomocą funkcji **„Wyczyść wszystkie dane”** w zakładce **Kopia JSON** albo czyszcząc dane witryny w przeglądarce.
6. Wyeksportowane pliki kopii JSON oraz paczki sprawozdań dla dyrektora nie są szyfrowane i mogą zawierać dane osobowe (w tym imiona i nazwiska uczniów oraz dane nauczyciela). Użytkownik zobowiązany jest przekazywać je wyłącznie bezpiecznym kanałem komunikacji oraz usuwać po zakończeniu użycia.

---

## § 6. Odpowiedzialność

1. Aplikacja udostępniana jest w stanie „takim, jakim jest” (*as is*), bez jakichkolwiek gwarancji.
2. Autor nie ponosi odpowiedzialności za utratę danych (np. wskutek wyczyszczenia danych przeglądarki lub awarii urządzenia), błędy działania, awarie sprzętu lub szkody wynikające z korzystania bądź niemożności korzystania z Aplikacji.
3. Zaleca się regularne tworzenie kopii zapasowych danych za pomocą wbudowanej funkcji eksportu do pliku **JSON** w zakładce **Kopia JSON** (szczególnie po zakończeniu semestru lub przed aktualizacją systemu).

---

## § 7. Zmiany Regulaminu

Autor zastrzega sobie prawo do zmiany Regulaminu oraz aktualizacji Aplikacji bez uprzedzenia. Dalsze korzystanie z Aplikacji po opublikowaniu zmian oznacza ich akceptację.

---

## § 8. Postanowienia końcowe

W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o prawie autorskim i prawach pokrewnych.

Kontakt: kjureczek@proton.me · github.com/krzjur-oss

---

*© 2026 Krzysztof Jureczek · Wszelkie prawa zastrzeżone*

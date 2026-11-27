# Regulamin i Polityka Prywatności aplikacji „E-Sprawozdania — Kreator Sprawozdań Szkolnych”

**Wersja dokumentów prawnych: 1.8.1 (dla aplikacji v1.8.2) · Data wejścia w życie: do uzupełnienia przez wydawcę**

> **Status prawny generowanych dokumentów:**  
> E-Sprawozdania jest narzędziem pomocniczym do przygotowywania roboczych kart, zestawień i sprawozdań. Nie zastępuje dzienników, arkuszy ocen ani innej dokumentacji, której prowadzenie, treść, forma, podpisy i przechowywanie wynikają z przepisów prawa lub procedur placówki. Przed wykorzystaniem dokumentu należy zweryfikować jego zgodność z wymaganiami dyrektora i szkoły.

---

## § 1. Postanowienia ogólne

1. Niniejszy Regulamin określa zasady korzystania z aplikacji **„E-Sprawozdania — Kreator Sprawozdań Szkolnych”** (dalej: „Aplikacja”), udostępnianej bezpłatnie w przeglądarce internetowej oraz w trybie offline (PWA).
2. Autorem i wydawcą Aplikacji jest **mgr Krzysztof Jureczek** (dalej: „Autor”).
3. Aplikacja udostępniana jest na warunkach dokumentu **Ograniczona licencja bezpłatnego użytku edukacyjnego i prywatnego (WLDE)** (historycznie określanego skrótem WLDE — nie jest to licencja wolnego oprogramowania ani licencja open source). Pełna treść znajduje się w pliku `LICENSE.md` oraz w zakładce **O programie**. Regulamin i Licencja uzupełniają się wzajemnie.
4. Korzystanie z Aplikacji wymaga zapoznania się z Regulaminem, Licencją oraz informacją o kopiach zapasowych i ich akceptacji w wymaganym zakresie.

---

## § 2. Przeznaczenie i status pomocniczy Aplikacji

Aplikacja jest narzędziem pomocniczym typu **Local-First PWA** przeznaczonym do:
1. **Bezpłatnego użytku nauczycieli i specjalistów szkolnych** — przygotowywania roboczych kart, zestawień i sprawozdań semestralnych oraz rocznych, kart informacyjnych oraz podsumowań pracy w ramach obowiązków zawodowych (zarówno w szkole, jak i w domu).
2. **Użytku edukacyjnego i instytucjonalnego** — nieodpłatnego wykorzystania w placówkach oświatowych (przedszkola, szkoły podstawowe i ponadpodstawowe, szkoły specjalne, uczelnie, świetlice, poradnie, placówki opiekuńczo-wychowawcze i terapeutyczne).
3. **Użytku domowego / prywatnego** — korzystania przez osoby fizyczne w celach własnych i samokształceniowych.

**Zastrzeżenie dotyczące dokumentacji szkolnej:** E-Sprawozdania jest narzędziem pomocniczym do przygotowywania roboczych kart, zestawień i sprawozdań. Nie zastępuje dzienników, arkuszy ocen ani innej dokumentacji, której prowadzenie, treść, forma, podpisy i przechowywanie wynikają z przepisów prawa lub procedur placówki. Przed wykorzystaniem dokumentu należy zweryfikować jego zgodność z wymaganiami dyrektora i szkoły.

Zastosowania komercyjne i odpłatna redystrybucja wymagają uprzedniej pisemnej zgody Autora.

---

## § 3. Zasady korzystania

1. Aplikacja jest bezpłatna dla nauczycieli, specjalistów, placówek oświatowych i użytkowników wskazanych w § 2.
2. Aplikacja nie zawiera reklam, mikropłatności, ukrytych opłat ani płatnych subskrypcji.
3. Użytkownik zobowiązuje się korzystać z Aplikacji zgodnie z jej przeznaczeniem, procedurami swojej placówki oraz obowiązującym prawem.
4. Zabronione jest podejmowanie działań zakłócających działanie Aplikacji lub infrastruktury hostingu.

---

## § 4. Prawa autorskie, licencja i składniki zewnętrzne

1. Autorskie treści, projekt interfejsu, kod własny i dokumentacja Aplikacji podlegają ochronie prawa autorskiego. Elementy zewnętrzne (biblioteki open source, fonty, ikony) zachowują własne licencje wskazane w dokumentacji projektu.
2. Użytkownik (lub właściwa placówka) zachowuje pełnię praw do własnych dokumentów, sprawozdań i wpisów utworzonych przy użyciu Aplikacji.
3. Żadne postanowienie Regulaminu ani Licencji nie wyłącza i nie ogranicza bezwzględnie obowiązujących uprawnień użytkownika wynikających z przepisów prawa, w tym z **art. 75 ust. 2 i 3 oraz art. 76 ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych** (sporządzenie kopii zapasowej w warunkach ustawowych, obserwowanie, badanie i testowanie funkcjonowania programu w celu poznania jego idei i zasad oraz dekompilacja w granicach ustawowych dla osiągnięcia współdziałania).

| | |
|---|---|
| ❌ **Ograniczenia licencyjne** | Sprzedaż, komercjalizacja, redystrybucja lub modyfikacja wykraczająca poza dozwolony użytek i wyjątki ustawowe (art. 75 ust. 2–3 oraz art. 76 pr. aut.) wymagają zgody Autora lub respektowania licencji komponentów zewnętrznych |
| ✅ **Dozwolony użytek i prawa ustawowe** | Bezpłatne korzystanie przez nauczycieli, szkoły i osoby prywatne zgodnie z § 2, udostępnianie linku do Aplikacji oraz wykonywanie uprawnień ustawowych użytkownika (w tym kopii zapasowej i testowania zgodnie z ustawą) |

Szczegółowe warunki licencyjne określa plik `LICENSE.md`.

---

## § 5. Dane, prywatność i RODO

### 5.1. Zakres i sposób przetwarzania danych
- Aplikacja **nie wymaga rejestracji ani logowania**, nie używa plików cookie śledzących ani systemów analitycznych czy reklamowych.
- Treść formularzy, dokumentów, profilu nauczyciela oraz baz użytkownika jest przechowywana lokalnie w bazie przeglądarki **`IndexedDB`** (a w przypadku jednorazowej migracji starszych wersji przenoszona z `localStorage` do `IndexedDB`).
- Przegląd kodu Aplikacji nie wykazuje wysyłania treści dokumentów ani wpisów użytkownika do backendu aplikacji.
- Aplikacja jest publikowana jako statyczna aplikacja webowa (domyślnie przygotowana do publikacji na GitHub Pages lub wskazanym hostingu statycznym). Podczas pobierania strony dostawca hostingu może przetwarzać dane techniczne połączenia (np. żądania HTTP/HTTPS, metadane sieciowe) zgodnie ze swoją dokumentacją i konfiguracją.
- Mechanizm PWA (Service Worker) pobiera i buforuje lokalnie wyłącznie statyczne zasoby samej Aplikacji (skrypty, style, fonty, ikony, dokument HTML) w celu umożliwienia pracy offline.
- Aplikacja **nie szyfruje automatycznie** danych w bazie `IndexedDB` ani eksportowanych plików JSON, ZIP i paczek nadzoru.

### 5.2. Role na gruncie RODO
- Role podmiotów w rozumieniu RODO wynikają z rzeczywistego celu i sposobu przetwarzania danych w danej sytuacji.
- Przy służbowym wykorzystywaniu Aplikacji do danych uczniów administratorem danych jest zazwyczaj właściwa szkoła lub placówka oświatowa, a nauczyciel bądź specjalista działa w ramach upoważnienia i instrukcji administratora.
- Autor Aplikacji nie staje się automatycznie administratorem ani podmiotem przetwarzającym (procesorem) treści wprowadzanych lokalnie przez użytkownika wyłącznie z samego faktu stworzenia i udostępnienia programu.
- Rola dostawcy hostingu w odniesieniu do danych technicznych połączenia wymaga oceny na podstawie warunków świadczenia usług tego dostawcy i rzeczywistych przepływów sieciowych w danym wdrożeniu.

### 5.3. Minimalizacja danych i dane szczególnych kategorii
> **Ostrzeżenie:** Pola opisowe formularzy (w szczególności w kartach specjalistów, uzasadnieniach NKL/NDST oraz wnioskach) mogą zawierać dane o stanie zdrowia, niepełnosprawności, potrzebach edukacyjnych lub inne dane szczególnych kategorii (art. 9 RODO).
- Wpisuj wyłącznie dane niezbędne do przygotowania danego dokumentu; unikaj zbędnych danych identyfikujących ucznia (tam gdzie to możliwe stosuj inicjały lub oznaczenia zgodne z procedurą szkoły).
- Korzystaj z Aplikacji wyłącznie zgodnie z upoważnieniem do przetwarzania danych i wewnętrznymi procedurami placówki.
- Właściwą podstawę prawną przetwarzania z art. 6 oraz — jeżeli dotyczy — art. 9 RODO musi ustalić administrator danych (placówka) w kontekście konkretnego zadania i przepisów oświatowych; nie należy przyjmować zgody rodzica lub ucznia jako domyślnej podstawy przetwarzania.

### 5.4. Kopie zapasowe i bezpieczeństwo
- Baza `IndexedDB` oraz eksportowane pliki JSON, archiwa ZIP i paczki nadzoru **nie są szyfrowane** przez Aplikację i mogą zawierać dane osobowe uczniów oraz nauczycieli.
- Korzystaj z Aplikacji wyłącznie na kontach systemowych chronionych hasłem, z włączoną blokadą ekranu, bezpiecznym nośnikiem i ograniczonym dostępem osób nieuprawnionych.
- Nie przesyłaj plików kopii zapasowych ani paczek nadzoru zwykłym, niezabezpieczonym kanałem komunikacji; po zakończeniu pracy na urządzeniu współdzielonym usuń pobrane pliki i wyczyść dane witryny.
- Usunięcie danych witryny w przeglądarce lub funkcja **„Wyczyść wszystkie dane”** czyści bazę `IndexedDB`, lecz **nie usuwa** plików kopii (`.json`, `.zip`) zapisanych wcześniej na dysku lub nośniku zewnętrznym.

---

## § 6. Odpowiedzialność i gwarancje

1. Aplikacja udostępniana jest nieodpłatnie w stanie „takim, jakim jest” (*as is*), bez zapewnienia nieprzerwanego, bezbłędnego działania oraz bez gwarancji przydatności do konkretnego celu prawnego lub organizacyjnego bez weryfikacji ze strony użytkownika.
2. Z uwagi na lokalny charakter zapisu w przeglądarce użytkownik powinien regularnie tworzyć własne kopie zapasowe (**JSON** lub **ZIP**) w zakładce **Kopia JSON** przed aktualizacją przeglądarki, czyszczeniem danych witryny lub zmianą urządzenia.
3. Żadne postanowienie niniejszego Regulaminu nie wyłącza ani nie ogranicza odpowiedzialności Autora za szkodę wyrządzoną umyślnie ani w jakimkolwiek innym zakresie, w którym wyłączenie lub ograniczenie odpowiedzialności jest niedopuszczalne na mocy bezwzględnie obowiązujących przepisów prawa, ani nie pozbawia użytkownika przysługujących mu z mocy prawa uprawnień lub roszczeń.
4. To, czy i w jakim zakresie do konkretnego modelu nieodpłatnego udostępnienia Aplikacji znajdują zastosowanie przepisy o prawach konsumenta lub o świadczeniu usług drogą elektroniczną, zależy od statusu podmiotu udostępniającego oraz rzeczywistych okoliczności wdrożenia.

---

## § 7. Zmiany Regulaminu i archiwum wersji

1. Każda wersja Regulaminu oznaczana jest numerem wersji oraz datą wejścia w życie (lub publikacji), a poprzednie wersje są archiwizowane w historii projektu i dokumentacji zmian.
2. O istotnych zmianach Regulaminu lub Licencji użytkownik jest informowany bezpośrednio w Aplikacji. Jeżeli zmiana istotnie zmienia warunki korzystania z Aplikacji, Aplikacja wymaga ponownego potwierdzenia warunków przed dalszą pracą (bez usuwania ani ukrywania istniejących danych lokalnych).
3. Nie przyjmuje się, że samo dalsze otwarcie lub korzystanie z Aplikacji automatycznie sanuje każdą zmianę warunków w każdej relacji prawnej.

**Archiwum wersji dokumentów prawnych:**
- **Wersja 1.0** — 24.11.2026 r. (pierwotne wydanie Regulaminu i WLDE)
- **Wersja 1.8.0** — 26.11.2026 r. (dostosowanie do eksportu ZIP, PDF, blokady kart i zgody startowej)
- **Wersja 1.8.1** — data wejścia w życie do uzupełnienia przez wydawcę (doprecyzowanie RODO, statusu pomocniczego, limitów importu oraz wyjątków ustawowych pr. aut.; obowiązuje także dla aplikacji `1.8.2`)

---

## § 8. Postanowienia końcowe

W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego, ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych oraz rozporządzenia RODO.

Kontakt: kjureczek@proton.me · github.com/krzjur-oss

---

*© 2026 Krzysztof Jureczek · Wszelkie prawa zastrzeżone (z zastrzeżeniem licencji komponentów zewnętrznych i uprawnień ustawowych)*

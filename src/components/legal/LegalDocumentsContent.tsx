import React from 'react';
import { AlertCircle, Check, HardDriveDownload, X } from 'lucide-react';
import { APP_VERSION } from '../../data/changelog';
import { LEGAL_DOCUMENTS_VERSION } from '../../utils/storage';

export const TERMS_EFFECTIVE_DATE =
  'Data wejścia w życie: do uzupełnienia przez wydawcę';

export const LICENSE_FULL_TITLE =
  'Ograniczona licencja bezpłatnego użytku edukacyjnego i prywatnego (WLDE)';

export const AUXILIARY_TOOL_NOTICE_TEXT =
  'E-Sprawozdania jest narzędziem pomocniczym do przygotowywania roboczych kart, zestawień i sprawozdań. Nie zastępuje dzienników, arkuszy ocen ani innej dokumentacji, której prowadzenie, treść, forma, podpisy i przechowywanie wynikają z przepisów prawa lub procedur placówki. Przed wykorzystaniem dokumentu należy zweryfikować jego zgodność z wymaganiami dyrektora i szkoły.';

export const AuxiliaryToolNoticeCallout: React.FC<{
  compact?: boolean;
}> = ({ compact = false }) => {
  return (
    <div
      className={`rounded-lg border border-slate-300 bg-slate-50 text-slate-800 ${
        compact ? 'p-3.5 text-xs' : 'p-4 text-xs sm:text-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-900">
            Status prawny generowanych dokumentów
          </h3>
          <p className="leading-relaxed text-slate-700">{AUXILIARY_TOOL_NOTICE_TEXT}</p>
        </div>
      </div>
    </div>
  );
};

export const BackupRecommendationCallout: React.FC<{
  compact?: boolean;
}> = ({ compact = false }) => {
  return (
    <div
      className={`rounded-lg border border-amber-300 bg-amber-50/90 text-amber-950 ${
        compact ? 'p-3.5 text-xs' : 'p-4 text-xs sm:text-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <HardDriveDownload className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-semibold text-amber-950">
            Zalecenie dotyczące wykonywania kopii zapasowej (JSON / ZIP) i bezpieczeństwa danych
          </h3>
          <p className="leading-relaxed text-amber-900">
            Program działa w modelu <strong>Local-First</strong> — treść formularzy, dokumentów, profilu i baz użytkownika jest zapisywana lokalnie w bazie przeglądarki (IndexedDB) na tym urządzeniu; przegląd kodu aplikacji nie wykazuje wysyłania treści dokumentów do backendu aplikacji. Service Worker buforuje wyłącznie statyczne zasoby aplikacji do pracy offline.
          </p>
          <p className="leading-relaxed text-amber-900">
            Wyczyszczenie danych witryny, praca w trybie prywatnym lub awaria urządzenia mogą spowodować <strong>nieodwracalną utratę danych z IndexedDB</strong> (nie usuwa to jednak plików kopii zapisanych wcześniej poza przeglądarką). Regularnie pobieraj kopię zapasową w zakładce <strong>Kopia JSON</strong> (<code className="font-mono-tabular text-[11px]">.json</code> lub <code className="font-mono-tabular text-[11px]">.zip</code>). Lokalna baza IndexedDB oraz eksporty nie są automatycznie szyfrowane — chroń urządzenie hasłem i blokadą ekranu oraz nie przesyłaj kopii niezabezpieczonym kanałem.
          </p>
        </div>
      </div>
    </div>
  );
};

export const RegulaminContent: React.FC = () => {
  return (
    <article className="space-y-6 text-sm text-slate-700 leading-relaxed">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900">
          Regulamin i Polityka Prywatności aplikacji „E-Sprawozdania — Kreator Sprawozdań Szkolnych”
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-mono-tabular">
          Wersja dokumentów prawnych {LEGAL_DOCUMENTS_VERSION} (dla aplikacji v{APP_VERSION}) · {TERMS_EFFECTIVE_DATE}
        </p>
      </div>

      <AuxiliaryToolNoticeCallout compact />

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 1. Postanowienia ogólne</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            Niniejszy Regulamin określa zasady korzystania z aplikacji <strong>„E-Sprawozdania — Kreator Sprawozdań Szkolnych”</strong> (dalej: „Aplikacja”), udostępnianej bezpłatnie w przeglądarce internetowej oraz w trybie offline (PWA).
          </li>
          <li>
            Autorem i wydawcą Aplikacji jest <strong>mgr Krzysztof Jureczek</strong> (dalej: „Autor”).
          </li>
          <li>
            Aplikacja udostępniana jest na warunkach dokumentu <strong>{LICENSE_FULL_TITLE}</strong> (historycznie określanego skrótem WLDE — nie jest to licencja wolnego oprogramowania ani licencja open source). Regulamin i Licencja uzupełniają się wzajemnie.
          </li>
          <li>
            Korzystanie z Aplikacji wymaga zapoznania się z Regulaminem, Licencją oraz informacją o kopiach zapasowych i ich akceptacji w wymaganym zakresie.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 2. Przeznaczenie i status pomocniczy Aplikacji</h3>
        <p>Aplikacja jest narzędziem pomocniczym typu Local-First PWA przeznaczonym do:</p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            <strong>Bezpłatnego użytku nauczycieli i specjalistów szkolnych</strong> — przygotowywania roboczych kart, zestawień i sprawozdań semestralnych oraz rocznych, kart informacyjnych oraz podsumowań pracy w ramach obowiązków zawodowych (zarówno w szkole, jak i w domu).
          </li>
          <li>
            <strong>Użytku edukacyjnego i instytucjonalnego</strong> — nieodpłatnego wykorzystania w placówkach oświatowych (przedszola, szkoły podstawowe i ponadpodstawowe, szkoły specjalne, uczelnie, świetlice, poradnie, placówki opiekuńczo-wychowawcze i terapeutyczne).
          </li>
          <li>
            <strong>Użytku domowego / prywatnego</strong> — korzystania przez osoby fizyczne w celach własnych i samokształceniowych.
          </li>
        </ol>
        <p>
          <strong>Zastrzeżenie dotyczące dokumentacji szkolnej:</strong> {AUXILIARY_TOOL_NOTICE_TEXT}
        </p>
        <p>
          Zastosowania komercyjne i odpłatna redystrybucja wymagają uprzedniej pisemnej zgody Autora.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 3. Zasady korzystania</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Aplikacja jest bezpłatna dla nauczycieli, specjalistów, placówek oświatowych i użytkowników wskazanych w § 2.</li>
          <li>Aplikacja nie zawiera reklam, mikropłatności, ukrytych opłat ani płatnych subskrypcji.</li>
          <li>Użytkownik zobowiązuje się korzystać z Aplikacji zgodnie z jej przeznaczeniem, procedurami swojej placówki oraz obowiązującym prawem.</li>
          <li>Zabronione jest podejmowanie działań zakłócających działanie Aplikacji lub infrastruktury hostingu.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">§ 4. Prawa autorskie, licencja i składniki zewnętrzne</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            Autorskie treści, projekt interfejsu, kod własny i dokumentacja Aplikacji podlegają ochronie prawa autorskiego. Elementy zewnętrzne (biblioteki open source, fonty, ikony) zachowują własne licencje wskazane w dokumentacji projektu.
          </li>
          <li>
            Użytkownik (lub właściwa placówka) zachowuje pełnię praw do własnych dokumentów, sprawozdań i wpisów utworzonych w Aplikacji.
          </li>
          <li>
            Żadne postanowienie Regulaminu ani Licencji nie wyłącza i nie ogranicza bezwzględnie obowiązujących uprawnień użytkownika wynikających z przepisów prawa, w tym z <strong>art. 75 ust. 2 i 3 oraz art. 76 ustawy o prawie autorskim i prawach pokrewnych</strong> (sporządzenie kopii zapasowej w warunkach ustawowych, obserwowanie, badanie i testowanie funkcjonowania programu w celu poznania jego idei i zasad oraz dekompilacja w granicach ustawowych dla osiągnięcia współdziałania).
          </li>
        </ol>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-red-200 bg-red-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-900">
              <X className="w-4 h-4 shrink-0" />
              <span>Ograniczenia licencyjne</span>
            </div>
            <p className="mt-1.5 text-xs text-red-900/90 leading-relaxed">
              Sprzedaż, komercjalizacja, redystrybucja lub modyfikacja wykraczająca poza dozwolony użytek i wyjątki ustawowe (art. 75 ust. 2–3 oraz art. 76 pr. aut.) wymagają zgody Autora lub respektowania licencji komponentów zewnętrznych.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-900">
              <Check className="w-4 h-4 shrink-0" />
              <span>Dozwolony użytek i prawa ustawowe</span>
            </div>
            <p className="mt-1.5 text-xs text-emerald-900/90 leading-relaxed">
              Bezpłatne korzystanie przez nauczycieli, szkoły i osoby prywatne zgodnie z § 2, udostępnianie linku do Aplikacji oraz wykonywanie uprawnień ustawowych użytkownika (w tym kopii zapasowej i testowania zgodnie z ustawą).
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">§ 5. Dane, prywatność i RODO</h3>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">5.1. Zakres i sposób przetwarzania danych</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Aplikacja nie wymaga rejestracji ani logowania, nie używa plików cookie śledzących ani systemów analitycznych czy reklamowych.</li>
            <li>Treść formularzy, dokumentów, profilu nauczyciela oraz baz użytkownika jest przechowywana lokalnie w bazie przeglądarki <strong>IndexedDB</strong> (a przy jednorazowej migracji starszych wersji przenoszona z <code>localStorage</code> do <code>IndexedDB</code>).</li>
            <li>Przegląd kodu Aplikacji nie wykazuje wysyłania treści dokumentów ani wpisów użytkownika do backendu aplikacji.</li>
            <li>Aplikacja jest publikowana jako statyczna aplikacja webowa (domyślnie przygotowana do publikacji na GitHub Pages lub wskazanym hostingu statycznym). Podczas pobierania strony dostawca hostingu może przetwarzać dane techniczne połączenia (np. żądania HTTP/HTTPS, metadane sieciowe) zgodnie ze swoją dokumentacją i konfiguracją.</li>
            <li>Mechanizm PWA (Service Worker) pobiera i buforuje lokalnie wyłącznie statyczne zasoby samej Aplikacji (skrypty, style, fonty, ikony, dokument HTML) w celu umożliwienia pracy offline.</li>
            <li>Aplikacja <strong>nie szyfruje automatycznie</strong> danych w bazie IndexedDB ani eksportowanych plików JSON, ZIP i paczek nadzoru.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">5.2. Role na gruncie RODO</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Role podmiotów w rozumieniu RODO wynikają z rzeczywistego celu i sposobu przetwarzania danych w danej sytuacji.</li>
            <li>Przy służbowym wykorzystywaniu Aplikacji do danych uczniów administratorem danych jest zazwyczaj właściwa szkoła lub placówka oświatowa, a nauczyciel bądź specjalista działa w ramach upoważnienia i instrukcji administratora.</li>
            <li>Autor Aplikacji nie staje się automatycznie administratorem ani podmiotem przetwarzającym (procesorem) treści wprowadzanych lokalnie przez użytkownika wyłącznie z samego faktu stworzenia i udostępnienia programu.</li>
            <li>Rola dostawcy hostingu w odniesieniu do danych technicznych połączenia wymaga oceny na podstawie warunków świadczenia usług tego dostawcy i rzeczywistych przepływów sieciowych w danym wdrożeniu.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">5.3. Minimalizacja danych i dane szczególnych kategorii</h4>
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950 space-y-1.5 leading-relaxed">
            <p>
              <strong>Ostrzeżenie:</strong> Pola opisowe formularzy (w szczególności w kartach specjalistów, uzasadnieniach NKL/NDST oraz wnioskach) mogą zawierać dane o stanie zdrowia, niepełnosprawności, potrzebach edukacyjnych lub inne dane szczególnych kategorii (art. 9 RODO).
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Wpisuj wyłącznie dane niezbędne do przygotowania danego dokumentu; unikaj zbędnych danych identyfikujących ucznia (tam gdzie to możliwe stosuj inicjały lub oznaczenia zgodne z procedurą szkoły).</li>
              <li>Korzystaj z Aplikacji wyłącznie zgodnie z upoważnieniem do przetwarzania danych i wewnętrznymi procedurami placówki.</li>
              <li>Właściwą podstawę prawną przetwarzania z art. 6 oraz — jeżeli dotyczy — art. 9 RODO musi ustalić administrator danych (placówka) w kontekście konkretnego zadania i przepisów oświatowych; nie należy przyjmować zgody rodzica lub ucznia jako domyślnej podstawy przetwarzania.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">5.4. Kopie zapasowe i bezpieczeństwo</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Baza IndexedDB oraz eksportowane pliki JSON, archiwa ZIP i paczki nadzoru nie są szyfrowane przez Aplikację i mogą zawierać dane osobowe uczniów i nauczycieli.</li>
            <li>Korzystaj z Aplikacji wyłącznie na kontach systemowych chronionych hasłem, z włączoną blokadą ekranu, bezpiecznym nośnikiem i ograniczonym dostępem osób nieuprawnionych.</li>
            <li>Nie przesyłaj plików kopii zapasowych ani paczek nadzoru zwykłym, niezabezpieczonym kanałem komunikacji; po zakończeniu pracy na urządzeniu współdzielonym usuń pobrane pliki i wyczyść dane witryny.</li>
            <li>Usunięcie danych witryny w przeglądarce lub funkcja „Wyczyść wszystkie dane” czyści bazę IndexedDB, lecz <strong>nie usuwa</strong> plików kopii (`.json`, `.zip`) zapisanych wcześniej na dysku lub nośniku zewnętrznym.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 6. Odpowiedzialność i gwarancje</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            Aplikacja udostępniana jest nieodpłatnie w stanie „takim, jakim jest” (<em>as is</em>), bez zapewnienia nieprzerwanego, bezbłędnego działania oraz bez gwarancji przydatności do konkretnego celu prawnego lub organizacyjnego bez weryfikacji ze strony użytkownika.
          </li>
          <li>
            Z uwagi na lokalny charakter zapisu w przeglądarce użytkownik powinien regularnie tworzyć własne kopie zapasowe (JSON lub ZIP) przed aktualizacją przeglądarki, czyszczeniem danych witryny lub zmianą urządzenia.
          </li>
          <li>
            Żadne postanowienie niniejszego Regulaminu nie wyłącza ani nie ogranicza odpowiedzialności Autora za szkodę wyrządzoną umyślnie ani w jakimkolwiek innym zakresie, w którym wyłączenie lub ograniczenie odpowiedzialności jest niedopuszczalne na mocy bezwzględnie obowiązujących przepisów prawa, ani nie pozbawia użytkownika przysługujących mu z mocy prawa uprawnień lub roszczeń.
          </li>
          <li>
            To, czy i w jakim zakresie do konkretnego modelu nieodpłatnego udostępnienia Aplikacji znajdują zastosowanie przepisy o prawach konsumenta lub o świadczeniu usług drogą elektroniczną, zależy od statusu podmiotu udostępniającego oraz rzeczywistych okoliczności wdrożenia.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 7. Zmiany Regulaminu i historia wersji</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            Każda wersja Regulaminu oznaczana jest numerem wersji oraz datą wejścia w życie (lub publikacji), a poprzednie wersje są archiwizowane w historii projektu i dokumentacji zmian.
          </li>
          <li>
            O istotnych zmianach Regulaminu lub Licencji użytkownik jest informowany bezpośrednio w Aplikacji. Jeżeli zmiana istotnie zmienia warunki korzystania z Aplikacji, Aplikacja wymaga ponownego potwierdzenia warunków przed dalszą pracą (bez usuwania ani ukrywania istniejących danych lokalnych).
          </li>
          <li>
            Nie przyjmuje się, że samo dalsze otwarcie lub korzystanie z Aplikacji automatycznie sanuje każdą zmianę warunków w każdej relacji prawnej.
          </li>
        </ol>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Archiwum wersji dokumentów prawnych:</p>
          <p>· Wersja 1.0 — 24.11.2026 r. (pierwotne wydanie Regulaminu i WLDE)</p>
          <p>· Wersja 1.8.0 — 26.11.2026 r. (dostosowanie do eksportu ZIP, PDF, blokady kart i zgody startowej)</p>
          <p>· Wersja {LEGAL_DOCUMENTS_VERSION} — data wejścia w życie do uzupełnienia przez wydawcę (doprecyzowanie RODO, statusu pomocniczego, limitów importu oraz wyjątków ustawowych pr. aut.; obowiązuje także dla aplikacji v{APP_VERSION})</p>
        </div>
      </section>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h3 className="text-base font-semibold text-slate-900">§ 8. Postanowienia końcowe</h3>
        <p>
          W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego, ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych oraz rozporządzenia RODO.
        </p>
        <p className="text-xs text-slate-500">
          Kontakt:{' '}
          <a href="mailto:kjureczek@proton.me" className="text-blue-900 hover:underline">
            kjureczek@proton.me
          </a>{' '}
          ·{' '}
          <a
            href="https://github.com/krzjur-oss"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-900 hover:underline"
          >
            github.com/krzjur-oss
          </a>
        </p>
        <p className="text-xs text-slate-500">
          © 2026 Krzysztof Jureczek · Wszelkie prawa zastrzeżone (z zastrzeżeniem licencji komponentów zewnętrznych i uprawnień ustawowych)
        </p>
      </section>
    </article>
  );
};

export const WldeLicenseContent: React.FC = () => {
  return (
    <article className="space-y-6 text-sm text-slate-700 leading-relaxed">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900">
          LICENCJA UŻYTKOWANIA OPROGRAMOWANIA
        </h2>
        <p className="mt-0.5 text-sm font-semibold text-blue-900">
          {LICENSE_FULL_TITLE}
        </p>
        <p className="mt-1 text-xs text-slate-600 italic">
          Uwaga: skrót „WLDE” ma charakter wyłącznie historyczny. Niniejsza licencja nie jest licencją wolnego oprogramowania ani licencją open source.
        </p>
        <p className="mt-2 text-xs text-slate-600">
          <strong>Projekt:</strong> E-Sprawozdania — Kreator Sprawozdań Szkolnych (wersja aplikacji{' '}
          <span className="font-mono-tabular">{APP_VERSION}</span>) · <strong>Wersja dokumentów prawnych:</strong>{' '}
          <span className="font-mono-tabular">{LEGAL_DOCUMENTS_VERSION}</span> · {TERMS_EFFECTIVE_DATE}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          <strong>Autor autorskiej warstwy programu:</strong> mgr Krzysztof Jureczek · Copyright © 2026 Krzysztof Jureczek.
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">Preambuła</h3>
        <p>
          Niniejsza licencja określa warunki nieodpłatnego korzystania z aplikacji <strong>„E-Sprawozdania — Kreator Sprawozdań Szkolnych”</strong> przez nauczycieli, wychowawców, specjalistów szkolnych, placówki oświatowe oraz użytkowników prywatnych do celów edukacyjnych i własnych, przy poszanowaniu praw autorskich do autorskiego kodu i interfejsu, odrębnych licencji bibliotek zewnętrznych oraz bezwzględnie obowiązujących ustawowych uprawnień użytkownika.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 1. Definicje</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            <strong>Oprogramowanie</strong> – aplikacja „E-Sprawozdania — Kreator Sprawozdań Szkolnych” (PWA) wraz z jej autorskim kodem, szablonami wydruku, wbudowaną bazą przykładowych wniosków i dokumentacją, z wyłączeniem składników zewnętrznych objętych odrębnymi licencjami.
          </li>
          <li>
            <strong>Autor / Licencjodawca</strong> – mgr Krzysztof Jureczek, w zakresie oryginalnych elementów autorskich stworzonych na potrzeby projektu.
          </li>
          <li>
            <strong>Użytkownik / Licencjobiorca</strong> – każdy nauczyciel, wychowawca, pedagog, psycholog, logopeda, bibliotekarz, koordynator lub inny specjalista oświaty, każda szkoła, przedszkole, uczelnia lub inna placówka oświatowo-wychowawcza korzystająca z Oprogramowania w celach dydaktyczno-organizacyjnych, a także każda osoba fizyczna korzystająca z Oprogramowania w celach domowych/prywatnych.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 2. Dozwolony użytek (bezpłatny)</h3>
        <p>
          Autor udziela Użytkownikowi bezpłatnej, niewyłącznej, nieprzenoszalnej i ograniczonej licencji na korzystanie z Oprogramowania w następującym zakresie:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            <strong>Bezpłatny użytek przez nauczycieli i specjalistów szkoły</strong> – nieodpłatne przygotowywanie, archiwizowanie, podgląd i drukowanie roboczych sprawozdań, kart zbiorczych, kart informacyjnych oraz podsumowań pracy zarówno na sprzęcie służbowym w szkole, jak i na urządzeniach prywatnych w domu.
          </li>
          <li>
            <strong>Użytek edukacyjny i instytucjonalny</strong> – nieodpłatne wykorzystanie Oprogramowania w placówkach oświatowych (przedszkola, szkoły podstawowe i ponadpodstawowe, szkoły specjalne, uczelnie, świetlice, poradnie psychologiczno-pedagogiczne, placówki opiekuńczo-wychowawcze i terapeutyczne).
          </li>
          <li>
            <strong>Użytek domowy / prywatny</strong> – uruchamianie Oprogramowania przez osoby fizyczne na własny, niekomercyjny użytek, w tym cele samokształceniowe.
          </li>
          <li>
            <strong>Instalacja lokalna (PWA i offline)</strong> – instalowanie i przechowywanie Oprogramowania w trybie offline (PWA) na urządzeniach Użytkownika lub placówki oraz eksport/import własnych plików kopii zapasowych (JSON, ZIP) i plików PDF.
          </li>
          <li>
            <strong>Prezentacje niekomercyjne i rekomendacje</strong> – publiczne demonstrowanie działania Oprogramowania podczas rad pedagogicznych oraz szkoleń nauczycielskich pod warunkiem wskazania autorstwa i niepobierania opłat za samo Oprogramowanie.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 3. Ograniczenia licencyjne i ustawowe prawa użytkownika</h3>
        <p>
          Działania wykraczające poza § 2 oraz poza bezwzględnie obowiązujące wyjątki ustawowe wymagają uprzedniej pisemnej zgody Autora. Z zastrzeżeniem ust. 2 poniżej nie zezwala się na:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            <strong>Komercjalizację i sprzedaż</strong> – sprzedaży, pobierania opłat (bezpośrednich lub pośrednich) za dostęp, instalację lub używanie Oprogramowania, umieszczania go w płatnych pakietach, za bramkami płatniczymi ani wykorzystywania do odpłatnych usług komercyjnych.
          </li>
          <li>
            <strong>Nieuprawnione rozpowszechnianie i modyfikacje</strong> – redystrybuowania, publikowania zmodyfikowanych wersji („forków”), sublicencjonowania lub wynajmu Oprogramowania osobom trzecim bez zgody Autora (poza zakresem dozwolonym odrębnymi licencjami składników zewnętrznych).
          </li>
          <li>
            <strong>Kopiowanie i dekompilację poza granicami ustawy</strong> – zwielokrotniania, tłumaczenia, dekompilacji lub inżynierii wstecznej kodu Oprogramowania wykraczającej poza ustawowe uprawnienia Użytkownika.
          </li>
          <li>
            <strong>Usuwanie oznaczeń autorskich i licencyjnych</strong> – usuwania lub ukrywania informacji o autorstwie, prawach do składników zewnętrznych oraz treści niniejszej licencji.
          </li>
        </ol>
        <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-slate-800 space-y-1.5">
          <p className="font-semibold text-blue-950">
            Bezwzględnie obowiązujące uprawnienia ustawowe (art. 75 ust. 2 i 3 oraz art. 76 ustawy o prawie autorskim i prawach pokrewnych):
          </p>
          <p className="leading-relaxed">
            Żadne postanowienie niniejszej licencji nie zakazuje ani nie ogranicza praw Użytkownika wynikających z art. 75 ust. 2 i 3 oraz art. 76 ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych, w tym w szczególności prawa do: (a) sporządzenia kopii zapasowej, jeżeli jest to niezbędne do korzystania z programu komputerowego w warunkach przewidzianych ustawą, (b) obserwowania, badania i testowania funkcjonowania programu komputerowego w celu poznania jego idei i zasad przez osobę posiadającą prawo korzystania z egzemplarza programu podczas ładowania, wyświetlania, stosowania, przekazywania lub przechowywania, oraz (c) zwielokrotniania kodu lub tłumaczenia jego formy w zakresie ściśle niezbędnym do uzyskania informacji koniecznych do osiągnięcia współdziałania z innymi programami w warunkach określonych w art. 75 ust. 3 ustawy. Postanowienia umowne sprzeczne z art. 75 ust. 2 i 3 są z mocy art. 76 ustawy nieważne.
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 4. Własność intelektualna i składniki zewnętrzne</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            Prawa do autorskiego kodu, interfejsu i dokumentacji stworzonych przez Autora przysługują Autorowi (z zastrzeżeniem weryfikacji ewentualnych praw wynikających ze stosunku pracy lub źródeł pochodzenia poszczególnych fragmentów).
          </li>
          <li>
            Oprogramowanie wykorzystuje komponenty zewnętrzne podmiotów trzecich (m.in. React, Vite, Tailwind CSS, fflate, jsPDF, html2canvas-pro, lucide-react, pakiety fontów @fontsource/*). Prawa do tych elementów są regulowane ich własnymi licencjami (m.in. MIT, Apache-2.0, SIL OFL, ISC), a niniejsza licencja nie ogranicza uprawnień wynikających z tych licencji. Pełne noty i teksty licencji komponentów zewnętrznych udostępniono w pliku{' '}
            <a
              href="./THIRD_PARTY_NOTICES.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-900 underline"
            >
              THIRD_PARTY_NOTICES.txt
            </a>
            .
          </li>
          <li>
            Wyłącznym dysponentem dokumentów, sprawozdań, wniosków i kopii JSON/ZIP utworzonych przez Użytkownika pozostaje Użytkownik lub właściwa placówka oświatowa zgodnie ze stosunkiem pracy i procedurami placówki.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 5. Odpowiedzialność i zastrzeżenia (AS IS)</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            Oprogramowanie udostępniane jest nieodpłatnie w stanie „takim, jakim jest” (<em>as is</em>), bez gwarancji nieprzerwanego lub bezbłędnego działania; użytkownik powinien regularnie wykonywać kopie zapasowe swoich danych.
          </li>
          <li>
            Niniejsza licencja nie wyłącza odpowiedzialności Autora za szkodę wyrządzoną umyślnie ani w jakimkolwiek innym zakresie, w którym wyłączenie lub ograniczenie odpowiedzialności jest zakazane przez bezwzględnie obowiązujące przepisy prawa, oraz nie pozbawia Użytkownika ustawowych praw i roszczeń.
          </li>
          <li>
            Ewentualne zastosowanie przepisów o prawach konsumenta zależy od statusu podmiotu udostępniającego oraz okoliczności konkretnego udostępnienia.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 6. Wygaśnięcie licencji</h3>
        <p>
          Istotne naruszenie warunków korzystania wykraczające poza dozwolony użytek i wyjątki ustawowe (§ 3) może skutkować wygaśnięciem uprawnień udzielonych niniejszą licencją do dalszego korzystania z autorskich elementów Oprogramowania (nie narusza to praw Użytkownika do utworzonych przez niego dokumentów i kopii danych ani praw wynikających z odrębnych licencji komponentów zewnętrznych).
        </p>
      </section>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h3 className="text-base font-semibold text-slate-900">§ 7. Postanowienia końcowe</h3>
        <p>
          W sprawach nieuregulowanych niniejszą licencją zastosowanie mają przepisy ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych oraz Kodeksu cywilnego.
        </p>
        <p className="text-xs italic text-slate-500">
          Wersja dokumentów prawnych: {LEGAL_DOCUMENTS_VERSION} · Data ostatniej aktualizacji treści licencji: do uzupełnienia przez wydawcę.
        </p>
      </section>
    </article>
  );
};

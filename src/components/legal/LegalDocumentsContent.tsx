import React from 'react';
import { Check, HardDriveDownload, X } from 'lucide-react';
import { APP_VERSION } from '../../data/changelog';

export const TERMS_EFFECTIVE_DATE = '24.11.2026 r.';

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
            Zalecenie dotyczące wykonywania kopii zapasowej (JSON)
          </h3>
          <p className="leading-relaxed text-amber-900">
            Program działa w trybie <strong>Local-First</strong> — wszystkie dokumenty, profil nauczyciela oraz własne wnioski są zapisywane wyłącznie lokalnie w bazie przeglądarki (IndexedDB) na tym urządzeniu i nie są wysyłane na zewnętrzny serwer.
          </p>
          <p className="leading-relaxed text-amber-900">
            Wyczyszczenie historii lub danych witryny, praca w trybie prywatnym, awaria sprzętu bądź zmiana komputera mogą spowodować <strong>nieodwracalną utratę danych</strong>. Aby temu zapobiec, regularnie pobieraj kopię zapasową w zakładce <strong>Kopia JSON</strong> i przechowuj plik <code className="font-mono-tabular text-[11px]">.json</code> lub archiwum <code className="font-mono-tabular text-[11px]">.zip</code> na bezpiecznym nośniku.
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
          Wersja {APP_VERSION} · obowiązuje od {TERMS_EFFECTIVE_DATE}
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 1. Postanowienia ogólne</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            Niniejszy Regulamin określa zasady korzystania z aplikacji <strong>„E-Sprawozdania — Kreator Sprawozdań Szkolnych”</strong> (dalej: „Aplikacja”), udostępnianej bezpłatnie w przeglądarce internetowej oraz w trybie offline (PWA).
          </li>
          <li>
            Właścicielem, twórcą i jedynym autorem Aplikacji jest <strong>mgr Krzysztof Jureczek</strong> (dalej: „Autor”).
          </li>
          <li>
            Aplikacja dystrybuowana jest na warunkach <strong>Wolnej Licencji Domowo-Edukacyjnej (Zastrzeżonej) — WLDE</strong>. Regulamin i Licencja stanowią całość i obowiązują łącznie.
          </li>
          <li>
            Korzystanie z Aplikacji oznacza pełną akceptację niniejszego Regulaminu oraz Licencji.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 2. Przeznaczenie Aplikacji</h3>
        <p>Aplikacja jest narzędziem typu Local-First PWA przeznaczonym wyłącznie do:</p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            <strong>Bezpłatnego użytku nauczycieli i specjalistów szkolnych</strong> — tworzenie, archiwizowanie według lat szkolnych, podgląd oraz drukowanie sprawozdań semestralnych i rocznych, kart zbiorczych, kart informacyjnych oraz podsumowań pracy w ramach obowiązków dydaktycznych, wychowawczych i opiekuńczych (zarówno w szkole, jak i w domu).
          </li>
          <li>
            <strong>Użytku edukacyjnego i instytucjonalnego</strong> — nieodpłatne wykorzystanie w placówkach oświatowych (przedszkola, szkoły podstawowe i ponadpodstawowe, szkoły specjalne, uczelnie, świetlice, poradnie, placówki opiekuńczo-wychowawcze i terapeutyczne).
          </li>
          <li>
            <strong>Użytku domowego / prywatnego</strong> — korzystanie przez osoby fizyczne w celach własnych i samokształceniowych.
          </li>
        </ol>
        <p>
          Wszelkie inne zastosowania, w tym komercyjne, wymagają uprzedniej pisemnej zgody Autora.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 3. Zasady korzystania</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Aplikacja jest całkowicie bezpłatna dla wszystkich nauczycieli, specjalistów, szkół i użytkowników wskazanych w § 2.</li>
          <li>Aplikacja nie zawiera reklam, mikropłatności, ukrytych opłat ani płatnych subskrypcji.</li>
          <li>Użytkownik zobowiązuje się korzystać z Aplikacji zgodnie z jej przeznaczeniem oraz obowiązującym prawem.</li>
          <li>Zabronione jest podejmowanie działań mogących zakłócić działanie Aplikacji lub narazić innych użytkowników na szkodę.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">§ 4. Prawa autorskie i licencja</h3>
        <p>
          Wszelkie prawa do Aplikacji — kod źródłowy, interfejs graficzny, projekt wizualny, treści i dokumentacja — należą wyłącznie do Autora i są chronione prawem autorskim. Użytkownik zachowuje pełnię praw do własnych dokumentów i wpisanych sprawozdań utworzonych w Aplikacji.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-red-200 bg-red-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-900">
              <X className="w-4 h-4 shrink-0" />
              <span>Zabronione</span>
            </div>
            <p className="mt-1.5 text-xs text-red-900/90 leading-relaxed">
              Kopiowanie, modyfikowanie, dekompilowanie, rozpowszechnianie, sprzedaż lub komercjalizacja Aplikacji bądź jej części bez pisemnej zgody Autora.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-900">
              <Check className="w-4 h-4 shrink-0" />
              <span>Dozwolone</span>
            </div>
            <p className="mt-1.5 text-xs text-emerald-900/90 leading-relaxed">
              Bezpłatne korzystanie z Aplikacji przez nauczycieli, szkoły i osoby prywatne zgodnie z § 2 oraz udostępnianie linku do Aplikacji innym osobom.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 5. Dane i prywatność (RODO/GDPR)</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            Aplikacja <strong>nie wymaga rejestracji ani logowania</strong>, nie posiada backendu i nie zbiera ani nie wysyła żadnych danych osobowych na zewnętrzne serwery.
          </li>
          <li>
            Wszystkie dane wprowadzane do Aplikacji (m.in. dane profilu nauczyciela lub specjalisty, klasy, przedmioty, przypisane numery programów i podręczniki, treść sprawozdań, karty informacyjne, podsumowania pracy, archiwum lat szkolnych oraz własne wnioski) przechowywane są <strong>wyłącznie lokalnie w bazie przeglądarki użytkownika (IndexedDB)</strong> i nigdy nie opuszczają jego urządzenia.
          </li>
          <li>
            Administratorem danych wprowadzanych do programu (w tym ewentualnych danych osobowych zawartych w treści sprawozdań) jest wyłącznie Użytkownik końcowy lub placówka oświatowa — Autor nie ma technicznego dostępu do tych danych.
          </li>
          <li>
            Aplikacja nie używa plików cookie, narzędzi analitycznych ani reklamowych systemów śledzenia. Mechanizm PWA (Service Worker) zapisuje w pamięci podręcznej wyłącznie statyczne pliki aplikacji do pracy offline.
          </li>
          <li>
            Użytkownik może w każdej chwili wyeksportować swoje dane do pliku JSON lub archiwum ZIP, wczytać kopię zapasową lub trwale usunąć wszystkie dane z bazy IndexedDB w zakładce <strong>Kopia JSON</strong> albo czyszcząc dane witryny w przeglądarce.
          </li>
          <li>
            Wyeksportowane pliki kopii JSON, archiwa ZIP oraz paczki sprawozdań dla dyrektora nie są szyfrowane i mogą zawierać dane osobowe (w tym imiona i nazwiska uczniów oraz dane nauczyciela). Użytkownik zobowiązany jest przekazywać je wyłącznie bezpiecznym kanałem komunikacji oraz usuwać po zakończeniu użycia.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 6. Odpowiedzialność i kopie zapasowe</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Aplikacja udostępniana jest w stanie „takim, jakim jest” (<em>as is</em>), bez jakichkolwiek gwarancji.</li>
          <li>Autor nie ponosi odpowiedzialności za utratę danych, błędy działania, awarie sprzętu lub szkody wynikające z korzystania bądź niemożności użytkowania Aplikacji.</li>
          <li>
            <strong>Zaleca się regularne tworzenie kopii zapasowych danych</strong> za pomocą eksportu do pliku <strong>JSON</strong> lub archiwum <strong>.zip</strong> w zakładce <strong>Kopia JSON</strong> (np. po zakończeniu pracy nad serią sprawozdań lub przed czyszczeniem danych przeglądarki), aby uniknąć utraty wprowadzonych dokumentów.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 7. Zmiany Regulaminu</h3>
        <p>
          Autor zastrzega sobie prawo do zmiany Regulaminu oraz aktualizacji Aplikacji bez uprzedzenia. Dalsze korzystanie z Aplikacji po opublikowaniu zmian oznacza ich akceptację.
        </p>
      </section>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h3 className="text-base font-semibold text-slate-900">§ 8. Postanowienia końcowe</h3>
        <p>
          W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o prawie autorskim i prawach pokrewnych.
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
          © 2026 Krzysztof Jureczek · Wszelkie prawa zastrzeżone
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
          Wolna Licencja Domowo-Edukacyjna (Zastrzeżona) — WLDE
        </p>
        <p className="mt-2 text-xs text-slate-600">
          <strong>Projekt:</strong> E-Sprawozdania — Kreator Sprawozdań Szkolnych (wersja{' '}
          <span className="font-mono-tabular">{APP_VERSION}</span>)
        </p>
        <p className="mt-1 text-xs text-slate-600">
          <strong>Właściciel praw autorskich i twórca:</strong> mgr Krzysztof Jureczek · Copyright © 2026 Krzysztof Jureczek. Wszelkie prawa zastrzeżone.
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">Preambuła</h3>
        <p>
          Niniejsza licencja ma na celu zabezpieczenie niekomercyjnego, bezpłatnego charakteru projektu <strong>„E-Sprawozdania — Kreator Sprawozdań Szkolnych”</strong>. Intencją Autora jest darmowe udostępnienie aplikacji wszystkim nauczycielom, wychowawcom, specjalistom szkolnym, placówkom oświatowym oraz użytkownikom domowym do sporządzania i drukowania dokumentacji szkolnej, przy jednoczesnym pełnym zachowaniu praw autorskich, integralności kodu źródłowego oraz zakazie jakiejkolwiek komercjalizacji, kopiowania, modyfikacji i rozpowszechniania Oprogramowania bez pisemnej zgody Autora.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 1. Definicje</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            <strong>Oprogramowanie</strong> – aplikacja „E-Sprawozdania — Kreator Sprawozdań Szkolnych” (PWA) wraz z całym kodem źródłowym, plikami wykonywalnymi, wbudowaną bazą wniosków, grafiką, szablonami wydruku oraz dokumentacją.
          </li>
          <li>
            <strong>Autor / Licencjodawca</strong> – mgr Krzysztof Jureczek, jedyny twórca i wyłączny dysponent autorskich praw majątkowych i osobistych do Oprogramowania.
          </li>
          <li>
            <strong>Użytkownik / Licencjobiorca</strong> – każdy nauczyciel, wychowawca, pedagog, psycholog, logopeda, bibliotekarz, koordynator lub inny specjalista oświaty, każda szkoła, przedszkole, uczelnia lub inna placówka oświatowo-wychowawcza korzystająca z Oprogramowania w celach zawodowo-dydaktycznych i organizacyjnych, a także każda osoba fizyczna korzystająca z Oprogramowania w celach domowych/prywatnych.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 2. Dozwolony użytek (bezpłatny)</h3>
        <p>
          Autor udziela Użytkownikowi bezpłatnej, niewyłącznej, nieprzenoszalnej i ograniczonej licencji na korzystanie z Oprogramowania wyłącznie w następujących celach:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            <strong>Bezpłatny użytek przez nauczycieli i specjalistów szkoły</strong> – nieodpłatne przygotowywanie, archiwizowanie, podgląd i drukowanie sprawozdań semestralnych i rocznych, kart zbiorczych, kart informacyjnych oraz podsumowań pracy przez nauczycieli, wychowawców i specjalistów zarówno na sprzęcie służbowym w szkole, jak i na urządzeniach prywatnych (komputer, tablet, smartfon) w domu w ramach obowiązków zawodowych i pracy własnej.
          </li>
          <li>
            <strong>Użytek edukacyjny i instytucjonalny</strong> – nieodpłatne wykorzystanie Oprogramowania w placówkach oświatowych (przedszkola, szkoły podstawowe i ponadpodstawowe, szkoły specjalne, uczelnie wyższe, świetlice, poradnie psychologiczno-pedagogiczne, placówki opiekuńczo-wychowawcze i terapeutyczne) w ramach prac rad pedagogicznych, zespołów przedmiotowych i dydaktyki.
          </li>
          <li>
            <strong>Użytek domowy / prywatny</strong> – uruchamianie Oprogramowania przez osoby fizyczne na własny, niekomercyjny użytek, w tym cele samokształceniowe.
          </li>
          <li>
            <strong>Instalacja lokalna (PWA i offline)</strong> – instalowanie i przechowywanie Oprogramowania w trybie offline (PWA) na urządzeniach własnych Użytkownika lub placówki oraz eksport/import własnych plików kopii zapasowych (JSON) i wydruków PDF.
          </li>
          <li>
            <strong>Prezentacje niekomercyjne i rekomendacje</strong> – publiczne demonstrowanie działania Oprogramowania podczas rad pedagogicznych, szkoleń nauczycielskich oraz w celu popularyzacji narzędzi dla oświaty, pod warunkiem wskazania autorstwa i niepobierania opłat.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 3. Zakazy i ograniczenia</h3>
        <p>
          Wszelkie działania wykraczające poza § 2 wymagają uprzedniej, pisemnej zgody Autora. W szczególności <strong>surowo zabrania się</strong>:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            <strong>Kopiowania kodu</strong> – kopiowania, powielania, pobierania w celu redystrybucji, dekompilacji lub inżynierii wstecznej kodu źródłowego lub skompilowanych plików Oprogramowania.
          </li>
          <li>
            <strong>Modyfikacji</strong> – wprowadzania jakichkolwiek zmian w kodzie źródłowym, interfejsie, grafice, logotypach, treściach lub innych zasobach Oprogramowania.
          </li>
          <li>
            <strong>Rozpowszechniania</strong> – dystrybuowania, udostępniania, sublicencjonowania, wynajmu, publikowania kopii lub „forków” Oprogramowania osobom trzecim, w tym poprzez repozytoria (GitHub, GitLab), sklepy z aplikacjami lub inne serwery pobierania.
          </li>
          <li>
            <strong>Sprzedaży i komercjalizacji</strong> – sprzedaży, pobierania jakichkolwiek opłat (bezpośrednich lub pośrednich) za dostęp, instalację lub użytkowanie Oprogramowania, umieszczania go w płatnych pakietach, za bramkami płatniczymi, w serwisach z reklamami czerpiącymi zysk z ruchu użytkowników, ani wykorzystywania go do świadczenia odpłatnych usług.
          </li>
          <li>
            <strong>Usuwania oznaczeń autorskich</strong> – usuwania, ukrywania lub modyfikowania informacji o Autorze, prawach autorskich, logotypach oraz odnośników do niniejszej licencji.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 4. Własność intelektualna i integralność</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Oprogramowanie oraz wszelkie związane z nim prawa autorskie i prawa własności intelektualnej stanowią wyłączną własność Autora.</li>
          <li>Niniejsza licencja nie przenosi na Użytkownika żadnych praw własności do Oprogramowania — udziela wyłącznie prawa do bezpłatnego korzystania zgodnie z § 2. Wyłącznym właścicielem dokumentów, sprawozdań i kopii JSON utworzonych przez Użytkownika pozostaje Użytkownik lub zatrudniająca go placówka.</li>
          <li>Użytkownik zobowiązuje się zachować w niezmienionym stanie wszystkie oznaczenia praw autorskich i informacje o Autorze zawarte w Oprogramowaniu.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 5. Wyłączenie odpowiedzialności (AS IS)</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Oprogramowanie dostarczane jest w stanie, w jakim się znajduje („AS IS”), bez jakichkolwiek gwarancji, wyraźnych lub dorozumianych, w tym gwarancji przydatności do określonego celu czy nieprzerwanego, bezbłędnego działania.</li>
          <li>Autor nie ponosi odpowiedzialności za jakiekolwiek szkody bezpośrednie, pośrednie lub następcze wynikłe z użytkowania lub niemożności użytkowania Oprogramowania, w tym utratę danych.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">§ 6. Rozwiązanie licencji</h3>
        <p>
          Naruszenie któregokolwiek z warunków niniejszej licencji skutkuje jej natychmiastowym i automatycznym wygaśnięciem. Użytkownik zobowiązany jest wówczas do trwałego usunięcia wszystkich kopii Oprogramowania ze swoich nośników i systemów.
        </p>
      </section>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h3 className="text-base font-semibold text-slate-900">§ 7. Postanowienia końcowe</h3>
        <p>
          W sprawach nieuregulowanych niniejszą licencją zastosowanie mają przepisy ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych oraz Kodeksu cywilnego RP. Wszelkie spory rozstrzyga sąd właściwy dla siedziby Licencjodawcy.
        </p>
        <p className="text-xs italic text-slate-500">
          Miejscowość i data sporządzenia: Polska, listopad 2026 r.
        </p>
      </section>
    </article>
  );
};

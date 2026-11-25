import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  FileCheck2,
  GraduationCap,
  History,
  Info,
  Mail,
  Printer,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import { APP_RELEASE_DATE, APP_VERSION, CHANGELOG_ENTRIES } from '../data/changelog';

export type AboutSection = 'info' | 'changelog' | 'regulamin' | 'licencja';

interface AboutViewProps {
  activeSection: AboutSection;
  onChangeSection: (section: AboutSection) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  activeSection,
  onChangeSection,
}) => {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(() => {
    const latest = CHANGELOG_ENTRIES[0]?.version;
    return latest ? new Set([latest]) : new Set();
  });

  const toggleChangelogVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };
  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8 py-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          O programie, regulamin i licencja
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          E-Sprawozdania — Kreator Sprawozdań Szkolnych (wersja{' '}
          <span className="font-mono-tabular font-medium">{APP_VERSION}</span>) · Bezpłatne narzędzie dla nauczycieli, specjalistów i placówek oświatowych.
        </p>

        {/* Sub-navigation */}
        <div
          role="tablist"
          aria-label="Sekcje informacji o programie"
          className="mt-5 flex flex-wrap gap-1.5 rounded-lg bg-slate-100 p-1 w-fit"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'info'}
            onClick={() => onChangeSection('info')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeSection === 'info'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Informacje o programie</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'changelog'}
            onClick={() => onChangeSection('changelog')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeSection === 'changelog'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historia zmian</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'regulamin'}
            onClick={() => onChangeSection('regulamin')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeSection === 'regulamin'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Regulamin i Prywatność (RODO)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'licencja'}
            onClick={() => onChangeSection('licencja')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeSection === 'licencja'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Licencja (WLDE)</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Program Info */}
      {activeSection === 'info' && (
        <div className="space-y-6">
          {/* Free for teachers notice */}
          <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-6">
            <div className="flex items-start gap-3.5">
              <GraduationCap className="w-6 h-6 text-blue-900 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Bezpłatne oprogramowanie dla nauczycieli, specjalistów i szkół
                </h2>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                  Program <strong>E-Sprawozdania</strong> jest udostępniany całkowicie za darmo dla nauczycieli, wychowawców, pedagogów, psychologów, logopedów, bibliotekarzy, koordynatorów oraz placówek oświatowych (zarówno do pracy w szkole, jak i na własnym sprzęcie w domu). Aplikacja nie zawiera reklam, opłat ani rejestracji konta.
                </p>
              </div>
            </div>
          </section>

          {/* Core Capabilities */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Najważniejsze możliwości programu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FileCheck2 className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>6 typów szkolnych dokumentów</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Karty efektów nauczania, zbiorcze sprawozdania koordynatorów, karty informacyjne nauczyciela, podsumowania dla 6 ról specjalistów oraz oficjalne załączniki klasyfikacyjne: uzasadnienie nieklasyfikowania (I półrocze / roczne) i uzasadnienie oceny niedostatecznej.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <BookOpen className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>Stałe programy, archiwum, wnioski i szablony</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Przypisanie programów i podręczników w Profilu z rozwijanymi podpowiedziami, sortowanie i filtrowanie archiwum według lat szkolnych, przenoszenie kart na nowy rok oraz baza gotowych wniosków i własnych szablonów z wymianą JSON.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Printer className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>Podgląd A4 i szybki wydruk kompletu</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Podgląd arkusza A4 na żywo oraz drukowanie pojedynczej karty albo zaznaczonego kompletu dokumentów z wybranego roku szkolnego jednym kliknięciem bez elementów interfejsu.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Database className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>100% offline · Local-First (IndexedDB)</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Wszystkie dane pozostają wyłącznie w lokalnej bazie IndexedDB w Twojej przeglądarce i nigdy nie opuszczają urządzenia. Możesz zainstalować program jako aplikację PWA oraz tworzyć kopie zapasowe JSON.
                </p>
              </div>
            </div>
          </section>

          {/* Author & Metadata */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Autor, wersja i kontakt
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="border-b border-slate-100 pb-2.5">
                <dt className="text-xs font-medium text-slate-500">Twórca i właściciel praw autorskich</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">mgr Krzysztof Jureczek</dd>
              </div>
              <div className="border-b border-slate-100 pb-2.5">
                <dt className="text-xs font-medium text-slate-500">Licencja</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  Wolna Licencja Domowo-Edukacyjna (WLDE)
                </dd>
              </div>
              <div className="border-b border-slate-100 pb-2.5">
                <dt className="text-xs font-medium text-slate-500">Wersja aplikacji</dt>
                <dd className="mt-0.5 font-mono-tabular text-slate-900">
                  {APP_VERSION} ({APP_RELEASE_DATE})
                </dd>
              </div>
              <div className="border-b border-slate-100 pb-2.5">
                <dt className="text-xs font-medium text-slate-500">Przechowywanie danych</dt>
                <dd className="mt-0.5 text-slate-900">IndexedDB (lokalnie, bez serwera) + eksport JSON</dd>
              </div>
              <div className="pt-1">
                <dt className="text-xs font-medium text-slate-500">Kontakt e-mail</dt>
                <dd className="mt-0.5">
                  <a
                    href="mailto:kjureczek@proton.me"
                    className="inline-flex items-center gap-1.5 font-medium text-blue-900 hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>kjureczek@proton.me</span>
                  </a>
                </dd>
              </div>
              <div className="pt-1">
                <dt className="text-xs font-medium text-slate-500">Profil GitHub Autora</dt>
                <dd className="mt-0.5">
                  <a
                    href="https://github.com/krzjur-oss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-900 hover:underline"
                  >
                    github.com/krzjur-oss
                  </a>
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      {/* SECTION 1b: Changelog */}
      {activeSection === 'changelog' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Historia zmian (Changelog)
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Aktualna wersja programu:{' '}
                <strong className="font-mono-tabular text-slate-900">v{APP_VERSION}</strong> · Najnowsze zmiany są rozwinięte domyślnie, starsze wydania możesz rozwinąć kliknięciem.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() =>
                  setExpandedVersions(new Set(CHANGELOG_ENTRIES.map((entry) => entry.version)))
                }
                className="font-medium text-blue-900 hover:underline cursor-pointer"
              >
                Rozwiń wszystkie
              </button>
              <span className="text-slate-300" aria-hidden="true">|</span>
              <button
                type="button"
                onClick={() => {
                  const latest = CHANGELOG_ENTRIES[0]?.version;
                  setExpandedVersions(latest ? new Set([latest]) : new Set());
                }}
                className="font-medium text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
              >
                Tylko najnowsze
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {CHANGELOG_ENTRIES.map((entry, index) => {
              const isLatest = index === 0;
              const isExpanded = expandedVersions.has(entry.version);
              return (
                <section
                  key={entry.version}
                  className={`rounded-xl border transition-colors ${
                    isLatest
                      ? 'border-blue-300 bg-white'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => toggleChangelogVersion(entry.version)}
                    className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/70 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-blue-900 mt-1 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-xs">
                          <span className="font-mono-tabular font-bold text-blue-900">
                            Wersja {entry.version}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">·</span>
                          <span className="font-mono-tabular text-slate-500">{entry.date}</span>
                          {isLatest && (
                            <>
                              <span className="text-slate-300" aria-hidden="true">·</span>
                              <span className="font-semibold text-emerald-700">
                                Najnowsze wydanie
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="mt-1 text-sm font-semibold text-slate-900">
                          {entry.title}
                        </h3>
                        {!isExpanded && (
                          <p className="mt-0.5 text-xs text-slate-500 truncate">
                            {entry.summary}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 shrink-0 pt-0.5">
                      {isExpanded ? 'Zwiń' : 'Rozwiń'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-3.5 pl-12">
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        {entry.summary}
                      </p>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700 leading-relaxed">
                        {entry.changes.map((change, cIdx) => (
                          <li key={cIdx}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: Regulamin i Polityka Prywatności */}
      {activeSection === 'regulamin' && (
        <article className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Regulamin i Polityka Prywatności aplikacji „E-Sprawozdania — Kreator Sprawozdań Szkolnych”
            </h2>
            <p className="mt-1 text-xs text-slate-500 font-mono-tabular">
              Wersja {APP_VERSION} · obowiązuje od 24.11.2026 r.
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
                Użytkownik może w każdej chwili wyeksportować swoje dane do pliku JSON, wczytać kopię zapasową lub trwale usunąć wszystkie dane z bazy IndexedDB w zakładce <strong>Kopia JSON</strong> albo czyszcząc dane witryny w przeglądarce.
              </li>
            </ol>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900">§ 6. Odpowiedzialność</h3>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Aplikacja udostępniana jest w stanie „takim, jakim jest” (<em>as is</em>), bez jakichkolwiek gwarancji.</li>
              <li>Autor nie ponosi odpowiedzialności za utratę danych, błędy działania, awarie sprzętu lub szkody wynikające z korzystania bądź niemożności korzystania z Aplikacji.</li>
              <li>Zaleca się regularne tworzenie kopii zapasowych danych za pomocą eksportu do pliku <strong>JSON</strong> w zakładce <strong>Kopia JSON</strong>.</li>
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
              Kontakt: <a href="mailto:kjureczek@proton.me" className="text-blue-900 hover:underline">kjureczek@proton.me</a> ·{' '}
              <a href="https://github.com/krzjur-oss" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline">github.com/krzjur-oss</a>
            </p>
            <p className="text-xs text-slate-500">
              © 2026 Krzysztof Jureczek · Wszelkie prawa zastrzeżone
            </p>
          </section>
        </article>
      )}

      {/* SECTION 3: Licencja WLDE */}
      {activeSection === 'licencja' && (
        <article className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              LICENCJA UŻYTKOWANIA OPROGRAMOWANIA
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-blue-900">
              Wolna Licencja Domowo-Edukacyjna (Zastrzeżona) — WLDE
            </p>
            <p className="mt-2 text-xs text-slate-600">
              <strong>Projekt:</strong> E-Sprawozdania — Kreator Sprawozdań Szkolnych (wersja <span className="font-mono-tabular">{APP_VERSION}</span>)
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
      )}
    </div>
  );
};

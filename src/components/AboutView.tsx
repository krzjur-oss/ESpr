import React, { useState } from 'react';
import {
  BookOpen,
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
} from 'lucide-react';
import { APP_RELEASE_DATE, APP_VERSION, CHANGELOG_ENTRIES } from '../data/changelog';
import {
  AuxiliaryToolNoticeCallout,
  BackupRecommendationCallout,
  LICENSE_FULL_TITLE,
  RegulaminContent,
  WldeLicenseContent,
} from './legal/LegalDocumentsContent';

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

          {/* Auxiliary status notice */}
          <AuxiliaryToolNoticeCallout />

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
                  Karty efektów nauczania, zbiorcze sprawozdania koordynatorów, karty informacyjne nauczyciela, podsumowania dla 6 ról specjalistów oraz robocze załączniki klasyfikacyjne: uzasadnienie nieklasyfikowania (I półrocze / roczne) i uzasadnienie oceny niedostatecznej.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <BookOpen className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>Stałe programy, archiwum, blokada i szablony</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Przypisanie programów i podręczników w Profilu z rozwijanymi podpowiedziami, filtrowanie archiwum według lat szkolnych, blokowanie zatwierdzonych kart przed przypadkowymi zmianami, przenoszenie kart na nowy rok oraz baza wniosków i własnych szablonów.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Printer className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>Podgląd A4, bezpośredni PDF i wydruk</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Podgląd arkusza A4 na żywo, bezpośrednie pobieranie pojedynczych kart, kompletów oraz raportów Nadzoru dyrektora jako pliki PDF z paskiem postępu, a także szybki wydruk systemowy bez elementów interfejsu. Wygenerowany plik PDF zapisuje arkusze jako obrazy, natomiast przycisk „Drukuj” (druk systemowy / „Zapisz jako PDF”) zachowuje tekst możliwy do zaznaczania.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Database className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>100% offline · Local-First (IndexedDB)</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Treść dokumentów, profilu i baz użytkownika zapisywana jest lokalnie w bazie IndexedDB przeglądarki (aplikacja nie wysyła treści dokumentów na serwer). Możesz zainstalować program jako aplikację PWA oraz tworzyć niezaszyfrowane kopie zapasowe w formacie JSON lub .zip.
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
                <dt className="text-xs font-medium text-slate-500">Twórca aplikacji</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">mgr Krzysztof Jureczek</dd>
              </div>
              <div className="border-b border-slate-100 pb-2.5">
                <dt className="text-xs font-medium text-slate-500">Licencja</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {LICENSE_FULL_TITLE}
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
                <dd className="mt-0.5 text-slate-900">IndexedDB (lokalnie w przeglądarce, bez szyfrowania aplikacji) + kopia JSON / .zip</dd>
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
              <div className="pt-1 sm:col-span-2 border-t border-slate-100 mt-1">
                <dt className="text-xs font-medium text-slate-500">Licencje komponentów zewnętrznych (open source)</dt>
                <dd className="mt-0.5">
                  <a
                    href="./THIRD_PARTY_NOTICES.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-900 hover:underline"
                  >
                    Zobacz pełne noty licencyjne zależności (THIRD_PARTY_NOTICES.txt)
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
        <div className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 space-y-6">
          <BackupRecommendationCallout />
          <RegulaminContent />
        </div>
      )}

      {/* SECTION 3: Licencja WLDE */}
      {activeSection === 'licencja' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 md:p-8">
          <WldeLicenseContent />
        </div>
      )}
    </div>
  );
};

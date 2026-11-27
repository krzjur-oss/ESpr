import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Scale, ShieldCheck } from 'lucide-react';
import { APP_VERSION } from '../data/changelog';
import {
  BackupRecommendationCallout,
  LICENSE_FULL_TITLE,
  RegulaminContent,
  WldeLicenseContent,
} from './legal/LegalDocumentsContent';

type LegalTab = 'regulamin' | 'licencja';

interface TermsOnboardingModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onAccept: () => void;
}

export const TermsOnboardingModal: React.FC<TermsOnboardingModalProps> = ({
  isOpen,
  isSubmitting = false,
  onAccept,
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalTab>('regulamin');
  const [viewedLicense, setViewedLicense] = useState(false);
  const [acceptedTermsAndLicense, setAcceptedTermsAndLicense] = useState(false);
  const [acknowledgedBackupNotice, setAcknowledgedBackupNotice] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setActiveDoc('regulamin');
    setViewedLicense(false);
    setAcceptedTermsAndLicense(false);
    setAcknowledgedBackupNotice(false);
    const frameId = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeDoc]);

  if (!isOpen) return null;

  const canProceed = acceptedTermsAndLicense && acknowledgedBackupNotice && !isSubmitting;

  const handleSelectTab = (tab: LegalTab) => {
    setActiveDoc(tab);
    if (tab === 'licencja') {
      setViewedLicense(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-3 sm:p-6 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-terms-title"
      aria-describedby="onboarding-terms-subtitle"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl outline-none"
      >
        {/* Fixed Header */}
        <header className="border-b border-slate-200 bg-white px-5 sm:px-7 py-4 sm:py-5 shrink-0">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-900 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="onboarding-terms-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-slate-900"
              >
                Zapoznanie się z regulaminem i zasadami ochrony danych
              </h2>
              <p
                id="onboarding-terms-subtitle"
                className="mt-1 text-xs sm:text-sm text-slate-600"
              >
                E-Sprawozdania (<span className="font-mono-tabular">v{APP_VERSION}</span>) · Przed rozpoczęciem pracy zapoznaj się z Regulaminem, Polityką Prywatności (RODO), Licencją WLDE oraz zaleceniem kopii zapasowej.
              </p>
            </div>
          </div>

          {/* Highlighted JSON backup recommendation */}
          <div className="mt-4">
            <BackupRecommendationCallout compact />
          </div>

          {/* Document Switch Tabs */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Dokumenty prawne do zatwierdzenia"
              className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeDoc === 'regulamin'}
                onClick={() => handleSelectTab('regulamin')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeDoc === 'regulamin'
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
                aria-selected={activeDoc === 'licencja'}
                onClick={() => handleSelectTab('licencja')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeDoc === 'licencja'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Licencja (WLDE)</span>
              </button>
            </div>

            {!viewedLicense && activeDoc === 'regulamin' && (
              <button
                type="button"
                onClick={() => handleSelectTab('licencja')}
                className="text-xs font-medium text-blue-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Przejrzyj również pełną Licencję WLDE
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Legal Content */}
        <div
          ref={scrollContainerRef}
          className="custom-scrollbar flex-1 min-h-0 overflow-y-auto bg-slate-50/60 px-5 sm:px-7 py-5"
        >
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 max-w-3xl mx-auto">
            {activeDoc === 'regulamin' ? <RegulaminContent /> : <WldeLicenseContent />}

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                {activeDoc === 'regulamin'
                  ? 'Dokument 1 z 2: Regulamin i Prywatność (RODO)'
                  : `Dokument 2 z 2: ${LICENSE_FULL_TITLE}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleSelectTab(activeDoc === 'regulamin' ? 'licencja' : 'regulamin')
                }
                className="font-semibold text-blue-900 hover:underline cursor-pointer"
              >
                {activeDoc === 'regulamin'
                  ? 'Przejdź do Licencji (WLDE)'
                  : 'Wróć do Regulaminu i RODO'}
              </button>
            </div>
          </div>
        </div>

        {/* Fixed Acceptance Footer */}
        <footer className="border-t border-slate-200 bg-white px-5 sm:px-7 py-4 shrink-0 space-y-3">
          <div className="space-y-2.5">
            <label className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTermsAndLicense}
                onChange={(e) => setAcceptedTermsAndLicense(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 shrink-0 cursor-pointer"
              />
              <span>
                Zapoznałem(-am) się z <strong>Regulaminem, Polityką Prywatności (RODO)</strong> oraz warunkami dokumentu <strong>{LICENSE_FULL_TITLE}</strong> i akceptuję je.
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledgedBackupNotice}
                onChange={(e) => setAcknowledgedBackupNotice(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 shrink-0 cursor-pointer"
              />
              <span>
                Przyjmuję do wiadomości, że aplikacja jest narzędziem pomocniczym, dane zapisywane są lokalnie w przeglądarce bez szyfrowania przez aplikację oraz że <strong>zaleca się regularne wykonywanie kopii zapasowej (JSON / ZIP)</strong> i ochronę urządzenia.
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-slate-500">
              Pełną treść dokumentów znajdziesz później w dowolnym momencie w zakładce <strong>O programie</strong>.
            </p>
            <button
              type="button"
              disabled={!canProceed}
              onClick={onAccept}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Zapisywanie zgody…' : 'Akceptuję i rozpoczynam pracę'}
              </span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

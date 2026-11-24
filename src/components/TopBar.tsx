import React from 'react';
import { Printer } from 'lucide-react';
import { MainTab } from '../types/reports';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  onPrint: () => void;
  hasDocuments: boolean;
}

const NAV_ITEMS: { id: MainTab; label: string }[] = [
  { id: 'kreator', label: 'Kreator' },
  { id: 'profil', label: 'Profil' },
  { id: 'baza_wnioskow', label: 'Wnioski i szablony' },
  { id: 'kopia_json', label: 'Kopia JSON' },
  { id: 'o_programie', label: 'O programie' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onChangeTab,
  onPrint,
  hasDocuments,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm no-print">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 md:gap-8 px-4 md:px-6 h-14">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => onChangeTab('kreator')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          E-Sprawozdania
        </button>

        {/* Zone 2: 4 single-line navigation links */}
        <nav
          aria-label="Nawigacja główna"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-blue-900 text-blue-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary action + PWA Install when available */}
        <div className="flex items-center gap-2.5 shrink-0">
          <PWAInstallButton />
          <button
            type="button"
            onClick={onPrint}
            disabled={!hasDocuments}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-3.5 md:px-4 py-2 text-xs md:text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Drukuj / PDF</span>
          </button>
        </div>
      </div>

      {/* Mobile compact secondary nav row */}
      <nav
        aria-label="Nawigacja mobilna"
        className="flex md:hidden items-center justify-between border-t border-slate-100 px-3 py-1.5 overflow-x-auto gap-2"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

import React from 'react';
import { Loader2 } from 'lucide-react';
import { PdfExportProgress } from '../utils/pdfExport';

interface PdfProgressBarProps {
  progress: PdfExportProgress;
  compact?: boolean;
}

export const PdfProgressBar: React.FC<PdfProgressBarProps> = ({
  progress,
  compact = false,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, Math.round(progress.percent)));

  const statusText =
    progress.phase === 'preparing'
      ? 'Przygotowywanie arkuszy A4 i czcionek…'
      : progress.phase === 'finalizing'
        ? `Zapisywanie pliku PDF · Stron A4: ${progress.pagesGenerated}`
        : progress.totalDocuments > 1
          ? `Przetwarzanie dokumentu ${progress.currentDocument} z ${progress.totalDocuments} · Stron A4: ${progress.pagesGenerated}`
          : 'Renderowanie dokumentu A4 do pliku PDF…';

  if (compact) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs text-slate-800 space-y-1.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 font-medium text-blue-950">
            <Loader2 className="w-3.5 h-3.5 text-blue-900 shrink-0 animate-spin" />
            <span className="truncate">{statusText}</span>
          </div>
          <span className="font-mono-tabular font-semibold text-blue-900 shrink-0">
            {clampedPercent}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Postęp generowania pliku PDF"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clampedPercent}
          className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100"
        >
          <div
            className="h-full w-full bg-blue-900 transition-transform duration-200 ease-out"
            style={{
              transform: `scaleX(${clampedPercent / 100})`,
              transformOrigin: 'left center',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print border-b border-blue-200 bg-blue-50/95 px-4 md:px-6 py-2.5 text-xs text-slate-900"
    >
      <div className="mx-auto max-w-[1440px] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-blue-950">
            <Loader2 className="w-4 h-4 text-blue-900 shrink-0 animate-spin" />
            <span>Trwa generowanie pliku PDF</span>
            <span className="text-blue-400" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-700 tabular-nums">{statusText}</span>
          </div>
          <span className="font-mono-tabular font-semibold text-blue-900">
            {clampedPercent}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Postęp generowania pliku PDF"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clampedPercent}
          className="h-2 w-full overflow-hidden rounded-full bg-blue-100"
        >
          <div
            className="h-full w-full bg-blue-900 transition-transform duration-200 ease-out"
            style={{
              transform: `scaleX(${clampedPercent / 100})`,
              transformOrigin: 'left center',
            }}
          />
        </div>
      </div>
    </div>
  );
};

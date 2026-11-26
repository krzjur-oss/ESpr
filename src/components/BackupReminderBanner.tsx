import React from 'react';
import { Clock, Download, FolderKanban, HardDriveDownload } from 'lucide-react';

interface BackupReminderBannerProps {
  reason: 'never_backed_up' | 'stale_backup';
  daysSinceLastBackup: number | null;
  onDownloadBackupNow: () => void;
  onGoToBackupTab: () => void;
  onSnooze: () => void;
}

export const BackupReminderBanner: React.FC<BackupReminderBannerProps> = ({
  reason,
  daysSinceLastBackup,
  onDownloadBackupNow,
  onGoToBackupTab,
  onSnooze,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print border-b border-amber-200 bg-amber-50/90 px-4 md:px-6 py-2.5 text-xs text-amber-950"
    >
      <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <HardDriveDownload className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
          <p className="font-medium leading-relaxed">
            {reason === 'never_backed_up' ? (
              <>
                <strong>Zalecenie kopii zapasowej:</strong> Masz już zapisane dokumenty lub dane profilu wyłącznie w tej przeglądarce. Pobierz plik kopii zapasowej <code className="font-mono-tabular">.json</code>, aby nie utracić pracy przy czyszczeniu danych przeglądarki lub zmianie urządzenia.
              </>
            ) : (
              <>
                <strong>Przypomnienie o kopii zapasowej:</strong> Od ostatniego pobrania kopii JSON minęło{' '}
                <span className="font-mono-tabular font-semibold">{daysSinceLastBackup ?? 14}</span> dni. Zapisz aktualną kopię dokumentów na dysku lub pendrive.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onDownloadBackupNow}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pobierz kopię JSON teraz</span>
          </button>
          <button
            type="button"
            onClick={onGoToBackupTab}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5 text-amber-800" />
            <span>Zakładka Kopia JSON</span>
          </button>
          <button
            type="button"
            onClick={onSnooze}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Przypomnij później</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileArchive,
  FolderKanban,
  Share2,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { AppState } from '../types/reports';
import {
  MAX_IMPORT_FILE_MIB,
  OVERSIZED_BACKUP_RECOVERY_HINT,
  formatFileSizeMiB,
} from '../utils/importLimits';
import {
  BackupScopeOptions,
  exportStateAsJsonWithSummary,
  getAvailableBackupSchoolYears,
  serializeBackupJson,
  validateAndParseImportedJson,
} from '../utils/storage';
import {
  buildBackupZipWithStats,
  exportStateAsZipWithSummary,
  readValidatedBackupFileForImport,
} from '../utils/zipBackup';

interface BackupJsonViewProps {
  state: AppState;
  lastBackupExportAt?: string | null;
  onImportState: (nextState: AppState, warnings?: string[]) => void;
  onRequestFullReset: () => void;
  onOpenShareModal: (mode: 'export' | 'import') => void;
  onOpenSupervisionExport: () => void;
  onGoToSupervision: () => void;
}

export const BackupJsonView: React.FC<BackupJsonViewProps> = ({
  state,
  lastBackupExportAt = null,
  onImportState,
  onRequestFullReset,
  onOpenShareModal,
  onOpenSupervisionExport,
  onGoToSupervision,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [exportYearScope, setExportYearScope] = useState<string>('all');
  const [includeRelatedBases, setIncludeRelatedBases] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const availableYears = useMemo(() => getAvailableBackupSchoolYears(state), [state]);

  const effectiveYearScope =
    exportYearScope !== 'all' && availableYears.includes(exportYearScope)
      ? exportYearScope
      : 'all';

  const exportScopeOptions: BackupScopeOptions = useMemo(
    () => ({
      schoolYear: effectiveYearScope,
      includeRelatedBases: effectiveYearScope === 'all' ? true : includeRelatedBases,
    }),
    [effectiveYearScope, includeRelatedBases]
  );

  const exportEstimate = useMemo(() => {
    const jsonStats = serializeBackupJson(state, exportScopeOptions);
    const zipStats = buildBackupZipWithStats(state, exportScopeOptions);
    return {
      scopedDocsCount: jsonStats.scopedState.documents.length,
      jsonBytes: jsonStats.byteLength,
      jsonEval: jsonStats.evaluation,
      zipBytes: zipStats.bytes.byteLength,
      zipEval: zipStats.evaluation,
    };
  }, [state, exportScopeOptions]);

  const isAnyOverLimit =
    exportEstimate.jsonEval.overLimit || exportEstimate.zipEval.overLimit;
  const isAnyNearLimit =
    !isAnyOverLimit &&
    (exportEstimate.jsonEval.nearLimit || exportEstimate.zipEval.nearLimit);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const resetInput = () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    try {
      const readResult = await readValidatedBackupFileForImport(file);
      if (!readResult.ok) {
        setFeedback({ type: 'error', message: readResult.error });
        resetInput();
        return;
      }

      const parsed = validateAndParseImportedJson(readResult.jsonText);
      if (parsed.ok) {
        setFeedback(null);
        onImportState(parsed.state, parsed.warnings);
      } else {
        setFeedback({
          type: 'error',
          message: parsed.error,
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Nie udało się odczytać wybranego pliku.',
      });
    } finally {
      resetInput();
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8 py-8">
      <div className="border-b border-slate-200 pb-5 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Kopia zapasowa i przenoszenie danych (JSON)
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Aplikacja działa w modelu Local-First — treści formularzy, dokumentów, profilu i baz użytkownika są zapisywane lokalnie w bazie IndexedDB przeglądarki (aplikacja nie wysyła treści dokumentów na serwer). Eksportuj plik JSON lub archiwum .zip, aby zachować kopię lub przenieść dane na inne urządzenie.
        </p>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : feedback.type === 'warning'
                ? 'border-amber-300 bg-amber-50 text-amber-950'
                : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          ) : feedback.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Eksport sesji (ZIP lub JSON)
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Pobierz spakowane archiwum <strong className="font-mono-tabular">.zip</strong> (pełna kopia plus osobne pliki dla profilu, dokumentów ({exportEstimate.scopedDocsCount}) i wybranych baz danych) albo pojedynczy plik <strong className="font-mono-tabular">.json</strong>.
            </p>

            {/* Scope selector (F-02) */}
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
              <div>
                <label
                  htmlFor="backup-year-scope"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Zakres eksportowanych dokumentów
                </label>
                <select
                  id="backup-year-scope"
                  value={effectiveYearScope}
                  onChange={(e) => setExportYearScope(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
                >
                  <option value="all">
                    Pełna sesja (wszystkie lata · {state.documents.length} dok.)
                  </option>
                  {availableYears.map((yr) => {
                    const countForYear = state.documents.filter(
                      (d) => d.schoolYear.trim() === yr
                    ).length;
                    return (
                      <option key={yr} value={yr}>
                        Tylko rok szkolny {yr} ({countForYear} dok.)
                      </option>
                    );
                  })}
                </select>
              </div>
              {effectiveYearScope !== 'all' && (
                <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRelatedBases}
                    onChange={(e) => setIncludeRelatedBases(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                  />
                  <span>
                    Dołącz bazy własnych wniosków, szablonów oraz paczki nadzoru
                  </span>
                </label>
              )}
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
              <p>
                Nauczyciel / specjalista:{' '}
                <strong className="text-slate-900">{state.profile.fullName || 'Nie podano'}</strong>
              </p>
              <p>
                Dokumenty w bieżącym zakresie:{' '}
                <strong className="font-mono-tabular text-slate-900">
                  {exportEstimate.scopedDocsCount}
                </strong>
                {effectiveYearScope !== 'all' && (
                  <span className="text-slate-500"> (z {state.documents.length} w sesji)</span>
                )}
              </p>
              <p>
                Szacowany rozmiar:{' '}
                <strong className="font-mono-tabular text-slate-900">
                  ZIP {formatFileSizeMiB(exportEstimate.zipBytes)} · JSON{' '}
                  {formatFileSizeMiB(exportEstimate.jsonBytes)}
                </strong>{' '}
                <span className="text-slate-500">(limit importu: {MAX_IMPORT_FILE_MIB} MiB)</span>
              </p>
              <p>
                Własne wnioski / szablony / paczki nadzoru:{' '}
                <strong className="font-mono-tabular text-slate-900">
                  {effectiveYearScope !== 'all' && !includeRelatedBases
                    ? '0 / 0 / 0 (wykluczone)'
                    : `${state.customWnioski.length} / ${state.customTemplates.length} / ${state.supervisionPackages.length}`}
                </strong>
              </p>
              <p>
                Ostatnia kopia zapasowa:{' '}
                <strong className="font-mono-tabular text-slate-900">
                  {lastBackupExportAt
                    ? new Date(lastBackupExportAt).toLocaleString('pl-PL', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Jeszcze nie pobrano'}
                </strong>
              </p>
            </div>

            {isAnyOverLimit && (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-900 leading-relaxed space-y-1"
              >
                <p className="font-semibold">
                  Ta kopia przekracza limit importu ({MAX_IMPORT_FILE_MIB} MiB) i nie zostanie wczytana przez aplikację w tej wersji.
                </p>
                <p>
                  Możesz nadal pobrać ją jako archiwum awaryjne albo zmniejszyć rozmiar przed eksportem: wybierz powyżej konkretny rok szkolny, odznacz dołączanie dużych baz albo wyeksportuj osobno paczki nadzoru oraz wnioski i szablony.
                </p>
              </div>
            )}

            {isAnyNearLimit && (
              <div
                role="status"
                className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 leading-relaxed"
              >
                <strong>Uwaga na rozmiar kopii:</strong> eksport przekracza 80% limitu importu ({MAX_IMPORT_FILE_MIB} MiB). Przy dalszym rozroście danych zalecamy eksport z podziałem na wybrane lata szkolne.
              </div>
            )}

            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 leading-relaxed">
              <strong>Uwaga RODO i bezpieczeństwo:</strong> Lokalna baza IndexedDB oraz eksportowane pliki JSON, archiwa ZIP i paczki nadzoru nie są szyfrowane przez aplikację i mogą zawierać dane osobowe uczniów (w tym dane o stanie zdrowia lub niepełnosprawności) oraz nauczycieli. Chroń urządzenie hasłem i blokadą ekranu, nie przesyłaj kopii niezabezpieczonym kanałem i usuń pliki po użyciu. Wyczyszczenie danych witryny nie usuwa kopii zapisanych na dysku.
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                const res = exportStateAsZipWithSummary(state, exportScopeOptions);
                if (res.ok) {
                  if (res.evaluation.overLimit) {
                    setFeedback({
                      type: 'warning',
                      message: `Pobrano archiwum ZIP (${formatFileSizeMiB(res.byteLength)}), ale przekracza ono limit importu (${MAX_IMPORT_FILE_MIB} MiB) i nie zostanie wczytane przez aplikację w tej wersji. Aby uzyskać mniejszą kopię do przenoszenia, wybierz pojedynczy rok szkolny lub osobne eksporty.`,
                    });
                  } else {
                    setFeedback({
                      type: 'success',
                      message:
                        effectiveYearScope !== 'all'
                          ? `Pobrano archiwum ZIP dla roku szkolnego ${effectiveYearScope} (${exportEstimate.scopedDocsCount} dok.).`
                          : 'Pobrano archiwum ZIP zawierające pełną kopię zapasową, profil, wszystkie dokumenty oraz bazy wniosków, szablonów i nadzoru.',
                    });
                  }
                } else {
                  setFeedback({
                    type: 'error',
                    message: 'Nie udało się wygenerować lub pobrać archiwum ZIP w przeglądarce.',
                  });
                }
              }}
              className="flex-1 min-w-[168px] inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <FileArchive className="w-4 h-4 shrink-0" />
              <span>Pobierz archiwum .ZIP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const res = exportStateAsJsonWithSummary(state, exportScopeOptions);
                if (res.ok) {
                  if (res.evaluation.overLimit) {
                    setFeedback({
                      type: 'warning',
                      message: `Pobrano plik JSON (${formatFileSizeMiB(res.byteLength)}), ale przekracza on limit importu (${MAX_IMPORT_FILE_MIB} MiB) i nie zostanie wczytany przez aplikację w tej wersji. Wybierz powyżej pojedynczy rok szkolny lub mniejszy zakres.`,
                    });
                  } else {
                    setFeedback({
                      type: 'success',
                      message:
                        effectiveYearScope !== 'all'
                          ? `Pobrano kopię zapasową JSON dla roku szkolnego ${effectiveYearScope}.`
                          : 'Pobrano pojedynczy plik kopii zapasowej JSON.',
                    });
                  }
                } else {
                  setFeedback({
                    type: 'error',
                    message: 'Nie udało się zainicjować pobierania pliku JSON w przeglądarce.',
                  });
                }
              }}
              className="flex-1 min-w-[168px] inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-900 shrink-0" />
              <span>Pobierz kopię JSON</span>
            </button>
          </div>
        </section>

        {/* Import */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Import danych z pliku JSON lub archiwum ZIP
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Wczytaj wcześniej zapisaną kopię zapasową (<code className="font-mono-tabular">.json</code> lub wyeksportowane archiwum <code className="font-mono-tabular">.zip</code>). Przed nadpisaniem bieżącej sesji zostanie wyświetlone potwierdzenie z możliwością wcześniejszego pobrania aktualnej kopii.
            </p>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Dopuszczalny rozmiar pliku importu: <strong className="font-mono-tabular text-slate-700">{MAX_IMPORT_FILE_MIB} MiB</strong>. {OVERSIZED_BACKUP_RECOVERY_HINT}
            </p>
          </div>

          <div className="mt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json,application/zip,.zip"
              onChange={(e) => {
                void handleFileChange(e);
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors text-center cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-900 shrink-0" />
              <span>Wybierz plik JSON lub ZIP z dysku</span>
            </button>
          </div>
        </section>
      </div>

      {/* Supervision package export & Director panel shortcut */}
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
            <h2 className="text-base font-semibold text-slate-900">
              Paczka sprawozdań dla dyrektora (Nadzór pedagogiczny)
            </h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Wyeksportuj karty wybranego roku lub semestru podpisane Twoim profilem nauczyciela, aby dyrektor mógł automatycznie wygenerować sprawozdania zbiorcze klas ({state.supervisionPackages.length} paczek w nadzorze).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={state.documents.length === 0}
            onClick={onOpenSupervisionExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Eksportuj paczkę dla dyrektora</span>
          </button>
          <button
            type="button"
            onClick={onGoToSupervision}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5 text-blue-900" />
            <span>Przejdź do Nadzoru dyrektora</span>
          </button>
        </div>
      </section>

      {/* Share / Transfer only Wnioski & Szablony */}
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-900 shrink-0" />
            <h2 className="text-base font-semibold text-slate-900">
              Udostępnianie samych wniosków i szablonów (JSON)
            </h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Eksportuj lub importuj wyłącznie własne wnioski ({state.customWnioski.length}) i szablony własne ({state.customTemplates.length}) — bez dokumentów, klas ani profilu. Idealne do wymiany z innymi nauczycielami.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenShareModal('export')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-900" />
            <span>Eksportuj wnioski / szablony</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenShareModal('import')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importuj wnioski / szablony</span>
          </button>
        </div>
      </section>

      {/* Danger Zone: Full Reset */}
      <section className="mt-8 rounded-xl border border-red-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-red-900">
            Reset całej aplikacji i bazy IndexedDB
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Usuwa wszystkie zapisane w przeglądarce formularze oraz dane profilu, przywracając czysty stan początkowy.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestFullReset}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Wyczyść wszystkie dane</span>
        </button>
      </section>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FolderKanban, Share2, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { AppState } from '../types/reports';
import { exportStateAsJson, validateAndParseImportedJson } from '../utils/storage';

interface BackupJsonViewProps {
  state: AppState;
  onImportState: (nextState: AppState) => void;
  onRequestFullReset: () => void;
  onOpenShareModal: (mode: 'export' | 'import') => void;
  onOpenSupervisionExport: () => void;
  onGoToSupervision: () => void;
}

export const BackupJsonView: React.FC<BackupJsonViewProps> = ({
  state,
  onImportState,
  onRequestFullReset,
  onOpenShareModal,
  onOpenSupervisionExport,
  onGoToSupervision,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const parsed = validateAndParseImportedJson(text);
      if (parsed.ok) {
        setFeedback(null);
        onImportState(parsed.state);
      } else {
        setFeedback({
          type: 'error',
          message: parsed.error,
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setFeedback({
        type: 'error',
        message: 'Nie udało się odczytać wybranego pliku.',
      });
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8 py-8">
      <div className="border-b border-slate-200 pb-5 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Kopia zapasowa i przenoszenie danych (JSON)
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Aplikacja działa w trybie Local-First — wszystkie dane przechowywane są wyłącznie w lokalnej bazie IndexedDB Twojej przeglądarki (bez obciążania localStorage). Eksportuj plik JSON, aby zachować archiwum lub przenieść dane na inny komputer.
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
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
              Eksport pełnej sesji do pliku JSON
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Pobierz plik zawierający wspólny profil oraz wszystkie utworzone karty sprawozdań ({state.documents.length}).
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
              <p>
                Nauczyciel / specjalista:{' '}
                <strong className="text-slate-900">{state.profile.fullName || 'Nie podano'}</strong>
              </p>
              <p>
                Liczba dokumentów w sesji:{' '}
                <strong className="font-mono-tabular text-slate-900">{state.documents.length}</strong>
              </p>
              <p>
                Własne wnioski w bazie:{' '}
                <strong className="font-mono-tabular text-slate-900">{state.customWnioski.length}</strong>
              </p>
              <p>
                Szablony własne fragmentów:{' '}
                <strong className="font-mono-tabular text-slate-900">{state.customTemplates.length}</strong>
              </p>
            </div>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 leading-relaxed">
              <strong>Uwaga RODO:</strong> Plik kopii JSON może zawierać imiona i nazwiska uczniów oraz inne dane osobowe. Plik nie jest szyfrowany — przekazuj go wyłącznie bezpiecznym kanałem i usuń po użyciu.
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const ok = exportStateAsJson(state);
              if (!ok) {
                setFeedback({
                  type: 'error',
                  message: 'Nie udało się zainicjować pobierania pliku JSON w przeglądarce.',
                });
              }
            }}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Pobierz kopię JSON</span>
          </button>
        </section>

        {/* Import */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Import danych z pliku JSON
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Wczytaj wcześniej zapisaną kopię zapasową. Obecna sesja zostanie zastąpiona danymi z pliku.
            </p>
          </div>

          <div className="mt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-900" />
              <span>Wybierz plik JSON z dysku</span>
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

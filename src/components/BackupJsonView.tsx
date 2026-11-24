import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Trash2, Upload } from 'lucide-react';
import { AppState } from '../types/reports';
import { exportStateAsJson, validateAndParseImportedJson } from '../utils/storage';

interface BackupJsonViewProps {
  state: AppState;
  onImportState: (nextState: AppState) => void;
  onRequestFullReset: () => void;
}

export const BackupJsonView: React.FC<BackupJsonViewProps> = ({
  state,
  onImportState,
  onRequestFullReset,
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
        onImportState(parsed.state);
        setFeedback({
          type: 'success',
          message: `Wczytano kopię zapasową: ${parsed.state.documents.length} dokumentów oraz profil nauczyciela.`,
        });
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
          Aplikacja działa w trybie Local-First — wszystkie dane przechowywane są wyłącznie w Twojej przeglądarce. Eksportuj plik JSON, aby zachować archiwum na kolejny semestr lub przenieść dane na inny komputer.
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
            </div>
          </div>

          <button
            type="button"
            onClick={() => exportStateAsJson(state)}
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

      {/* Danger Zone: Full Reset */}
      <section className="mt-8 rounded-xl border border-red-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-red-900">
            Reset całej aplikacji i pamięci lokalnej
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

import React from 'react';
import { AlertTriangle, Download, RefreshCw, Trash2 } from 'lucide-react';
import { exportRawIndexedDbBackup, wipeDatabaseForRecovery } from '../utils/storage';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  confirmReset: boolean;
  recoveryFeedback: { type: 'success' | 'error'; message: string } | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      confirmReset: false,
      recoveryFeedback: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error?.message || 'Nieznany błąd wykonania aplikacji.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('E-Sprawozdania ErrorBoundary:', error, errorInfo);
  }

  handleDownloadBackup = async () => {
    try {
      const ok = await exportRawIndexedDbBackup();
      if (ok) {
        this.setState({
          recoveryFeedback: {
            type: 'success',
            message: 'Pobrano awaryjną kopię danych z lokalnej bazy IndexedDB.',
          },
        });
      } else {
        this.setState({
          recoveryFeedback: {
            type: 'error',
            message: 'Nie znaleziono zapisanych danych w IndexedDB lub dostęp do bazy jest zablokowany.',
          },
        });
      }
    } catch {
      this.setState({
        recoveryFeedback: {
          type: 'error',
          message: 'Nie udało się odczytać danych z bazy IndexedDB.',
        },
      });
    }
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleConfirmReset = async () => {
    await wipeDatabaseForRecovery();
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-lg space-y-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Wystąpił nieoczekiwany błąd aplikacji
              </h1>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                Program napotkał błąd podczas wyświetlania danych. Twoje dokumenty w przeglądarce nie zostały usunięte — możesz najpierw pobrać kopię zapasową JSON, a następnie odświeżyć stronę.
              </p>
            </div>
          </div>

          {this.state.errorMessage && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono-tabular text-slate-700 break-words">
              {this.state.errorMessage}
            </div>
          )}

          {this.state.recoveryFeedback && (
            <div
              className={`rounded-lg border px-3.5 py-2.5 text-xs font-medium ${
                this.state.recoveryFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {this.state.recoveryFeedback.message}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void this.handleDownloadBackup()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Pobierz kopię danych (JSON)</span>
            </button>

            <button
              type="button"
              onClick={this.handleRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Odśwież</span>
            </button>

            {!this.state.confirmReset && (
              <button
                type="button"
                onClick={() => this.setState({ confirmReset: true })}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Zresetuj dane</span>
              </button>
            )}
          </div>

          {this.state.confirmReset && (
            <div className="rounded-lg border border-red-200 bg-red-50/70 p-4 space-y-3">
              <p className="text-xs font-medium text-red-900">
                Czy na pewno chcesz trwale usunąć wszystkie lokalnie zapisane dane z IndexedDB i przywrócić czysty stan aplikacji?
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => void this.handleConfirmReset()}
                  className="rounded-lg bg-red-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-800 transition-colors cursor-pointer"
                >
                  Tak, zresetuj wszystkie dane
                </button>
                <button
                  type="button"
                  onClick={() => this.setState({ confirmReset: false })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

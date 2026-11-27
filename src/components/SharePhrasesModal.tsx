import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  Share2,
  Upload,
  X,
} from 'lucide-react';
import { CustomTemplateEntry, CustomWniosekEntry } from '../types/reports';
import { validateImportFileMetadata } from '../utils/importLimits';
import {
  PhrasesExportScope,
  exportPhrasesAsJson,
  validateAndParseSharedPhrasesJson,
} from '../utils/storage';

export type SharePhrasesModalMode = 'export' | 'import';

export interface PhrasesImportPayload {
  incomingWnioski: CustomWniosekEntry[];
  incomingTemplates: CustomTemplateEntry[];
  includeWnioski: boolean;
  includeTemplates: boolean;
  mode: 'merge' | 'replace';
}

export interface PhrasesImportSummary {
  ok: boolean;
  error?: string;
  addedWnioski: number;
  addedTemplates: number;
  skippedDuplicates: number;
}

interface SharePhrasesModalProps {
  isOpen: boolean;
  initialMode: SharePhrasesModalMode;
  customWnioski: CustomWniosekEntry[];
  customTemplates: CustomTemplateEntry[];
  onClose: () => void;
  onImportPhrases: (payload: PhrasesImportPayload) => Promise<PhrasesImportSummary>;
}

export const SharePhrasesModal: React.FC<SharePhrasesModalProps> = ({
  isOpen,
  initialMode,
  customWnioski,
  customTemplates,
  onClose,
  onImportPhrases,
}) => {
  const [mode, setMode] = useState<SharePhrasesModalMode>(initialMode);

  // Export state
  const [exportWnioski, setExportWnioski] = useState(true);
  const [exportTemplates, setExportTemplates] = useState(true);
  const [exportDoneMessage, setExportDoneMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);

  // Import state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isApplyingImport, setIsApplyingImport] = useState(false);
  const [parsedData, setParsedData] = useState<{
    customWnioski: CustomWniosekEntry[];
    customTemplates: CustomTemplateEntry[];
    sourceKind: 'phrases_bundle' | 'full_backup';
  } | null>(null);
  const [importWnioski, setImportWnioski] = useState(true);
  const [importTemplates, setImportTemplates] = useState(true);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'replace'>('merge');
  const [importResult, setImportResult] = useState<PhrasesImportSummary | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setExportWnioski(customWnioski.length > 0);
    setExportTemplates(customTemplates.length > 0);
    setExportDoneMessage(null);
    setExportErrorMessage(null);
    setSelectedFileName(null);
    setParseError(null);
    setIsApplyingImport(false);
    setParsedData(null);
    setImportWnioski(true);
    setImportTemplates(true);
    setImportStrategy('merge');
    setImportResult(null);
  }, [isOpen, initialMode, customWnioski.length, customTemplates.length]);

  if (!isOpen) return null;

  const canExportAny =
    (exportWnioski && customWnioski.length > 0) ||
    (exportTemplates && customTemplates.length > 0);

  const handleExportDownload = () => {
    if (!canExportAny) return;
    let scope: PhrasesExportScope = 'all';
    if (exportWnioski && customWnioski.length > 0 && !(exportTemplates && customTemplates.length > 0)) {
      scope = 'wnioski';
    } else if (
      exportTemplates &&
      customTemplates.length > 0 &&
      !(exportWnioski && customWnioski.length > 0)
    ) {
      scope = 'szablony';
    }
    const ok = exportPhrasesAsJson(customWnioski, customTemplates, scope);
    if (!ok) {
      setExportDoneMessage(null);
      setExportErrorMessage('Nie udało się zainicjować pobierania pliku JSON w przeglądarce.');
      return;
    }

    const parts: string[] = [];
    if (scope !== 'szablony' && customWnioski.length > 0) {
      parts.push(`własne wnioski (${customWnioski.length})`);
    }
    if (scope !== 'wnioski' && customTemplates.length > 0) {
      parts.push(`szablony własne (${customTemplates.length})`);
    }
    setExportErrorMessage(null);
    setExportDoneMessage(`Pobrano plik JSON zawierający: ${parts.join(' oraz ')}.`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportResult(null);
    setParseError(null);
    setSelectedFileName(file.name);

    try {
      const precheck = validateImportFileMetadata(file, { allowZip: false });
      if (!precheck.ok) {
        setParsedData(null);
        setParseError(precheck.error);
        return;
      }
      const text = await file.text();
      const parsed = validateAndParseSharedPhrasesJson(text);
      if (parsed.ok) {
        setParsedData({
          customWnioski: parsed.customWnioski,
          customTemplates: parsed.customTemplates,
          sourceKind: parsed.sourceKind,
        });
        setImportWnioski(parsed.customWnioski.length > 0);
        setImportTemplates(parsed.customTemplates.length > 0);
      } else {
        setParsedData(null);
        setParseError(parsed.error);
      }
    } catch {
      setParsedData(null);
      setParseError('Nie udało się odczytać wybranego pliku.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const canApplyImport =
    !!parsedData &&
    ((importWnioski && parsedData.customWnioski.length > 0) ||
      (importTemplates && parsedData.customTemplates.length > 0));

  const handleApplyImport = async () => {
    if (!parsedData || !canApplyImport || isApplyingImport) return;
    setIsApplyingImport(true);
    setParseError(null);
    try {
      const summary = await onImportPhrases({
        incomingWnioski: parsedData.customWnioski,
        incomingTemplates: parsedData.customTemplates,
        includeWnioski: importWnioski && parsedData.customWnioski.length > 0,
        includeTemplates: importTemplates && parsedData.customTemplates.length > 0,
        mode: importStrategy,
      });
      if (summary.ok) {
        setImportResult(summary);
      } else {
        setParseError(
          summary.error || 'Nie udało się trwale zapisać zaimportowanych wpisów.'
        );
      }
    } finally {
      setIsApplyingImport(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-phrases-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Share2 className="w-5 h-5 text-blue-900 shrink-0" />
            <div className="min-w-0">
              <h2
                id="share-phrases-modal-title"
                className="text-base font-semibold text-slate-900 truncate"
              >
                Udostępnianie wniosków i szablonów (JSON)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Wymieniaj własne wpisy między urządzeniami lub ze współpracownikami bez przesyłania danych uczniów
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer shrink-0"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="inline-flex rounded-lg bg-slate-200/70 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('export');
                setExportDoneMessage(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'export'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksportuj do pliku</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('import');
                setImportResult(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'import'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importuj z pliku</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {mode === 'export' ? (
            <>
              <p className="text-sm text-slate-600 leading-relaxed">
                Wybierz zestawy do zapisania w pliku JSON. Wbudowany słownik podstawowych wniosków znajduje się już w programie na każdym urządzeniu, dlatego plik obejmuje wyłącznie Twoje własne wpisy.
              </p>

              {customWnioski.length === 0 && customTemplates.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Nie masz jeszcze zapisanych własnych wniosków ani szablonów własnych. Dodaj przynajmniej jeden własny wpis w bazie lub w formularzu sprawozdania, aby móc go wyeksportować.
                </div>
              ) : (
                <div className="space-y-2.5">
                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                      customWnioski.length === 0
                        ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        : exportWnioski
                          ? 'border-blue-900 bg-blue-50/40 cursor-pointer'
                          : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={exportWnioski && customWnioski.length > 0}
                      disabled={customWnioski.length === 0}
                      onChange={(e) => {
                        setExportWnioski(e.target.checked);
                        setExportDoneMessage(null);
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          Własne wnioski do bazy
                        </span>
                        <span className="text-xs font-mono-tabular text-slate-600">
                          {customWnioski.length} poz.
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Wszystkie wnioski dodane przez Ciebie do poszczególnych kategorii przedmiotowych i ogólnych.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                      customTemplates.length === 0
                        ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        : exportTemplates
                          ? 'border-blue-900 bg-blue-50/40 cursor-pointer'
                          : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={exportTemplates && customTemplates.length > 0}
                      disabled={customTemplates.length === 0}
                      onChange={(e) => {
                        setExportTemplates(e.target.checked);
                        setExportDoneMessage(null);
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          Szablony własne fragmentów
                        </span>
                        <span className="text-xs font-mono-tabular text-slate-600">
                          {customTemplates.length} poz.
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Zapisane fragmenty treści z nazwami i przypisanymi kategoriami sekcji sprawozdania.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {exportErrorMessage && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <span>{exportErrorMessage}</span>
                </div>
              )}

              {exportDoneMessage && (
                <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{exportDoneMessage}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 leading-relaxed">
                Wskaż plik JSON otrzymany od innego nauczyciela lub przeniesiony z drugiego komputera. Możesz połączyć nowe wpisy ze swoją obecną bazą (z pominięciem duplikatów) albo je zastąpić.
              </p>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    void handleFileChange(e);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:border-blue-900 hover:bg-blue-50/30 transition-colors cursor-pointer"
                >
                  <FileJson className="w-4 h-4 text-blue-900" />
                  <span>
                    {selectedFileName
                      ? `Wybrany plik: ${selectedFileName} (zmień)`
                      : 'Wybierz plik JSON z dysku'}
                  </span>
                </button>
              </div>

              {parseError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {parsedData && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 space-y-1">
                    <p className="font-medium text-slate-800">
                      {parsedData.sourceKind === 'full_backup'
                        ? 'Wykryto pełną kopię zapasową E-Sprawozdań — zaimportowane zostaną wyłącznie własne wnioski i szablony (bez nadpisywania dokumentów ani profilu).'
                        : 'Wykryto pakiet udostępnionych wniosków i szablonów.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      1. Elementy do wczytania z pliku
                    </p>
                    <label
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 ${
                        parsedData.customWnioski.length === 0
                          ? 'border-slate-200 bg-slate-50 opacity-55 cursor-not-allowed'
                          : 'border-slate-200 bg-white cursor-pointer hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 text-sm font-medium text-slate-900">
                        <input
                          type="checkbox"
                          checked={importWnioski && parsedData.customWnioski.length > 0}
                          disabled={parsedData.customWnioski.length === 0}
                          onChange={(e) => {
                            setImportWnioski(e.target.checked);
                            setImportResult(null);
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-900"
                        />
                        <span>Własne wnioski</span>
                      </span>
                      <span className="text-xs font-mono-tabular text-slate-600">
                        {parsedData.customWnioski.length} w pliku
                      </span>
                    </label>

                    <label
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 ${
                        parsedData.customTemplates.length === 0
                          ? 'border-slate-200 bg-slate-50 opacity-55 cursor-not-allowed'
                          : 'border-slate-200 bg-white cursor-pointer hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 text-sm font-medium text-slate-900">
                        <input
                          type="checkbox"
                          checked={importTemplates && parsedData.customTemplates.length > 0}
                          disabled={parsedData.customTemplates.length === 0}
                          onChange={(e) => {
                            setImportTemplates(e.target.checked);
                            setImportResult(null);
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-900"
                        />
                        <span>Szablony własne</span>
                      </span>
                      <span className="text-xs font-mono-tabular text-slate-600">
                        {parsedData.customTemplates.length} w pliku
                      </span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      2. Sposób wczytania
                    </p>
                    <label
                      className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer ${
                        importStrategy === 'merge'
                          ? 'border-blue-900 bg-blue-50/40'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="phrases-import-strategy"
                        checked={importStrategy === 'merge'}
                        onChange={() => {
                          setImportStrategy('merge');
                          setImportResult(null);
                        }}
                        className="mt-0.5 text-blue-900"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-900">
                          Połącz z obecnymi wpisami (zalecane)
                        </span>
                        <span className="block mt-0.5 text-xs text-slate-500">
                          Zachowuje Twoje dotychczasowe wnioski i szablony, dopisuje nowe oraz automatycznie pomija duplikaty.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer ${
                        importStrategy === 'replace'
                          ? 'border-blue-900 bg-blue-50/40'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="phrases-import-strategy"
                        checked={importStrategy === 'replace'}
                        onChange={() => {
                          setImportStrategy('replace');
                          setImportResult(null);
                        }}
                        className="mt-0.5 text-blue-900"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-900">
                          Zastąp zaznaczone listy danymi z pliku
                        </span>
                        <span className="block mt-0.5 text-xs text-slate-500">
                          Nadpisuje Twoje obecne własne wpisy w zaznaczonych wyżej kategoriach (np. przy odtwarzaniu z drugiego komputera).
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {importResult && (
                <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Zakończono import: dodano{' '}
                    <strong className="font-mono-tabular">{importResult.addedWnioski}</strong>{' '}
                    własnych wniosków oraz{' '}
                    <strong className="font-mono-tabular">{importResult.addedTemplates}</strong>{' '}
                    szablonów własnych
                    {importResult.skippedDuplicates > 0
                      ? ` (pominięto duplikatów: ${importResult.skippedDuplicates})`
                      : ''}
                    .
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            {importResult || exportDoneMessage ? 'Zamknij' : 'Anuluj'}
          </button>

          {mode === 'export' ? (
            <button
              type="button"
              disabled={!canExportAny}
              onClick={handleExportDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pobierz plik JSON</span>
            </button>
          ) : (
            !importResult && (
              <button
                type="button"
                disabled={!canApplyImport || isApplyingImport}
                onClick={() => void handleApplyImport()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isApplyingImport ? 'Zapisywanie…' : 'Zaimportuj wybrane'}</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

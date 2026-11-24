import React, { useEffect, useMemo, useState } from 'react';
import { CalendarArrowUp, Check, X } from 'lucide-react';
import {
  DOCUMENT_TYPE_LABELS,
  ReportDocument,
  SemesterType,
} from '../types/reports';
import { suggestNextSchoolYear } from '../utils/documentFactory';

interface NewYearRolloverModalProps {
  isOpen: boolean;
  documents: ReportDocument[];
  availableYears: string[];
  defaultSourceYear: string;
  onClose: () => void;
  onConfirmRollover: (params: {
    sourceDocIds: string[];
    targetYear: string;
    targetSemester: SemesterType;
    mode: 'clean_base' | 'full_copy';
    carryOverConclusions: boolean;
  }) => void;
}

export const NewYearRolloverModal: React.FC<NewYearRolloverModalProps> = ({
  isOpen,
  documents,
  availableYears,
  defaultSourceYear,
  onClose,
  onConfirmRollover,
}) => {
  const [sourceYear, setSourceYear] = useState(defaultSourceYear);
  const [targetYear, setTargetYear] = useState(suggestNextSchoolYear(defaultSourceYear));
  const [targetSemester, setTargetSemester] = useState<SemesterType>('I');
  const [mode, setMode] = useState<'clean_base' | 'full_copy'>('clean_base');
  const [carryOverConclusions, setCarryOverConclusions] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const yearsWithDocs = useMemo(() => {
    const set = new Set<string>();
    for (const d of documents) {
      set.add(d.schoolYear?.trim() || 'Bez roku');
    }
    return availableYears.filter((y) => set.has(y));
  }, [documents, availableYears]);

  const docsInSourceYear = useMemo(
    () =>
      documents.filter(
        (d) => (d.schoolYear?.trim() || 'Bez roku') === sourceYear
      ),
    [documents, sourceYear]
  );

  useEffect(() => {
    if (!isOpen) return;
    const initialSource =
      yearsWithDocs.includes(defaultSourceYear)
        ? defaultSourceYear
        : yearsWithDocs[0] || defaultSourceYear;
    setSourceYear(initialSource);
    setTargetYear(suggestNextSchoolYear(initialSource));
    setTargetSemester('I');
    setMode('clean_base');
    setCarryOverConclusions(true);
  }, [isOpen, defaultSourceYear, yearsWithDocs]);

  useEffect(() => {
    setSelectedIds(docsInSourceYear.map((d) => d.id));
  }, [docsInSourceYear]);

  if (!isOpen) return null;

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allSelected =
    docsInSourceYear.length > 0 && selectedIds.length === docsInSourceYear.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || !targetYear.trim()) return;
    onConfirmRollover({
      sourceDocIds: selectedIds,
      targetYear: targetYear.trim(),
      targetSemester,
      mode,
      carryOverConclusions,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rollover-modal-title"
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <CalendarArrowUp className="w-5 h-5 text-blue-900 shrink-0" />
            <div>
              <h2 id="rollover-modal-title" className="text-base font-semibold text-slate-900">
                Przenieś wybrane karty na nowy rok szkolny
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Poprzednie dokumenty pozostaną bezpieczne w archiwum
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Source / Target Year + Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Kopiuj z roku
              </label>
              <select
                value={sourceYear}
                onChange={(e) => {
                  setSourceYear(e.target.value);
                  setTargetYear(suggestNextSchoolYear(e.target.value));
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono-tabular focus:border-blue-900 focus:outline-none"
              >
                {yearsWithDocs.length === 0 ? (
                  <option value={sourceYear}>{sourceYear}</option>
                ) : (
                  yearsWithDocs.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Docelowy rok szkolny
              </label>
              <input
                type="text"
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                placeholder="2026/2027"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono-tabular focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Semestr startowy
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                {(['I', 'II'] as SemesterType[]).map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setTargetSemester(sem)}
                    className={`rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      targetSemester === sem
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sem. {sem}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Copy Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Tryb utworzenia kart
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMode('clean_base')}
                className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                  mode === 'clean_base'
                    ? 'border-blue-900 bg-blue-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-semibold text-slate-900">
                  Czysta baza na nowy rok (Zalecane)
                </p>
                <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                  Zachowuje przedmiot, klasę, program i podręcznik (z aktualizacją z Profilu), zeruje oceny i bieżące opisy.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMode('full_copy')}
                className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                  mode === 'full_copy'
                    ? 'border-blue-900 bg-blue-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-semibold text-slate-900">
                  Pełna kopia robocza
                </p>
                <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                  Kopiuje całą treść wybranych kart jako punkt wyjścia do ręcznej edycji.
                </p>
              </button>
            </div>

            {mode === 'clean_base' && (
              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={carryOverConclusions}
                  onChange={(e) => setCarryOverConclusions(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                />
                <span>
                  Przenieś zeszłoroczne <strong>„Wnioski do dalszej pracy”</strong> do pola{' '}
                  <strong>„Stopień realizacji wniosków z poprzedniego roku”</strong> jako punkt odniesienia
                </span>
              </label>
            )}
          </div>

          {/* Checklist of cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 tabular-nums">
                Wybierz karty do przeniesienia ({selectedIds.length}/{docsInSourceYear.length})
              </span>
              {docsInSourceYear.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIds(
                      allSelected ? [] : docsInSourceYear.map((d) => d.id)
                    )
                  }
                  className="text-xs font-semibold text-blue-900 hover:underline cursor-pointer"
                >
                  {allSelected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
                </button>
              )}
            </div>

            {docsInSourceYear.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                Brak kart w wybranym roku źródłowym ({sourceYear}).
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {docsInSourceYear.map((doc) => {
                  const checked = selectedIds.includes(doc.id);
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => toggleId(doc.id)}
                      className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                        checked
                          ? 'border-blue-900 bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? 'border-blue-900 bg-blue-900 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {doc.title || DOCUMENT_TYPE_LABELS[doc.type]}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {DOCUMENT_TYPE_LABELS[doc.type]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={selectedIds.length === 0 || !targetYear.trim()}
            className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Utwórz karty na rok {targetYear || '—'} ({selectedIds.length})
          </button>
        </div>
      </form>
    </div>
  );
};

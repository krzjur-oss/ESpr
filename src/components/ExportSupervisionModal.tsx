import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Download, FileCheck2, ShieldCheck, X } from 'lucide-react';
import {
  DOCUMENT_TYPE_LABELS,
  ReportDocument,
  SemesterType,
  TeacherProfile,
} from '../types/reports';
import { exportSupervisionPackageAsJson } from '../utils/supervision';

interface ExportSupervisionModalProps {
  isOpen: boolean;
  profile: TeacherProfile;
  documents: ReportDocument[];
  availableYears: string[];
  defaultYearFilter: string;
  onClose: () => void;
  onUpdateProfileName?: (fullName: string) => void;
}

export const ExportSupervisionModal: React.FC<ExportSupervisionModalProps> = ({
  isOpen,
  profile,
  documents,
  availableYears,
  defaultYearFilter,
  onClose,
  onUpdateProfileName,
}) => {
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<'all' | SemesterType>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inlineTeacherName, setInlineTeacherName] = useState('');
  const [exportedDone, setExportedDone] = useState(false);

  const candidateDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (yearFilter !== 'all') {
        const docYear = doc.schoolYear?.trim() || 'Bez roku';
        if (docYear !== yearFilter) return false;
      }
      if (semesterFilter !== 'all') {
        if ('semester' in doc) {
          return doc.semester === semesterFilter;
        }
        if ('classificationPeriod' in doc) {
          return semesterFilter === 'I'
            ? doc.classificationPeriod === 'srodroczne'
            : doc.classificationPeriod === 'roczne';
        }
      }
      return true;
    });
  }, [documents, yearFilter, semesterFilter]);

  useEffect(() => {
    if (!isOpen) return;
    const preferredYear =
      defaultYearFilter !== 'all'
        ? defaultYearFilter
        : profile.schoolYear.trim() || availableYears[0] || 'all';
    setYearFilter(preferredYear);
    setSemesterFilter('all');
    setInlineTeacherName(profile.fullName);
    setExportedDone(false);
  }, [isOpen, defaultYearFilter, profile.schoolYear, profile.fullName, availableYears]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(candidateDocuments.map((d) => d.id));
  }, [isOpen, candidateDocuments]);

  if (!isOpen) return null;

  const effectiveTeacherName = profile.fullName.trim() || inlineTeacherName.trim();
  const selectedSet = new Set(selectedIds);
  const selectedDocs = candidateDocuments.filter((d) => selectedSet.has(d.id));

  const toggleDoc = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    if (!effectiveTeacherName || selectedDocs.length === 0) return;
    if (!profile.fullName.trim() && inlineTeacherName.trim() && onUpdateProfileName) {
      onUpdateProfileName(inlineTeacherName.trim());
    }
    const signedProfile: TeacherProfile = {
      ...profile,
      fullName: effectiveTeacherName,
    };
    exportSupervisionPackageAsJson(signedProfile, selectedDocs, {
      schoolYearFilter: yearFilter,
      semesterFilter,
    });
    setExportedDone(true);
    setTimeout(() => {
      setExportedDone(false);
    }, 2600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-supervision-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
            <div>
              <h2 id="export-supervision-title" className="text-base font-semibold text-slate-900">
                Eksport podpisanej paczki dla dyrektora
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Plik JSON podpisany Twoim profilem zasili bezpośrednio sprawozdania zbiorcze klas w panelu Nadzoru dyrektora.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij okno"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
          {/* Teacher Profile Signature Preview */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-slate-800">Podpis nadawcy (z Twojego Profilu)</p>
            {profile.fullName.trim() ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                <p>
                  Nauczyciel: <strong className="text-slate-900">{profile.fullName}</strong>
                </p>
                <p>
                  Szkoła: <strong className="text-slate-900">{profile.schoolName || 'Nie podano'}</strong>
                </p>
                <p>
                  Rok szkolny: <strong className="font-mono-tabular text-slate-900">{profile.schoolYear || '—'}</strong>
                </p>
                <p>
                  Wychowawstwo: <strong className="text-slate-900">{profile.homeroomClass || 'brak'}</strong>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    W Twoim Profilu brakuje imienia i nazwiska. Wpisz podpis poniżej przed wysłaniem paczki do dyrektora (zostanie zapisany w Profilu):
                  </span>
                </div>
                <input
                  type="text"
                  value={inlineTeacherName}
                  onChange={(e) => setInlineTeacherName(e.target.value)}
                  placeholder="np. mgr Anna Kowalska"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Scope filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="supervision-export-year"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Rok szkolny
              </label>
              <select
                id="supervision-export-year"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-900 focus:outline-none"
              >
                <option value="all">Wszystkie lata szkolne</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Rok szkolny {yr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="supervision-export-sem"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Semestr / okres
              </label>
              <select
                id="supervision-export-sem"
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value as 'all' | SemesterType)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-900 focus:outline-none"
              >
                <option value="all">Cały rok (Semestr I i II)</option>
                <option value="I">Semestr I / śródroczne</option>
                <option value="II">Semestr II / roczne</option>
              </select>
            </div>
          </div>

          {/* Document checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 tabular-nums">
                Karty do dołączenia ({selectedDocs.length} z {candidateDocuments.length})
              </span>
              {candidateDocuments.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIds(
                      selectedDocs.length === candidateDocuments.length
                        ? []
                        : candidateDocuments.map((d) => d.id)
                    )
                  }
                  className="text-xs font-semibold text-blue-900 hover:underline cursor-pointer"
                >
                  {selectedDocs.length === candidateDocuments.length
                    ? 'Odznacz wszystkie'
                    : 'Zaznacz wszystkie'}
                </button>
              )}
            </div>

            {candidateDocuments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                Brak kart sprawozdań dla wybranego roku szkolnego i semestru.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 custom-scrollbar">
                {candidateDocuments.map((doc) => {
                  const checked = selectedSet.has(doc.id);
                  return (
                    <label
                      key={doc.id}
                      className={`flex items-start gap-3 px-3.5 py-2.5 text-xs cursor-pointer transition-colors ${
                        checked ? 'bg-blue-50/40' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDoc(doc.id)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">
                          {doc.title || DOCUMENT_TYPE_LABELS[doc.type]}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {DOCUMENT_TYPE_LABELS[doc.type]}
                          {' · '}
                          {doc.schoolYear || 'Bez roku'}
                          {'semester' in doc ? ` · Semestr ${doc.semester}` : ''}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed">
            <strong>Uwaga RODO:</strong> Eksportowana paczka JSON może zawierać imiona i nazwiska uczniów oraz dane profilu (dane osobowe). Plik nie jest szyfrowany — przekaż go dyrekcji bezpiecznym kanałem i usuń z dysku po zaimportowaniu.
          </div>

          {exportedDone && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900">
              <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Pobrano podpisaną paczkę JSON dla dyrektora ({selectedDocs.length} kart). Przekaż ten plik dyrekcji.
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap shrink-0"
          >
            Zamknij
          </button>
          <button
            type="button"
            disabled={!effectiveTeacherName || selectedDocs.length === 0}
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {exportedDone ? (
              <>
                <Check className="w-4 h-4" />
                <span>Pobrano paczkę JSON</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Pobierz podpisaną paczkę ({selectedDocs.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

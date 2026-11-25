import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileDown,
  FileSpreadsheet,
  FolderKanban,
  Printer,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import {
  CURRICULUM_STATUS_LABELS,
  SemesterType,
  TeacherSupervisionPackage,
} from '../types/reports';
import { ClassCollectiveReport, resolvePackageTeacherName } from '../utils/supervision';
import { ClassCollectivePrintSheet } from './print/ClassCollectivePrintSheet';

export interface SupervisionImportFeedback {
  type: 'success' | 'info' | 'error';
  message: string;
}

interface DirectorSupervisionViewProps {
  packages: TeacherSupervisionPackage[];
  reports: ClassCollectiveReport[];
  availableYears: string[];
  yearFilter: string;
  semesterFilter: 'all' | SemesterType;
  selectedClassName: string | null;
  selectedPrintClasses: string[];
  importFeedback: SupervisionImportFeedback | null;
  onChangeYearFilter: (year: string) => void;
  onChangeSemesterFilter: (semester: 'all' | SemesterType) => void;
  onSelectClass: (className: string) => void;
  onTogglePrintClass: (className: string) => void;
  onToggleSelectAllClasses: () => void;
  onClearPrintClasses: () => void;
  onImportFiles: (files: FileList | File[]) => void;
  onUpdateClassNotes: (notesKey: string, notes: string) => void;
  onRequestDeletePackage: (pkg: TeacherSupervisionPackage) => void;
  onPrintClass: (report: ClassCollectiveReport) => void;
  onGenerateBatchPdf: () => void;
}

function formatClassesNoun(count: number): string {
  if (count === 1) return 'klasa';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'klasy';
  }
  return 'klas';
}

export const DirectorSupervisionView: React.FC<DirectorSupervisionViewProps> = ({
  packages,
  reports,
  availableYears,
  yearFilter,
  semesterFilter,
  selectedClassName,
  selectedPrintClasses,
  importFeedback,
  onChangeYearFilter,
  onChangeSemesterFilter,
  onSelectClass,
  onTogglePrintClass,
  onToggleSelectAllClasses,
  onClearPrintClasses,
  onImportFiles,
  onUpdateClassNotes,
  onRequestDeletePackage,
  onPrintClass,
  onGenerateBatchPdf,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'classes' | 'teachers'>('classes');
  const [workspaceMode, setWorkspaceMode] = useState<'summary' | 'preview'>('summary');
  const [previewScope, setPreviewScope] = useState<'active' | 'batch'>('active');
  const [previewZoom, setPreviewZoom] = useState<number>(0.72);
  const [isDragging, setIsDragging] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedPrintClasses), [selectedPrintClasses]);

  const batchReports = useMemo(() => {
    const picked = reports.filter((r) => selectedSet.has(r.className));
    return picked.length > 0 ? picked : reports;
  }, [reports, selectedSet]);

  const activeSelectedCount = useMemo(
    () => reports.filter((r) => selectedSet.has(r.className)).length,
    [reports, selectedSet]
  );

  const activeReport = useMemo(() => {
    if (reports.length === 0) return null;
    if (selectedClassName) {
      const exact = reports.find((r) => r.className === selectedClassName);
      if (exact) return exact;
    }
    return reports[0];
  }, [reports, selectedClassName]);

  const previewReports = useMemo(() => {
    if (previewScope === 'batch') return batchReports;
    return activeReport ? [activeReport] : [];
  }, [previewScope, batchReports, activeReport]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImportFiles(e.dataTransfer.files);
    }
  };

  const pdfButtonLabel =
    activeSelectedCount > 0
      ? `Generuj PDF wybranych klas (${activeSelectedCount})`
      : yearFilter !== 'all'
        ? `Generuj jeden PDF · ${yearFilter} (${reports.length})`
        : `Generuj jeden PDF (${reports.length} ${formatClassesNoun(reports.length)})`;

  return (
    <div className="flex-1 flex flex-col max-w-[1440px] w-full mx-auto bg-white border-x border-slate-200/80">
      {/* Top Supervision Toolbar + Dropzone Header */}
      <div className="border-b border-slate-200 bg-white px-4 md:px-6 py-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Nadzór dyrektora — automatyczne sprawozdania zbiorcze klas
            </h1>
            <p className="mt-0.5 text-xs md:text-sm text-slate-600">
              Importuj podpisane paczki sprawozdań nauczycieli. Każda nowa paczka automatycznie zasila lub aktualizuje zestawienie zbiorcze dla każdej klasy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              aria-label="Filtruj nadzór po roku szkolnym"
              value={yearFilter}
              onChange={(e) => onChangeYearFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-900 focus:outline-none cursor-pointer"
            >
              <option value="all">Wszystkie lata szkolne</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Rok szkolny {yr}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtruj nadzór po semestrze"
              value={semesterFilter}
              onChange={(e) => onChangeSemesterFilter(e.target.value as 'all' | SemesterType)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-900 focus:outline-none cursor-pointer"
            >
              <option value="all">Cały rok (Semestr I i II)</option>
              <option value="I">Semestr I / śródroczne</option>
              <option value="II">Semestr II / roczne</option>
            </select>

            <button
              type="button"
              disabled={reports.length === 0}
              onClick={onGenerateBatchPdf}
              title={
                activeSelectedCount > 0
                  ? `Wygeneruj jeden plik PDF dla ${activeSelectedCount} zaznaczonych klas (${yearFilter === 'all' ? 'wszystkie lata' : `rok ${yearFilter}`}) — w oknie drukowania wybierz „Zapisz jako PDF”`
                  : `Wygeneruj jeden plik PDF dla wszystkich ${reports.length} klas (${yearFilter === 'all' ? 'wszystkie lata' : `rok ${yearFilter}`}) — w oknie drukowania wybierz „Zapisz jako PDF”`
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 shrink-0" />
              <span className="tabular-nums">{pdfButtonLabel}</span>
            </button>
          </div>
        </div>

        {/* Multi-file Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-colors ${
            isDragging
              ? 'border-blue-900 bg-blue-50/70'
              : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-3 text-xs text-slate-700">
            <Upload className="w-4 h-4 text-blue-900 shrink-0" />
            <span>
              Przeciągnij tutaj jeden lub wiele plików JSON od nauczycieli albo kliknij przycisk po prawej. Ponowne wczytanie paczki od tego samego nauczyciela uruchomi porównanie zmian.
            </span>
          </div>
          <div className="shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/json,.json"
              onChange={handleFileInput}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-900 bg-white px-3.5 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importuj paczki nauczycieli (JSON)</span>
            </button>
          </div>
        </div>

        {importFeedback && (
          <div
            className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs ${
              importFeedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : importFeedback.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : 'border-blue-200 bg-blue-50 text-blue-900'
            }`}
          >
            {importFeedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            )}
            <span>{importFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Main Split Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Sidebar: Classes (with multi-select checkboxes) or Imported Teachers */}
        <aside className="w-full lg:w-[310px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col">
          <div className="p-3 border-b border-slate-200 space-y-2.5">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setSidebarTab('classes')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                  sidebarTab === 'classes'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Klasy ({reports.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('teachers')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                  sidebarTab === 'teachers'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Nauczyciele ({packages.length})</span>
              </button>
            </div>

            {sidebarTab === 'classes' && reports.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-0.5 text-[11px]">
                <span className="font-medium text-slate-500 tabular-nums">
                  {activeSelectedCount > 0
                    ? `Wybrane do PDF: ${activeSelectedCount}/${reports.length}`
                    : 'Zaznacz klasy do jednego PDF'}
                </span>
                {activeSelectedCount > 0 ? (
                  <button
                    type="button"
                    onClick={onClearPrintClasses}
                    className="font-semibold text-blue-900 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Odznacz ({activeSelectedCount})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onToggleSelectAllClasses}
                    className="font-medium text-slate-600 hover:text-blue-900 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Zaznacz wszystkie
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
            {sidebarTab === 'classes' ? (
              reports.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
                  {packages.length === 0
                    ? 'Zaimportuj pierwsze paczki od nauczycieli, aby automatycznie utworzyć zestawienia klas.'
                    : 'Brak danych klas dla wybranego roku szkolnego lub semestru.'}
                </div>
              ) : (
                reports.map((rep) => {
                  const isActive = activeReport?.className === rep.className;
                  const isChecked = selectedSet.has(rep.className);
                  return (
                    <div
                      key={rep.className}
                      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
                        isActive
                          ? 'border-blue-900 bg-blue-50/70'
                          : isChecked
                            ? 'border-blue-300 bg-blue-50/25 hover:bg-blue-50/40'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onTogglePrintClass(rep.className)}
                        aria-label={`Wybierz klasę ${rep.className} do wspólnego pliku PDF`}
                        title="Wybierz klasę do wspólnego pliku PDF"
                        className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => onSelectClass(rep.className)}
                        className="min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-sm font-bold ${
                              isActive ? 'text-blue-950' : 'text-slate-900'
                            }`}
                          >
                            Klasa {rep.className}
                          </span>
                          <span className="text-[11px] font-mono-tabular text-slate-500">
                            {rep.totals.teachersCount} naucz.
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 tabular-nums truncate">
                          {rep.totals.subjectsCount} przedm. · ndst: {rep.totals.totalFailingGrades} · NKL/NDST:{' '}
                          {rep.totals.nklCount + rep.totals.ndstCount}
                        </p>
                      </button>
                    </div>
                  );
                })
              )
            ) : packages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
                Brak zaimportowanych paczek nauczycieli.
              </div>
            ) : (
              packages.map((pkg) => {
                const displayName = resolvePackageTeacherName(pkg);
                return (
                  <div
                    key={pkg.id}
                    className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {pkg.documents.length} kart
                          {pkg.homeroomClass ? ` · wych. ${pkg.homeroomClass}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRequestDeletePackage(pkg)}
                        title="Usuń paczkę tego nauczyciela z nadzoru"
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10.5px] font-mono-tabular text-slate-400">
                      Eksport: {new Date(pkg.exportedAt).toLocaleString('pl-PL')}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky sidebar footer for one-click combined PDF export */}
          {sidebarTab === 'classes' && reports.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <FileDown className="w-3.5 h-3.5 text-blue-900" />
                  <span>Wspólny plik PDF</span>
                </div>
                <span className="text-[11px] font-normal text-slate-500 font-mono-tabular">
                  {yearFilter !== 'all' ? yearFilter : 'Wszystkie lata'}
                </span>
              </div>
              <button
                type="button"
                onClick={onGenerateBatchPdf}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 shrink-0" />
                <span className="tabular-nums truncate">
                  {activeSelectedCount > 0
                    ? `Jeden PDF · wybrane (${activeSelectedCount})`
                    : yearFilter !== 'all'
                      ? `Jeden PDF · ${yearFilter} (${reports.length})`
                      : `Jeden PDF · wszystkie (${reports.length})`}
                </span>
              </button>
            </div>
          )}
        </aside>

        {/* Right Detail Workspace */}
        <section className="flex-1 flex flex-col min-w-0 bg-slate-50/40">
          {!activeReport ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mb-3" />
              <h2 className="text-base font-semibold text-slate-900">
                Brak zbiorczego sprawozdania klasy do wyświetlenia
              </h2>
              <p className="mt-1 max-w-md text-xs md:text-sm text-slate-600">
                Gdy zaimportujesz podpisane paczki sprawozdań od nauczycieli, program automatycznie pogrupuje przedmioty, załączniki NKL/NDST oraz karty wychowawców według klas.
              </p>
            </div>
          ) : (
            <>
              {/* Class Header + View Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 md:px-6 py-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Zbiorcze sprawozdanie — Klasa {activeReport.className}
                  </h2>
                  <p className="text-xs text-slate-600">
                    {activeReport.schoolName || 'Szkoła'}
                    {' · '}
                    <span className="font-mono-tabular">
                      {activeReport.schoolYear || 'Wszystkie lata'}
                    </span>
                    {' · '}
                    Nauczyciele w zestawieniu: {activeReport.contributingTeachers.length}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPrintClass(activeReport)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-900" />
                    <span>Drukuj / PDF tej klasy</span>
                  </button>

                  <div className="inline-flex items-center rounded-lg bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setWorkspaceMode('summary')}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        workspaceMode === 'summary'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Zestawienie klasy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkspaceMode('preview')}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        workspaceMode === 'preview'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Podgląd A4</span>
                    </button>
                  </div>
                </div>
              </div>

              {workspaceMode === 'preview' ? (
                <div className="flex-1 overflow-auto bg-slate-100/90 p-4 md:p-6 custom-scrollbar">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-slate-600">
                        Podgląd wydruku A4:
                      </span>
                      <div className="inline-flex items-center rounded-md border border-slate-300 bg-white p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setPreviewScope('active')}
                          className={`rounded px-2 py-0.5 font-medium transition-colors cursor-pointer ${
                            previewScope === 'active'
                              ? 'bg-blue-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Klasa {activeReport.className}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewScope('batch')}
                          className={`rounded px-2 py-0.5 font-medium transition-colors cursor-pointer tabular-nums ${
                            previewScope === 'batch'
                              ? 'bg-blue-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {activeSelectedCount > 0
                            ? `Wybrane do PDF (${batchReports.length})`
                            : `Komplet klas (${batchReports.length})`}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white p-0.5 text-xs">
                      {[0.5, 0.72, 0.88, 1].map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => setPreviewZoom(z)}
                          className={`rounded px-2 py-0.5 font-mono-tabular transition-colors cursor-pointer ${
                            previewZoom === z
                              ? 'bg-blue-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {Math.round(z * 100)}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      style={{
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'top center',
                        width: '210mm',
                      }}
                    >
                      {previewReports.map((rep, index) => (
                        <ClassCollectivePrintSheet
                          key={`${rep.notesKey}:${index}`}
                          report={rep}
                          isLast={index === previewReports.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                  {/* KPI Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Przedmioty</p>
                      <p className="mt-1 text-xl font-bold text-slate-900 font-mono-tabular">
                        {activeReport.totals.subjectsCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Nauczyciele</p>
                      <p className="mt-1 text-xl font-bold text-slate-900 font-mono-tabular">
                        {activeReport.totals.teachersCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Oceny ndst</p>
                      <p className="mt-1 text-xl font-bold text-red-700 font-mono-tabular">
                        {activeReport.totals.totalFailingGrades}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Oceny celujące</p>
                      <p className="mt-1 text-xl font-bold text-emerald-700 font-mono-tabular">
                        {activeReport.totals.totalExcellentGrades}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Opóźnienia podstawy</p>
                      <p className="mt-1 text-xl font-bold text-amber-700 font-mono-tabular">
                        {activeReport.totals.delayedSubjectsCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Wnioski NKL / NDST</p>
                      <p className="mt-1 text-xl font-bold text-slate-900 font-mono-tabular">
                        {activeReport.totals.nklCount} / {activeReport.totals.ndstCount}
                      </p>
                    </div>
                  </div>

                  {/* Section 1: Subjects Table */}
                  <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="border-b border-slate-200 px-5 py-3.5">
                      <h3 className="text-sm font-semibold text-slate-900">
                        1. Efekty nauczania z przedmiotów w klasie {activeReport.className}
                      </h3>
                    </div>
                    {activeReport.subjectRows.length === 0 ? (
                      <div className="p-5 text-xs text-slate-500">
                        Brak zaimportowanych kart efektów nauczania dla tej klasy.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold text-slate-600">
                              <th className="px-4 py-2.5">Przedmiot</th>
                              <th className="px-4 py-2.5">Nauczyciel</th>
                              <th className="px-4 py-2.5">Program i podręcznik</th>
                              <th className="px-4 py-2.5">Realizacja podstawy</th>
                              <th className="px-3 py-2.5 text-center">Ndst</th>
                              <th className="px-3 py-2.5 text-center">Cel</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeReport.subjectRows.map((row) => (
                              <tr key={row.docId} className="align-top hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-semibold text-slate-900">
                                  {row.subject}
                                  <div className="text-[11px] font-normal text-slate-500">
                                    Semestr {row.semester}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-800">{row.teacherName}</td>
                                <td className="px-4 py-3 text-slate-700 space-y-0.5">
                                  {row.programNumber && (
                                    <div className="font-mono-tabular text-[11px]">
                                      Prog.: {row.programNumber}
                                    </div>
                                  )}
                                  {row.textbookTitle && <div>{row.textbookTitle}</div>}
                                  {row.textbookNumber && (
                                    <div className="font-mono-tabular text-[11px] text-slate-500">
                                      Nr dop.: {row.textbookNumber}
                                    </div>
                                  )}
                                  {!row.programNumber &&
                                    !row.textbookTitle &&
                                    !row.textbookNumber &&
                                    '—'}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`font-semibold ${
                                      row.curriculumStatus === 'opoznienie'
                                        ? 'text-amber-800'
                                        : 'text-slate-900'
                                    }`}
                                  >
                                    {CURRICULUM_STATUS_LABELS[row.curriculumStatus]}
                                  </span>
                                  {row.curriculumStatus !== 'na_biezaco' && row.curriculumScope && (
                                    <p className="text-[11px] text-slate-600 mt-0.5">
                                      Zakres: {row.curriculumScope}
                                    </p>
                                  )}
                                  {row.curriculumNotes && (
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {row.curriculumNotes}
                                    </p>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-center font-mono-tabular font-semibold text-slate-900">
                                  {row.failingGradesCount}
                                </td>
                                <td className="px-3 py-3 text-center font-mono-tabular font-semibold text-slate-900">
                                  {row.excellentGradesCount}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Section 2: NKL & NDST */}
                  <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="border-b border-slate-200 px-5 py-3.5">
                      <h3 className="text-sm font-semibold text-slate-900">
                        2. Powiązane uzasadnienia NKL i NDST ({activeReport.totals.nklCount + activeReport.totals.ndstCount})
                      </h3>
                    </div>
                    {activeReport.nklEntries.length === 0 && activeReport.ndstEntries.length === 0 ? (
                      <div className="p-5 text-xs text-slate-500">
                        Brak zaimportowanych uzasadnień nieklasyfikowania lub ocen niedostatecznych dla tej klasy.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {activeReport.nklEntries.map((entry) => (
                          <div key={entry.docId} className="px-5 py-3.5 text-xs space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-slate-900">
                                NKL · {entry.studentName} · {entry.subject}
                              </span>
                              <span className="font-mono-tabular text-slate-600">
                                Nieobecność: {entry.absencePercent || '—'}%
                                {entry.attachmentNumber ? ` · Zał. nr ${entry.attachmentNumber}` : ''}
                              </span>
                            </div>
                            <p className="text-slate-600">
                              Nauczyciel: {entry.teacherName} ·{' '}
                              {entry.classificationPeriod === 'roczne' ? 'Roczne' : 'Śródroczne'}
                            </p>
                            {entry.additionalJustification && (
                              <p className="text-slate-700">{entry.additionalJustification}</p>
                            )}
                          </div>
                        ))}
                        {activeReport.ndstEntries.map((entry) => (
                          <div key={entry.docId} className="px-5 py-3.5 text-xs space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-slate-900">
                                NDST · {entry.studentName} · {entry.subject}
                              </span>
                              <span className="font-mono-tabular text-slate-600">
                                Obserwacje: {entry.observationsCount} · Działania: {entry.teacherActionsCount}
                                {entry.attachmentNumber ? ` · Zał. nr ${entry.attachmentNumber}` : ''}
                              </span>
                            </div>
                            <p className="text-slate-600">
                              Nauczyciel: {entry.teacherName} ·{' '}
                              {entry.classificationPeriod === 'roczne' ? 'Roczne' : 'Śródroczne'}
                            </p>
                            {entry.curriculumGaps && (
                              <p className="text-slate-700">Braki: {entry.curriculumGaps}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Section 3: Homeroom & Class Conclusions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">
                        3. Karta informacyjna wychowawcy klasy
                      </h3>
                      {activeReport.homeroomEntries.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          Brak zaimportowanej karty informacyjnej z wychowawstwem klasy {activeReport.className}.
                        </p>
                      ) : (
                        <div className="space-y-3 text-xs text-slate-700">
                          {activeReport.homeroomEntries.map((h) => (
                            <div key={h.docId} className="space-y-1.5 border-t border-slate-100 pt-2 first:border-t-0 first:pt-0">
                              <p className="font-semibold text-slate-900">
                                {h.teacherName} {h.period ? `(${h.period})` : ''}
                              </p>
                              {h.studentAchievements && (
                                <p>
                                  <strong className="text-slate-800">Osiągnięcia:</strong>{' '}
                                  {h.studentAchievements}
                                </p>
                              )}
                              {h.tripsOrganization && (
                                <p>
                                  <strong className="text-slate-800">Wycieczki:</strong>{' '}
                                  {h.tripsOrganization}
                                </p>
                              )}
                              {h.statutoryActivities && (
                                <p>
                                  <strong className="text-slate-800">Działania statutowe:</strong>{' '}
                                  {h.statutoryActivities}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">
                        4. Wnioski nauczycieli do dalszej pracy
                      </h3>
                      {activeReport.subjectRows.filter((r) => r.futureConclusions).length === 0 ? (
                        <p className="text-xs text-slate-500">
                          Brak wpisanych wniosków do dalszej pracy w kartach tej klasy.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-xs text-slate-700">
                          {activeReport.subjectRows
                            .filter((r) => r.futureConclusions)
                            .map((r) => (
                              <li key={r.docId} className="rounded-lg bg-slate-50 p-2.5">
                                <span className="font-semibold text-slate-900">
                                  {r.subject} ({r.teacherName}, Sem. {r.semester}):
                                </span>{' '}
                                {r.futureConclusions}
                              </li>
                            ))}
                        </ul>
                      )}
                    </section>
                  </div>

                  {/* Section 4: Editable Director Notes */}
                  <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5">
                    <label
                      htmlFor="director-class-notes"
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Uwagi i zalecenia pokontrolne dyrektora dla klasy {activeReport.className}
                    </label>
                    <p className="text-xs text-slate-500">
                      Zapisywane automatycznie w przeglądarce i dołączane do wydruku A4 sprawozdania zbiorczego tej klasy.
                    </p>
                    <textarea
                      id="director-class-notes"
                      rows={4}
                      value={activeReport.directorNotes}
                      onChange={(e) =>
                        onUpdateClassNotes(activeReport.notesKey, e.target.value)
                      }
                      placeholder="Wpisz wnioski z nadzoru pedagogicznego, zalecenia dla zespołu nauczycieli klasy lub potwierdzenie realizacji podstawy programowej..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
                    />
                  </section>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

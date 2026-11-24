import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, FilePlus2, FileText, PanelRightClose, PanelRightOpen, Printer, UserCog } from 'lucide-react';
import { BackupJsonView } from './components/BackupJsonView';
import { ConclusionPickerModal } from './components/ConclusionPickerModal';
import { ConfirmModal } from './components/ConfirmModal';
import { DocumentSidebar } from './components/DocumentSidebar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProfileView } from './components/ProfileView';
import { TopBar } from './components/TopBar';
import { WnioskiDatabaseView } from './components/WnioskiDatabaseView';
import { EfektyNauczaniaForm } from './components/forms/EfektyNauczaniaForm';
import { KartaInformacyjnaForm } from './components/forms/KartaInformacyjnaForm';
import { PodsumowanieSpecjalistyForm } from './components/forms/PodsumowanieSpecjalistyForm';
import { ZbiorczeEfektyForm } from './components/forms/ZbiorczeEfektyForm';
import { PrintDocumentRenderer } from './components/print/PrintDocumentRenderer';
import { suggestCategoryIdForDocument } from './data/wnioskiDatabase';
import {
  AppState,
  DocumentType,
  MainTab,
  ReportDocument,
  SpecialistRole,
  TeacherProfile,
} from './types/reports';
import {
  clearDocumentFields,
  createDocumentByType,
  createId,
  createInitialAppState,
  duplicateDocument,
} from './utils/documentFactory';
import { loadAppState, saveAppState } from './utils/storage';
import { printElementIsolated } from './utils/printDocument';

type EditorLayoutMode = 'split' | 'editor' | 'preview';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<MainTab>('kreator');
  const [layoutMode, setLayoutMode] = useState<EditorLayoutMode>('split');
  const [printMode, setPrintMode] = useState<'active' | 'all'>('active');
  const [previewZoom, setPreviewZoom] = useState<number>(0.72);
  const [pickerOpen, setPickerOpen] = useState(false);
  const activePrintRef = useRef<HTMLDivElement | null>(null);
  const batchPrintRef = useRef<HTMLDivElement | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<
    | { kind: 'delete_doc'; doc: ReportDocument }
    | { kind: 'reset_doc'; doc: ReportDocument }
    | { kind: 'reset_all' }
    | null
  >(null);

  // Persist every change locally (Local-First)
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const activeDoc = useMemo(
    () => state.documents.find((d) => d.id === state.activeDocumentId) ?? state.documents[0] ?? null,
    [state.documents, state.activeDocumentId]
  );

  const suggestedCategory = useMemo(
    () => (activeDoc ? suggestCategoryIdForDocument(activeDoc) : null),
    [activeDoc]
  );

  const docsToPrint = useMemo(() => {
    if (printMode === 'all') return state.documents;
    return activeDoc ? [activeDoc] : [];
  }, [printMode, state.documents, activeDoc]);

  const updateProfile = (profile: TeacherProfile) => {
    setState((prev) => ({ ...prev, profile }));
  };

  const applyProfileToAllDocuments = () => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) => {
        const base = {
          ...doc,
          schoolName: prev.profile.schoolName || doc.schoolName,
          schoolYear: prev.profile.schoolYear || doc.schoolYear,
          signatureDate: prev.profile.signatureDate || doc.signatureDate,
          updatedAt: new Date().toISOString(),
        };
        if (base.type === 'efekty_nauczania') {
          return {
            ...base,
            teacherName: prev.profile.fullName || base.teacherName,
          };
        }
        if (base.type === 'zbiorcze_efekty') {
          return {
            ...base,
            coordinatorName: prev.profile.fullName || base.coordinatorName,
          };
        }
        if (base.type === 'karta_informacyjna') {
          return {
            ...base,
            teacherName: prev.profile.fullName || base.teacherName,
            period: prev.profile.periodText || base.period,
            homeroomClass: prev.profile.homeroomClass || base.homeroomClass,
          };
        }
        return {
          ...base,
          specialistName: prev.profile.fullName || base.specialistName,
        };
      }),
    }));
  };

  const handleUpdateDocument = (updated: ReportDocument) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === updated.id ? updated : d)),
    }));
  };

  const handleAddDocument = (
    type: DocumentType,
    options?: { specialistRole?: SpecialistRole; coordinatorMode?: 'przedmiotowy' | 'wczesnoszkolna' }
  ) => {
    const newDoc = createDocumentByType(type, state.profile, options);
    setState((prev) => ({
      ...prev,
      documents: [...prev.documents, newDoc],
      activeDocumentId: newDoc.id,
    }));
    setActiveTab('kreator');
  };

  const handleDuplicateDocument = (id: string) => {
    const target = state.documents.find((d) => d.id === id);
    if (!target) return;
    const copy = duplicateDocument(target);
    setState((prev) => ({
      ...prev,
      documents: [...prev.documents, copy],
      activeDocumentId: copy.id,
    }));
  };

  const handleInsertConclusion = (text: string, mode: 'append' | 'replace') => {
    if (!activeDoc) return;
    if (
      activeDoc.type === 'efekty_nauczania' ||
      activeDoc.type === 'zbiorcze_efekty' ||
      activeDoc.type === 'podsumowanie_specjalisty'
    ) {
      const current = activeDoc.futureConclusions.trim();
      const nextText =
        mode === 'replace' || !current ? text : `${current}\n${text}`;
      handleUpdateDocument({
        ...activeDoc,
        futureConclusions: nextText,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleAddCustomWniosek = (categoryId: string, text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    setState((prev) => ({
      ...prev,
      customWnioski: [
        {
          id: createId(),
          categoryId,
          text: cleaned,
          createdAt: new Date().toISOString(),
        },
        ...prev.customWnioski,
      ],
    }));
  };

  const handleDeleteCustomWniosek = (id: string) => {
    setState((prev) => ({
      ...prev,
      customWnioski: prev.customWnioski.filter((w) => w.id !== id),
    }));
  };

  const handleConfirmAction = () => {
    if (!confirmDialog) return;
    if (confirmDialog.kind === 'delete_doc') {
      const targetId = confirmDialog.doc.id;
      setState((prev) => {
        const remaining = prev.documents.filter((d) => d.id !== targetId);
        const nextActive =
          prev.activeDocumentId === targetId
            ? remaining[0]?.id ?? null
            : prev.activeDocumentId;
        return {
          ...prev,
          documents: remaining,
          activeDocumentId: nextActive,
        };
      });
    } else if (confirmDialog.kind === 'reset_doc') {
      const cleared = clearDocumentFields(confirmDialog.doc, state.profile);
      handleUpdateDocument(cleared);
    } else if (confirmDialog.kind === 'reset_all') {
      const fresh = createInitialAppState();
      setState(fresh);
      setActiveTab('kreator');
    }
    setConfirmDialog(null);
  };

  const handlePrintActiveDocument = () => {
    if (!activeDoc) return;
    printElementIsolated(
      activePrintRef.current,
      activeDoc.title || 'Sprawozdanie szkolne'
    );
  };

  const handlePrint = () => {
    if (docsToPrint.length === 0) return;
    if (printMode === 'active' && activeDoc) {
      handlePrintActiveDocument();
      return;
    }
    printElementIsolated(
      batchPrintRef.current,
      `Komplet sprawozdań (${docsToPrint.length})`
    );
  };

  const canInsertConclusionsToActive =
    !!activeDoc &&
    (activeDoc.type === 'efekty_nauczania' ||
      activeDoc.type === 'zbiorcze_efekty' ||
      activeDoc.type === 'podsumowanie_specjalisty');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onPrint={handlePrint}
        hasDocuments={docsToPrint.length > 0}
      />

      {/* Main Interactive Workspace (hidden when printing) */}
      <main className="flex-1 flex flex-col no-print">
        {activeTab === 'profil' && (
          <ProfileView
            profile={state.profile}
            documentsCount={state.documents.length}
            onChange={updateProfile}
            onApplyToAllDocuments={applyProfileToAllDocuments}
          />
        )}

        {activeTab === 'baza_wnioskow' && (
          <WnioskiDatabaseView
            customWnioski={state.customWnioski}
            canInsertIntoActive={canInsertConclusionsToActive}
            activeDocumentTitle={activeDoc?.title}
            onInsertToActive={(text) => handleInsertConclusion(text, 'append')}
            onAddCustomWniosek={handleAddCustomWniosek}
            onDeleteCustomWniosek={handleDeleteCustomWniosek}
          />
        )}

        {activeTab === 'kopia_json' && (
          <BackupJsonView
            state={state}
            onImportState={(nextState) => {
              setState(nextState);
              setActiveTab('kreator');
            }}
            onRequestFullReset={() => setConfirmDialog({ kind: 'reset_all' })}
          />
        )}

        {activeTab === 'kreator' && (
          <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto bg-white border-x border-slate-200/80">
            <DocumentSidebar
              documents={state.documents}
              activeDocumentId={activeDoc?.id ?? null}
              printMode={printMode}
              onChangePrintMode={setPrintMode}
              onSelectDocument={(id) =>
                setState((prev) => ({ ...prev, activeDocumentId: id }))
              }
              onAddDocument={handleAddDocument}
              onDuplicateDocument={handleDuplicateDocument}
              onRequestDeleteDocument={(doc) =>
                setConfirmDialog({ kind: 'delete_doc', doc })
              }
            />

            {/* Editor + Live Print Preview Workspace */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/40">
              {/* Workspace sub-toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 md:px-6 py-2.5">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  {!state.profile.fullName ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab('profil')}
                      className="inline-flex items-center gap-1.5 font-medium text-blue-900 hover:underline cursor-pointer"
                    >
                      <UserCog className="w-3.5 h-3.5" />
                      <span>Uzupełnij profil nauczyciela, aby automatycznie wypełniać karty</span>
                    </button>
                  ) : (
                    <span>
                      Profil: <strong className="text-slate-900">{state.profile.fullName}</strong>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>Zapisano lokalnie</span>
                    </span>
                  )}
                </div>

                {/* Layout mode segmented switcher + active document print */}
                <div className="flex items-center gap-2">
                  {activeDoc && (
                    <button
                      type="button"
                      onClick={handlePrintActiveDocument}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      title="Otwórz okno drukowania wyłącznie dla bieżącej karty"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-900" />
                      <span>Drukuj tę kartę</span>
                    </button>
                  )}
                  <div className="inline-flex items-center rounded-lg bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setLayoutMode('editor')}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        layoutMode === 'editor'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Formularz</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayoutMode('split')}
                      className={`hidden xl:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        layoutMode === 'split'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {layoutMode === 'split' ? (
                        <PanelRightClose className="w-3.5 h-3.5" />
                      ) : (
                        <PanelRightOpen className="w-3.5 h-3.5" />
                      )}
                      <span>Podgląd na żywo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayoutMode('preview')}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        layoutMode === 'preview'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Podgląd A4</span>
                    </button>
                  </div>
                </div>
              </div>

              {!activeDoc ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                  <FilePlus2 className="w-10 h-10 text-slate-300 mb-3" />
                  <h2 className="text-base font-semibold text-slate-900">
                    Brak aktywnego dokumentu
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-slate-600">
                    Wybierz typ dokumentu z panelu po lewej stronie, aby rozpocząć tworzenie sprawozdania.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAddDocument('efekty_nauczania')}
                    className="mt-4 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 cursor-pointer"
                  >
                    Utwórz pierwszą kartę efektów nauczania
                  </button>
                </div>
              ) : (
                <div
                  className={`flex-1 grid min-h-0 ${
                    layoutMode === 'split'
                      ? 'grid-cols-1 xl:grid-cols-2'
                      : 'grid-cols-1'
                  }`}
                >
                  {/* Form Editor Pane */}
                  {layoutMode !== 'preview' && (
                    <div className="overflow-y-auto p-5 md:p-8 bg-white border-r border-slate-200 custom-scrollbar">
                      <div className="mx-auto max-w-2xl">
                        {activeDoc.type === 'efekty_nauczania' && (
                          <EfektyNauczaniaForm
                            doc={activeDoc}
                            profile={state.profile}
                            onChange={handleUpdateDocument}
                            onOpenConclusionsPicker={() => setPickerOpen(true)}
                            onRequestReset={() =>
                              setConfirmDialog({ kind: 'reset_doc', doc: activeDoc })
                            }
                          />
                        )}
                        {activeDoc.type === 'zbiorcze_efekty' && (
                          <ZbiorczeEfektyForm
                            doc={activeDoc}
                            allDocuments={state.documents}
                            onChange={handleUpdateDocument}
                            onOpenConclusionsPicker={() => setPickerOpen(true)}
                            onRequestReset={() =>
                              setConfirmDialog({ kind: 'reset_doc', doc: activeDoc })
                            }
                          />
                        )}
                        {activeDoc.type === 'karta_informacyjna' && (
                          <KartaInformacyjnaForm
                            doc={activeDoc}
                            onChange={handleUpdateDocument}
                            onRequestReset={() =>
                              setConfirmDialog({ kind: 'reset_doc', doc: activeDoc })
                            }
                          />
                        )}
                        {activeDoc.type === 'podsumowanie_specjalisty' && (
                          <PodsumowanieSpecjalistyForm
                            doc={activeDoc}
                            onChange={handleUpdateDocument}
                            onOpenConclusionsPicker={() => setPickerOpen(true)}
                            onRequestReset={() =>
                              setConfirmDialog({ kind: 'reset_doc', doc: activeDoc })
                            }
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Live Print Preview Pane */}
                  {layoutMode !== 'editor' && (
                    <div className="overflow-auto bg-slate-100/90 p-4 md:p-6 custom-scrollbar">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-600">
                          Podgląd wydruku A4 ({printMode === 'all' ? `komplet: ${docsToPrint.length} dok.` : 'bieżąca karta'})
                        </span>
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
                          {docsToPrint.map((doc, index) => (
                            <PrintDocumentRenderer
                              key={doc.id}
                              doc={doc}
                              isLast={index === docsToPrint.length - 1}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Dedicated isolated print containers (separated from interactive UI) */}
      <div ref={activePrintRef} className="hidden" aria-hidden="true">
        {activeDoc && <PrintDocumentRenderer doc={activeDoc} isLast />}
      </div>

      <div id="print-area" ref={batchPrintRef} className="hidden print:block print-only-root">
        {docsToPrint.map((doc, index) => (
          <PrintDocumentRenderer
            key={doc.id}
            doc={doc}
            isLast={index === docsToPrint.length - 1}
          />
        ))}
      </div>

      {/* Modals & Offline Banner */}
      <ConclusionPickerModal
        isOpen={pickerOpen}
        suggestedCategoryId={suggestedCategory}
        customWnioski={state.customWnioski}
        onClose={() => setPickerOpen(false)}
        onInsert={handleInsertConclusion}
        onAddCustomWniosek={handleAddCustomWniosek}
        onDeleteCustomWniosek={handleDeleteCustomWniosek}
      />

      <ConfirmModal
        isOpen={!!confirmDialog}
        title={
          confirmDialog?.kind === 'delete_doc'
            ? 'Usunąć ten dokument?'
            : confirmDialog?.kind === 'reset_doc'
              ? 'Wyczyścić formularz tej karty?'
              : 'Wyczyścić wszystkie dane aplikacji?'
        }
        description={
          confirmDialog?.kind === 'delete_doc'
            ? `Dokument „${confirmDialog.doc.title}” zostanie trwale usunięty z bieżącej sesji.`
            : confirmDialog?.kind === 'reset_doc'
              ? 'Wszystkie wpisane w tej karcie odpowiedzi zostaną usunięte (dane z profilu pozostaną zachowane).'
              : 'Wszystkie dokumenty oraz ustawienia profilu zapisane w przeglądarce zostaną trwale usunięte. Zalecamy wcześniej pobrać kopię JSON.'
        }
        confirmLabel={
          confirmDialog?.kind === 'delete_doc'
            ? 'Usuń dokument'
            : confirmDialog?.kind === 'reset_doc'
              ? 'Wyczyść kartę'
              : 'Wyczyść wszystko'
        }
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog(null)}
      />

      <OfflineIndicator />
    </div>
  );
}

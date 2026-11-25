import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Eye,
  FilePlus2,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Printer,
  UserCog,
} from 'lucide-react';
import { AboutSection, AboutView } from './components/AboutView';
import { BackupJsonView } from './components/BackupJsonView';
import { ConclusionPickerModal } from './components/ConclusionPickerModal';
import { ConfirmModal } from './components/ConfirmModal';
import {
  DirectorSupervisionView,
  SupervisionImportFeedback,
} from './components/DirectorSupervisionView';
import { DocumentSidebar, DocumentSortOption } from './components/DocumentSidebar';
import { ExportSupervisionModal } from './components/ExportSupervisionModal';
import { NewYearRolloverModal } from './components/NewYearRolloverModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProfileView } from './components/ProfileView';
import { SaveTemplateModal } from './components/SaveTemplateModal';
import {
  PhrasesImportPayload,
  PhrasesImportSummary,
  SharePhrasesModal,
  SharePhrasesModalMode,
} from './components/SharePhrasesModal';
import { SupervisionDiffModal } from './components/SupervisionDiffModal';
import { TemplatePickerModal } from './components/TemplatePickerModal';
import { TopBar } from './components/TopBar';
import { WnioskiDatabaseView } from './components/WnioskiDatabaseView';
import { EfektyNauczaniaForm } from './components/forms/EfektyNauczaniaForm';
import { KartaInformacyjnaForm } from './components/forms/KartaInformacyjnaForm';
import { PodsumowanieSpecjalistyForm } from './components/forms/PodsumowanieSpecjalistyForm';
import { UzasadnienieNdstForm } from './components/forms/UzasadnienieNdstForm';
import { UzasadnienieNieklasyfikowaniaForm } from './components/forms/UzasadnienieNieklasyfikowaniaForm';
import { ZbiorczeEfektyForm } from './components/forms/ZbiorczeEfektyForm';
import { ClassCollectivePrintSheet } from './components/print/ClassCollectivePrintSheet';
import { PrintDocumentRenderer } from './components/print/PrintDocumentRenderer';
import {
  OpenSaveTemplateParams,
  OpenTemplatePickerParams,
  TemplatesProvider,
} from './context/TemplatesContext';
import { APP_VERSION } from './data/changelog';
import { suggestCategoryIdForDocument } from './data/wnioskiDatabase';
import {
  AppState,
  ClassificationPeriod,
  CustomTemplateEntry,
  DOCUMENT_TYPE_LABELS,
  DocumentType,
  MainTab,
  ReportDocument,
  SPECIALIST_ROLE_LABELS,
  SemesterType,
  SpecialistRole,
  TeacherProfile,
  TeacherSupervisionPackage,
  TemplateSectionCategory,
} from './types/reports';
import {
  clearDocumentFields,
  cloneDocumentsForNewSchoolYear,
  createDocumentByType,
  createId,
  createInitialAppState,
  duplicateDocument,
  findSubjectAssignment,
} from './utils/documentFactory';
import { triggerWindowPrint } from './utils/printDocument';
import {
  flushPendingAppStateSave,
  loadAppState,
  mergeImportedTemplates,
  mergeImportedWnioski,
  resetAllStoredState,
  saveAppStateImmediate,
  scheduleSaveAppState,
  StorageBackend,
  validateAndParseSupervisionPackageJson,
} from './utils/storage';
import {
  ClassCollectiveReport,
  PackageDiffResult,
  aggregateClassCollectiveReports,
  applySupervisionDiffDecisions,
  diffSupervisionPackage,
  getAvailableSupervisionYears,
  resolvePackageTeacherName,
} from './utils/supervision';

type EditorLayoutMode = 'split' | 'editor' | 'preview';

export default function App() {
  const [state, setState] = useState<AppState>(() => createInitialAppState());
  const [isHydrating, setIsHydrating] = useState(true);
  const [storageBackend, setStorageBackend] = useState<StorageBackend>('indexeddb');
  const hasHydratedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<MainTab>('kreator');
  const [aboutSection, setAboutSection] = useState<AboutSection>('info');
  const [layoutMode, setLayoutMode] = useState<EditorLayoutMode>('split');
  const [printMode, setPrintMode] = useState<'active' | 'all'>('active');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [sidebarSortBy, setSidebarSortBy] = useState<DocumentSortOption>('newest');
  const [selectedPrintIds, setSelectedPrintIds] = useState<string[]>([]);
  const [previewZoom, setPreviewZoom] = useState<number>(0.72);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rolloverOpen, setRolloverOpen] = useState(false);
  const [templatePickerTarget, setTemplatePickerTarget] =
    useState<OpenTemplatePickerParams | null>(null);
  const [saveTemplateDraft, setSaveTemplateDraft] =
    useState<OpenSaveTemplateParams | null>(null);
  const [sharePhrasesModalMode, setSharePhrasesModalMode] =
    useState<SharePhrasesModalMode | null>(null);
  const [exportSupervisionOpen, setExportSupervisionOpen] = useState(false);
  const [diffQueue, setDiffQueue] = useState<PackageDiffResult[]>([]);
  const [diffQueueTotal, setDiffQueueTotal] = useState(0);
  const [supervisionYearFilter, setSupervisionYearFilter] = useState<string>('all');
  const [supervisionSemesterFilter, setSupervisionSemesterFilter] = useState<'all' | SemesterType>(
    'all'
  );
  const [selectedSupervisionClass, setSelectedSupervisionClass] = useState<string | null>(null);
  const [selectedPrintClasses, setSelectedPrintClasses] = useState<string[]>([]);
  const [supervisionFeedback, setSupervisionFeedback] =
    useState<SupervisionImportFeedback | null>(null);

  const [printOverrideDocs, setPrintOverrideDocs] = useState<ReportDocument[] | null>(null);
  const [printSupervisionReports, setPrintSupervisionReports] = useState<
    ClassCollectiveReport[] | null
  >(null);

  const [confirmDialog, setConfirmDialog] = useState<
    | { kind: 'delete_doc'; doc: ReportDocument }
    | { kind: 'reset_doc'; doc: ReportDocument }
    | { kind: 'delete_supervision_pkg'; pkg: TeacherSupervisionPackage }
    | { kind: 'reset_all' }
    | null
  >(null);

  // Hydrate initial state asynchronously from IndexedDB (migrating legacy localStorage if present)
  useEffect(() => {
    let active = true;
    void loadAppState().then(({ state: loaded, backend }) => {
      if (!active) return;
      hasHydratedRef.current = true;
      setState(loaded);
      setStorageBackend(backend);
      setIsHydrating(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist changes incrementally to IndexedDB (only after initial hydration)
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    scheduleSaveAppState(state);
  }, [state]);

  // Flush any debounced writes before page hide / unload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingAppStateSave();
      }
    };
    const handlePageHide = () => {
      flushPendingAppStateSave();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      flushPendingAppStateSave();
    };
  }, []);

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    if (state.profile.schoolYear.trim()) {
      set.add(state.profile.schoolYear.trim());
    }
    for (const d of state.documents) {
      set.add(d.schoolYear?.trim() || 'Bez roku');
    }
    return Array.from(set).sort((a, b) => {
      if (a === state.profile.schoolYear.trim() && b !== a) return -1;
      if (b === state.profile.schoolYear.trim() && a !== b) return 1;
      if (a === 'Bez roku') return 1;
      if (b === 'Bez roku') return -1;
      return b.localeCompare(a, 'pl');
    });
  }, [state.documents, state.profile.schoolYear]);

  const yearScopedDocuments = useMemo(() => {
    if (yearFilter === 'all') return state.documents;
    return state.documents.filter(
      (d) => (d.schoolYear?.trim() || 'Bez roku') === yearFilter
    );
  }, [state.documents, yearFilter]);

  const sidebarFilteredDocuments = useMemo(() => {
    const q = sidebarSearchQuery.trim().toLowerCase();
    const filtered = state.documents.filter((doc) => {
      const docYear = doc.schoolYear?.trim() || 'Bez roku';
      if (yearFilter !== 'all' && docYear !== yearFilter) {
        return false;
      }
      if (!q) return true;
      const title = (doc.title || '').toLowerCase();
      const typeLabel = DOCUMENT_TYPE_LABELS[doc.type].toLowerCase();
      const roleLabel =
        doc.type === 'podsumowanie_specjalisty'
          ? SPECIALIST_ROLE_LABELS[doc.role].toLowerCase()
          : '';
      return (
        title.includes(q) ||
        typeLabel.includes(q) ||
        roleLabel.includes(q) ||
        docYear.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sidebarSortBy === 'title_asc') {
        const titleA = (a.title || DOCUMENT_TYPE_LABELS[a.type]).trim();
        const titleB = (b.title || DOCUMENT_TYPE_LABELS[b.type]).trim();
        return titleA.localeCompare(titleB, 'pl', { sensitivity: 'base', numeric: true });
      }
      const timeA = Date.parse(a.createdAt) || 0;
      const timeB = Date.parse(b.createdAt) || 0;
      if (timeA !== timeB) {
        return sidebarSortBy === 'newest' ? timeB - timeA : timeA - timeB;
      }
      const titleA = (a.title || DOCUMENT_TYPE_LABELS[a.type]).trim();
      const titleB = (b.title || DOCUMENT_TYPE_LABELS[b.type]).trim();
      return titleA.localeCompare(titleB, 'pl', { sensitivity: 'base', numeric: true });
    });
  }, [state.documents, yearFilter, sidebarSearchQuery, sidebarSortBy]);

  const selectedBatchDocuments = useMemo(() => {
    if (selectedPrintIds.length === 0) return [];
    const selectedSet = new Set(selectedPrintIds);
    return sidebarFilteredDocuments.filter((d) => selectedSet.has(d.id));
  }, [sidebarFilteredDocuments, selectedPrintIds]);

  const batchDocuments = useMemo(
    () =>
      selectedBatchDocuments.length > 0
        ? selectedBatchDocuments
        : sidebarFilteredDocuments,
    [selectedBatchDocuments, sidebarFilteredDocuments]
  );

  const activeDoc = useMemo(
    () =>
      state.documents.find((d) => d.id === state.activeDocumentId) ??
      yearScopedDocuments[0] ??
      state.documents[0] ??
      null,
    [state.documents, state.activeDocumentId, yearScopedDocuments]
  );

  const suggestedCategory = useMemo(
    () => (activeDoc ? suggestCategoryIdForDocument(activeDoc) : null),
    [activeDoc]
  );

  const docsToPrint = useMemo(() => {
    if (printMode === 'all') return batchDocuments;
    return activeDoc ? [activeDoc] : [];
  }, [printMode, batchDocuments, activeDoc]);

  const availableSupervisionYears = useMemo(
    () => getAvailableSupervisionYears(state.supervisionPackages),
    [state.supervisionPackages]
  );

  const supervisionReports = useMemo(
    () =>
      aggregateClassCollectiveReports(
        state.supervisionPackages,
        state.supervisionClassNotes,
        {
          schoolYear: supervisionYearFilter,
          semester: supervisionSemesterFilter,
        }
      ),
    [
      state.supervisionPackages,
      state.supervisionClassNotes,
      supervisionYearFilter,
      supervisionSemesterFilter,
    ]
  );

  const supervisionBatchReports = useMemo(() => {
    if (selectedPrintClasses.length === 0) return supervisionReports;
    const pickedSet = new Set(selectedPrintClasses);
    const filtered = supervisionReports.filter((r) => pickedSet.has(r.className));
    return filtered.length > 0 ? filtered : supervisionReports;
  }, [supervisionReports, selectedPrintClasses]);

  const updateProfile = (profile: TeacherProfile) => {
    setState((prev) => ({ ...prev, profile }));
  };

  const applyProfileToAllDocuments = () => {
    setState((prev) => {
      const targetYear = prev.profile.schoolYear.trim();
      return {
        ...prev,
        documents: prev.documents.map((doc) => {
          // Protect archived cards from previous school years from being overwritten
          const isCurrentOrUnassignedYear =
            !targetYear || !doc.schoolYear.trim() || doc.schoolYear.trim() === targetYear;
          if (!isCurrentOrUnassignedYear) {
            return doc;
          }

          const base = {
            ...doc,
            schoolName: prev.profile.schoolName || doc.schoolName,
            schoolYear: doc.schoolYear || targetYear,
            signatureDate: prev.profile.signatureDate || doc.signatureDate,
            updatedAt: new Date().toISOString(),
          };

          if (base.type === 'efekty_nauczania') {
            const assignment = findSubjectAssignment(prev.profile, base.subject, base.className);
            return {
              ...base,
              teacherName: prev.profile.fullName || base.teacherName,
              programNumber: assignment?.programNumber || base.programNumber,
              textbookNumber: assignment?.textbookNumber || base.textbookNumber || '',
              textbookTitle: assignment?.textbookTitle || base.textbookTitle,
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
          if (
            base.type === 'uzasadnienie_nieklasyfikowania' ||
            base.type === 'uzasadnienie_ndst'
          ) {
            return {
              ...base,
              teacherName: prev.profile.fullName || base.teacherName,
            };
          }
          return {
            ...base,
            specialistName: prev.profile.fullName || base.specialistName,
          };
        }),
      };
    });
  };

  const handleUpdateDocument = (updated: ReportDocument) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === updated.id ? updated : d)),
    }));
  };

  const handleAddDocument = (
    type: DocumentType,
    options?: {
      specialistRole?: SpecialistRole;
      coordinatorMode?: 'przedmiotowy' | 'wczesnoszkolna';
      classificationPeriod?: ClassificationPeriod;
    }
  ) => {
    const targetSchoolYear =
      yearFilter !== 'all' && yearFilter !== 'Bez roku'
        ? yearFilter
        : state.profile.schoolYear;
    const newDoc = createDocumentByType(type, state.profile, {
      ...options,
      schoolYear: targetSchoolYear,
    });
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

  const handleChangeYearFilter = (nextYear: string) => {
    setYearFilter(nextYear);
    setSelectedPrintIds([]);
    if (nextYear !== 'all') {
      const firstInYear = state.documents.find(
        (d) => (d.schoolYear?.trim() || 'Bez roku') === nextYear
      );
      if (
        firstInYear &&
        activeDoc &&
        (activeDoc.schoolYear?.trim() || 'Bez roku') !== nextYear
      ) {
        setState((prev) => ({ ...prev, activeDocumentId: firstInYear.id }));
      }
    }
  };

  const handleTogglePrintSelect = (id: string) => {
    setSelectedPrintIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllFiltered = () => {
    const filteredIds = sidebarFilteredDocuments.map((d) => d.id);
    if (filteredIds.length === 0) return;
    setSelectedPrintIds(filteredIds);
  };

  const handleClearPrintSelection = () => {
    setSelectedPrintIds([]);
  };

  const handleRolloverToNewYear = (params: {
    sourceDocIds: string[];
    targetYear: string;
    targetSemester: SemesterType;
    mode: 'clean_base' | 'full_copy';
    carryOverConclusions: boolean;
  }) => {
    const sourceDocs = state.documents.filter((d) => params.sourceDocIds.includes(d.id));
    if (sourceDocs.length === 0) return;

    const clonedDocs = cloneDocumentsForNewSchoolYear(
      sourceDocs,
      {
        targetYear: params.targetYear,
        targetSemester: params.targetSemester,
        mode: params.mode,
        carryOverConclusions: params.carryOverConclusions,
      },
      state.profile
    );

    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        schoolYear: params.targetYear,
        defaultSemester: params.targetSemester,
      },
      documents: [...clonedDocs, ...prev.documents],
      activeDocumentId: clonedDocs[0]?.id ?? prev.activeDocumentId,
    }));
    setYearFilter(params.targetYear);
    setActiveTab('kreator');
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

  const handleAddCustomTemplate = (
    title: string,
    category: TemplateSectionCategory,
    content: string
  ) => {
    const cleanedContent = content.trim();
    if (!cleanedContent) return;
    const cleanedTitle = title.trim() || cleanedContent.slice(0, 48);
    setState((prev) => ({
      ...prev,
      customTemplates: [
        {
          id: createId(),
          title: cleanedTitle,
          category,
          content: cleanedContent,
          createdAt: new Date().toISOString(),
        },
        ...prev.customTemplates,
      ],
    }));
  };

  const handleUpdateCustomTemplate = (
    id: string,
    patch: Partial<Pick<CustomTemplateEntry, 'title' | 'category' | 'content'>>
  ) => {
    setState((prev) => ({
      ...prev,
      customTemplates: prev.customTemplates.map((tpl) =>
        tpl.id === id ? { ...tpl, ...patch } : tpl
      ),
    }));
  };

  const handleDeleteCustomTemplate = (id: string) => {
    setState((prev) => ({
      ...prev,
      customTemplates: prev.customTemplates.filter((tpl) => tpl.id !== id),
    }));
  };

  const handleImportPhrases = (payload: PhrasesImportPayload): PhrasesImportSummary => {
    const wnioskiOutcome = payload.includeWnioski
      ? mergeImportedWnioski(state.customWnioski, payload.incomingWnioski, payload.mode)
      : { entries: state.customWnioski, added: 0, skippedDuplicates: 0 };
    const templatesOutcome = payload.includeTemplates
      ? mergeImportedTemplates(state.customTemplates, payload.incomingTemplates, payload.mode)
      : { entries: state.customTemplates, added: 0, skippedDuplicates: 0 };

    setState((prev) => ({
      ...prev,
      customWnioski: wnioskiOutcome.entries,
      customTemplates: templatesOutcome.entries,
    }));

    return {
      addedWnioski: wnioskiOutcome.added,
      addedTemplates: templatesOutcome.added,
      skippedDuplicates: wnioskiOutcome.skippedDuplicates + templatesOutcome.skippedDuplicates,
    };
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
    } else if (confirmDialog.kind === 'delete_supervision_pkg') {
      const targetId = confirmDialog.pkg.id;
      setState((prev) => ({
        ...prev,
        supervisionPackages: prev.supervisionPackages.filter((p) => p.id !== targetId),
      }));
      setSupervisionFeedback({
        type: 'info',
        message: `Usunięto paczkę nauczyciela „${resolvePackageTeacherName(confirmDialog.pkg)}” i przeliczono sprawozdania klas.`,
      });
    } else if (confirmDialog.kind === 'reset_all') {
      const fresh = createInitialAppState();
      setState(fresh);
      setYearFilter('all');
      setActiveTab('kreator');
      void resetAllStoredState(fresh);
    }
    setConfirmDialog(null);
  };

  const handleImportSupervisionFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const workingPackages = [...state.supervisionPackages];
    const newDiffs: PackageDiffResult[] = [];
    let addedCount = 0;
    let unchangedCount = 0;
    const errors: string[] = [];

    const findExistingIndex = (incoming: TeacherSupervisionPackage): number => {
      const byKey = workingPackages.findIndex((p) => p.teacherKey === incoming.teacherKey);
      if (byKey !== -1) return byKey;
      const normName = resolvePackageTeacherName(incoming).trim().toLowerCase();
      if (!normName || normName.startsWith('nauczyciel (brak')) return -1;
      const normSchool = incoming.schoolName.trim().toLowerCase();
      return workingPackages.findIndex((p) => {
        const pName = resolvePackageTeacherName(p).trim().toLowerCase();
        const pSchool = p.schoolName.trim().toLowerCase();
        return pName === normName && (!normSchool || !pSchool || pSchool === normSchool);
      });
    };

    for (const file of fileArray) {
      try {
        const text = await file.text();
        const parsed = validateAndParseSupervisionPackageJson(text);
        if (!parsed.ok) {
          errors.push(`${file.name}: ${parsed.error}`);
          continue;
        }
        const incoming = parsed.pkg;
        const existingIdx = findExistingIndex(incoming);
        if (existingIdx === -1) {
          workingPackages.push(incoming);
          addedCount += 1;
        } else {
          const existingPkg = workingPackages[existingIdx];
          const diff = diffSupervisionPackage(existingPkg, incoming);
          if (diff.hasAnyChanges) {
            newDiffs.push(diff);
          } else {
            workingPackages[existingIdx] = {
              ...existingPkg,
              importedAt: new Date().toISOString(),
            };
            unchangedCount += 1;
          }
        }
      } catch {
        errors.push(`${file.name}: Nie udało się odczytać pliku.`);
      }
    }

    if (addedCount > 0 || unchangedCount > 0) {
      setState((prev) => ({
        ...prev,
        supervisionPackages: workingPackages,
      }));
    }

    if (newDiffs.length > 0) {
      setDiffQueue((prev) => {
        const combined = [...prev, ...newDiffs];
        setDiffQueueTotal(combined.length);
        return combined;
      });
    }

    if (errors.length > 0 && addedCount === 0 && newDiffs.length === 0 && unchangedCount === 0) {
      setSupervisionFeedback({
        type: 'error',
        message: errors[0],
      });
    } else {
      const parts: string[] = [];
      if (addedCount > 0) parts.push(`dodano nowe paczki: ${addedCount}`);
      if (newDiffs.length > 0) parts.push(`do porównania wersji: ${newDiffs.length}`);
      if (unchangedCount > 0) parts.push(`bez zmian w treści: ${unchangedCount}`);
      if (errors.length > 0) parts.push(`błędne pliki: ${errors.length}`);
      setSupervisionFeedback({
        type: errors.length > 0 ? 'info' : 'success',
        message: `Zakończono import plików (${parts.join(', ')}). Zestawienia klasowe zostały zaktualizowane.`,
      });
    }
  };

  const handleResolveSupervisionDiff = (decisions: Record<string, 'incoming' | 'existing'>) => {
    const currentDiff = diffQueue[0];
    if (!currentDiff) return;
    const mergedPkg = applySupervisionDiffDecisions(currentDiff, decisions);
    setState((prev) => ({
      ...prev,
      supervisionPackages: prev.supervisionPackages.map((p) =>
        p.id === mergedPkg.id ? mergedPkg : p
      ),
    }));
    setDiffQueue((prev) => prev.slice(1));
    setSupervisionFeedback({
      type: 'success',
      message: `Zastosowano wybrane zmiany dla nauczyciela „${resolvePackageTeacherName(mergedPkg)}” i przeliczono klasy.`,
    });
  };

  const handleSkipSupervisionDiff = () => {
    setDiffQueue((prev) => prev.slice(1));
  };

  const handleUpdateSupervisionClassNotes = (notesKey: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      supervisionClassNotes: {
        ...prev.supervisionClassNotes,
        [notesKey]: notes,
      },
    }));
  };

  const handleTogglePrintSupervisionClass = (className: string) => {
    setSelectedPrintClasses((prev) =>
      prev.includes(className)
        ? prev.filter((item) => item !== className)
        : [...prev, className]
    );
  };

  const handleToggleSelectAllSupervisionClasses = () => {
    if (supervisionReports.length === 0) return;
    setSelectedPrintClasses(supervisionReports.map((r) => r.className));
  };

  const handleClearPrintSupervisionClasses = () => {
    setSelectedPrintClasses([]);
  };

  const handleChangeSupervisionYearFilter = (nextYear: string) => {
    setSupervisionYearFilter(nextYear);
    setSelectedPrintClasses([]);
  };

  const handleChangeSupervisionSemesterFilter = (nextSemester: 'all' | SemesterType) => {
    setSupervisionSemesterFilter(nextSemester);
    setSelectedPrintClasses([]);
  };

  const handlePrintSupervisionClass = (report: ClassCollectiveReport) => {
    flushSync(() => {
      setPrintOverrideDocs(null);
      setPrintSupervisionReports([report]);
    });
    const yearSuffix = supervisionYearFilter !== 'all' ? ` (${supervisionYearFilter})` : '';
    triggerWindowPrint(
      `Zbiorcze sprawozdanie - Klasa ${report.className}${yearSuffix}`,
      () => {
        setPrintSupervisionReports(null);
      }
    );
  };

  const handlePrintAllSupervisionClasses = () => {
    if (supervisionBatchReports.length === 0) return;
    flushSync(() => {
      setPrintOverrideDocs(null);
      setPrintSupervisionReports(supervisionBatchReports);
    });
    const yearSuffix =
      supervisionYearFilter !== 'all' ? ` - Rok ${supervisionYearFilter}` : '';
    const classesSummary =
      selectedPrintClasses.length > 0 && supervisionBatchReports.length <= 5
        ? ` [${supervisionBatchReports.map((r) => r.className).join(', ')}]`
        : '';
    triggerWindowPrint(
      `Zbiorcze sprawozdania klas${yearSuffix}${classesSummary} (${supervisionBatchReports.length})`,
      () => {
        setPrintSupervisionReports(null);
      }
    );
  };

  const handlePrintActiveDocument = () => {
    if (!activeDoc) return;
    flushSync(() => {
      setPrintSupervisionReports(null);
      setPrintOverrideDocs([activeDoc]);
    });
    triggerWindowPrint(activeDoc.title || 'Sprawozdanie szkolne', () => {
      setPrintOverrideDocs(null);
    });
  };

  const handlePrintBatch = () => {
    if (batchDocuments.length === 0) return;
    const yearSuffix = yearFilter !== 'all' ? ` (${yearFilter})` : '';
    flushSync(() => {
      setPrintSupervisionReports(null);
      setPrintOverrideDocs(batchDocuments);
    });
    triggerWindowPrint(
      `Komplet sprawozdań${yearSuffix} - ${batchDocuments.length} dok.`,
      () => {
        setPrintOverrideDocs(null);
      }
    );
  };

  const handlePrint = () => {
    if (activeTab === 'nadzor') {
      handlePrintAllSupervisionClasses();
      return;
    }
    if (docsToPrint.length === 0) return;
    if (printMode === 'active' && activeDoc) {
      handlePrintActiveDocument();
      return;
    }
    const yearSuffix = yearFilter !== 'all' ? ` (${yearFilter})` : '';
    flushSync(() => {
      setPrintSupervisionReports(null);
      setPrintOverrideDocs(null);
    });
    triggerWindowPrint(
      `Komplet sprawozdań${yearSuffix} - ${docsToPrint.length} dok.`
    );
  };

  const renderedPrintDocs = printOverrideDocs ?? docsToPrint;

  const canInsertConclusionsToActive =
    !!activeDoc &&
    (activeDoc.type === 'efekty_nauczania' ||
      activeDoc.type === 'zbiorcze_efekty' ||
      activeDoc.type === 'podsumowanie_specjalisty');

  const hasPrintableContent =
    activeTab === 'nadzor' ? supervisionReports.length > 0 : docsToPrint.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onPrint={handlePrint}
        hasDocuments={hasPrintableContent}
      />

      {/* Main Interactive Workspace (hidden when printing) */}
      <main className="flex-1 flex flex-col no-print">
        {isHydrating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-blue-900 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-800">
              Wczytywanie lokalnego archiwum (IndexedDB)…
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Wszystkie dokumenty są przechowywane bezpiecznie w pamięci przeglądarki.
            </p>
          </div>
        ) : (
          <>
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
            customTemplates={state.customTemplates}
            canInsertIntoActive={canInsertConclusionsToActive}
            activeDocumentTitle={activeDoc?.title}
            onInsertToActive={(text) => handleInsertConclusion(text, 'append')}
            onAddCustomWniosek={handleAddCustomWniosek}
            onDeleteCustomWniosek={handleDeleteCustomWniosek}
            onAddCustomTemplate={handleAddCustomTemplate}
            onUpdateCustomTemplate={handleUpdateCustomTemplate}
            onDeleteCustomTemplate={handleDeleteCustomTemplate}
            onOpenShareModal={(mode) => setSharePhrasesModalMode(mode)}
          />
        )}

        {activeTab === 'nadzor' && (
          <DirectorSupervisionView
            packages={state.supervisionPackages}
            reports={supervisionReports}
            availableYears={availableSupervisionYears}
            yearFilter={supervisionYearFilter}
            semesterFilter={supervisionSemesterFilter}
            selectedClassName={selectedSupervisionClass}
            selectedPrintClasses={selectedPrintClasses}
            importFeedback={supervisionFeedback}
            onChangeYearFilter={handleChangeSupervisionYearFilter}
            onChangeSemesterFilter={handleChangeSupervisionSemesterFilter}
            onSelectClass={setSelectedSupervisionClass}
            onTogglePrintClass={handleTogglePrintSupervisionClass}
            onToggleSelectAllClasses={handleToggleSelectAllSupervisionClasses}
            onClearPrintClasses={handleClearPrintSupervisionClasses}
            onImportFiles={(files) => {
              void handleImportSupervisionFiles(files);
            }}
            onUpdateClassNotes={handleUpdateSupervisionClassNotes}
            onRequestDeletePackage={(pkg) =>
              setConfirmDialog({ kind: 'delete_supervision_pkg', pkg })
            }
            onPrintClass={handlePrintSupervisionClass}
            onGenerateBatchPdf={handlePrintAllSupervisionClasses}
          />
        )}

        {activeTab === 'kopia_json' && (
          <BackupJsonView
            state={state}
            onImportState={(nextState) => {
              setState(nextState);
              setYearFilter('all');
              setActiveTab('kreator');
              void saveAppStateImmediate(nextState, { replaceAll: true });
            }}
            onRequestFullReset={() => setConfirmDialog({ kind: 'reset_all' })}
            onOpenShareModal={(mode) => setSharePhrasesModalMode(mode)}
            onOpenSupervisionExport={() => setExportSupervisionOpen(true)}
            onGoToSupervision={() => setActiveTab('nadzor')}
          />
        )}

        {activeTab === 'o_programie' && (
          <AboutView
            activeSection={aboutSection}
            onChangeSection={setAboutSection}
          />
        )}

        {activeTab === 'kreator' && (
          <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto bg-white border-x border-slate-200/80">
            <DocumentSidebar
              documents={state.documents}
              filteredDocuments={sidebarFilteredDocuments}
              activeDocumentId={activeDoc?.id ?? null}
              availableYears={availableYears}
              yearFilter={yearFilter}
              searchQuery={sidebarSearchQuery}
              sortBy={sidebarSortBy}
              currentProfileYear={state.profile.schoolYear.trim()}
              printMode={printMode}
              selectedPrintIds={selectedPrintIds}
              batchDocumentsCount={batchDocuments.length}
              selectedBatchCount={selectedBatchDocuments.length}
              onChangeYearFilter={handleChangeYearFilter}
              onChangeSearchQuery={setSidebarSearchQuery}
              onChangeSortBy={setSidebarSortBy}
              onChangePrintMode={setPrintMode}
              onTogglePrintSelect={handleTogglePrintSelect}
              onToggleSelectAllFiltered={handleToggleSelectAllFiltered}
              onClearPrintSelection={handleClearPrintSelection}
              onPrintBatch={handlePrintBatch}
              onSelectDocument={(id) =>
                setState((prev) => ({ ...prev, activeDocumentId: id }))
              }
              onAddDocument={handleAddDocument}
              onDuplicateDocument={handleDuplicateDocument}
              onRequestDeleteDocument={(doc) =>
                setConfirmDialog({ kind: 'delete_doc', doc })
              }
              onOpenNewYearModal={() => setRolloverOpen(true)}
              onOpenSupervisionExport={() => setExportSupervisionOpen(true)}
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
                      <span>
                        {storageBackend === 'indexeddb'
                          ? 'Zapisano w IndexedDB'
                          : 'Tryb tymczasowy (IndexedDB zablokowane)'}
                      </span>
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
                    Wybierz typ dokumentu z panelu po lewej stronie lub przenieś wybrane karty z poprzedniego roku szkolnego.
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
                        <TemplatesProvider
                          value={{
                            templatesCount: state.customTemplates.length,
                            openTemplatePicker: setTemplatePickerTarget,
                            openSaveTemplate: setSaveTemplateDraft,
                          }}
                        >
                          {activeDoc.type === 'efekty_nauczania' && (
                            <EfektyNauczaniaForm
                              doc={activeDoc}
                              profile={state.profile}
                              availableYears={availableYears}
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
                              profile={state.profile}
                              availableYears={availableYears}
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
                              profile={state.profile}
                              onChange={handleUpdateDocument}
                              onRequestReset={() =>
                                setConfirmDialog({ kind: 'reset_doc', doc: activeDoc })
                              }
                            />
                          )}
                          {activeDoc.type === 'podsumowanie_specjalisty' && (
                            <PodsumowanieSpecjalistyForm
                              doc={activeDoc}
                              profile={state.profile}
                              availableYears={availableYears}
                              onChange={handleUpdateDocument}
                              onOpenConclusionsPicker={() => setPickerOpen(true)}
                              onRequestReset={() =>
                                setConfirmDialog({ kind: 'reset_doc', doc: activeDoc })
                              }
                            />
                          )}
                          {activeDoc.type === 'uzasadnienie_nieklasyfikowania' && (
                            <UzasadnienieNieklasyfikowaniaForm
                              doc={activeDoc}
                              profile={state.profile}
                              availableYears={availableYears}
                              onChange={handleUpdateDocument}
                              onRequestReset={() =>
                                setConfirmDialog({ kind: 'reset_doc', doc: activeDoc })
                              }
                            />
                          )}
                          {activeDoc.type === 'uzasadnienie_ndst' && (
                            <UzasadnienieNdstForm
                              doc={activeDoc}
                              profile={state.profile}
                              availableYears={availableYears}
                              onChange={handleUpdateDocument}
                              onRequestReset={() =>
                                setConfirmDialog({ kind: 'reset_doc', doc: activeDoc })
                              }
                            />
                          )}
                        </TemplatesProvider>
                      </div>
                    </div>
                  )}

                  {/* Live Print Preview Pane */}
                  {layoutMode !== 'editor' && (
                    <div className="overflow-auto bg-slate-100/90 p-4 md:p-6 custom-scrollbar">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-600">
                          Podgląd wydruku A4 (
                          {printMode === 'all'
                            ? `komplet${yearFilter !== 'all' ? ` ${yearFilter}` : ''}: ${docsToPrint.length} dok.`
                            : 'bieżąca karta'}
                          )
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
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 md:px-6 py-2.5 text-xs text-slate-500 no-print">
        <div className="mx-auto flex max-w-[1440px] flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-center sm:text-left">
            © 2026 <strong className="font-medium text-slate-700">mgr Krzysztof Jureczek</strong> · E-Sprawozdania <span className="font-mono-tabular">v{APP_VERSION}</span> · Bezpłatnie dla nauczycieli i edukacji (WLDE)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setAboutSection('info');
                setActiveTab('o_programie');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-blue-900 hover:underline cursor-pointer"
            >
              O programie
            </button>
            <button
              type="button"
              onClick={() => {
                setAboutSection('changelog');
                setActiveTab('o_programie');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-blue-900 hover:underline cursor-pointer"
            >
              Historia zmian
            </button>
            <button
              type="button"
              onClick={() => {
                setAboutSection('regulamin');
                setActiveTab('o_programie');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-blue-900 hover:underline cursor-pointer"
            >
              Regulamin i Prywatność
            </button>
            <button
              type="button"
              onClick={() => {
                setAboutSection('licencja');
                setActiveTab('o_programie');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-blue-900 hover:underline cursor-pointer"
            >
              Licencja WLDE
            </button>
          </div>
        </div>
      </footer>

      {/* Dedicated print-only container using loaded styles & @media print */}
      <div id="print-area" className="hidden print:block print-only-root">
        {printSupervisionReports !== null
          ? printSupervisionReports.map((report, index) => (
              <ClassCollectivePrintSheet
                key={`${report.notesKey}:${index}`}
                report={report}
                isLast={index === printSupervisionReports.length - 1}
              />
            ))
          : renderedPrintDocs.map((doc, index) => (
              <PrintDocumentRenderer
                key={doc.id}
                doc={doc}
                isLast={index === renderedPrintDocs.length - 1}
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

      <TemplatePickerModal
        isOpen={templatePickerTarget !== null}
        fieldLabel={templatePickerTarget?.fieldLabel ?? ''}
        suggestedCategory={templatePickerTarget?.suggestedCategory ?? 'ogolne'}
        customTemplates={state.customTemplates}
        onClose={() => setTemplatePickerTarget(null)}
        onInsert={(text, mode) => templatePickerTarget?.onApply(text, mode)}
        onAddTemplate={handleAddCustomTemplate}
        onDeleteTemplate={handleDeleteCustomTemplate}
      />

      <SaveTemplateModal
        isOpen={saveTemplateDraft !== null}
        fieldLabel={saveTemplateDraft?.fieldLabel ?? ''}
        initialContent={saveTemplateDraft?.initialContent ?? ''}
        suggestedCategory={saveTemplateDraft?.suggestedCategory ?? 'ogolne'}
        fromSelection={saveTemplateDraft?.fromSelection ?? false}
        onClose={() => setSaveTemplateDraft(null)}
        onSave={handleAddCustomTemplate}
      />

      <SharePhrasesModal
        isOpen={sharePhrasesModalMode !== null}
        initialMode={sharePhrasesModalMode ?? 'export'}
        customWnioski={state.customWnioski}
        customTemplates={state.customTemplates}
        onClose={() => setSharePhrasesModalMode(null)}
        onImportPhrases={handleImportPhrases}
      />

      <ExportSupervisionModal
        isOpen={exportSupervisionOpen}
        profile={state.profile}
        documents={state.documents}
        availableYears={availableYears}
        defaultYearFilter={yearFilter}
        onClose={() => setExportSupervisionOpen(false)}
        onUpdateProfileName={(fullName) =>
          updateProfile({ ...state.profile, fullName })
        }
      />

      <SupervisionDiffModal
        diff={diffQueue[0] ?? null}
        queueIndex={Math.max(0, diffQueueTotal - diffQueue.length)}
        queueTotal={diffQueueTotal}
        onResolve={handleResolveSupervisionDiff}
        onSkip={handleSkipSupervisionDiff}
      />

      <NewYearRolloverModal
        isOpen={rolloverOpen}
        documents={state.documents}
        availableYears={availableYears}
        defaultSourceYear={
          yearFilter !== 'all' ? yearFilter : state.profile.schoolYear || availableYears[0] || ''
        }
        onClose={() => setRolloverOpen(false)}
        onConfirmRollover={handleRolloverToNewYear}
      />

      <ConfirmModal
        isOpen={!!confirmDialog}
        title={
          confirmDialog?.kind === 'delete_doc'
            ? 'Usunąć ten dokument?'
            : confirmDialog?.kind === 'reset_doc'
              ? 'Wyczyścić formularz tej karty?'
              : confirmDialog?.kind === 'delete_supervision_pkg'
                ? 'Usunąć paczkę nauczyciela z nadzoru?'
                : 'Wyczyścić wszystkie dane aplikacji?'
        }
        description={
          confirmDialog?.kind === 'delete_doc'
            ? `Dokument „${confirmDialog.doc.title}” zostanie trwale usunięty z bieżącej sesji.`
            : confirmDialog?.kind === 'reset_doc'
              ? 'Wszystkie wpisane w tej karcie odpowiedzi zostaną usunięte (dane z profilu pozostaną zachowane).'
              : confirmDialog?.kind === 'delete_supervision_pkg'
                ? `Zaimportowana paczka nauczyciela „${resolvePackageTeacherName(confirmDialog.pkg)}” zostanie usunięta z panelu Nadzoru dyrektora, a sprawozdania zbiorcze klas zostaną automatycznie przeliczone.`
                : 'Wszystkie dokumenty oraz ustawienia profilu zapisane w przeglądarce zostaną trwale usunięte. Zalecamy wcześniej pobrać kopię JSON.'
        }
        confirmLabel={
          confirmDialog?.kind === 'delete_doc'
            ? 'Usuń dokument'
            : confirmDialog?.kind === 'reset_doc'
              ? 'Wyczyść kartę'
              : confirmDialog?.kind === 'delete_supervision_pkg'
                ? 'Usuń paczkę'
                : 'Wyczyść wszystko'
        }
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog(null)}
      />

      <OfflineIndicator />
    </div>
  );
}

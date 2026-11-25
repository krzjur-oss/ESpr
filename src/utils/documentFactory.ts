import {
  AppState,
  ClassificationPeriod,
  DOCUMENT_TYPE_LABELS,
  DocumentType,
  EfektyNauczaniaDoc,
  KartaInformacyjnaDoc,
  PodsumowanieSpecjalistyDoc,
  ReportDocument,
  SPECIALIST_ROLE_LABELS,
  SemesterType,
  SpecialistRole,
  SubjectAssignment,
  TeacherProfile,
  UzasadnienieNdstDoc,
  UzasadnienieNieklasyfikowaniaDoc,
  ZbiorczeEfektyDoc,
  ZbiorczeRow,
} from '../types/reports';

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodayPolishDate(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function suggestNextSchoolYear(currentYear: string): string {
  const match = currentYear.trim().match(/^(\d{4})\/(\d{4})$/);
  if (match) {
    const start = Number(match[1]) + 1;
    const end = Number(match[2]) + 1;
    return `${start}/${end}`;
  }
  const nowYear = new Date().getFullYear();
  return `${nowYear}/${nowYear + 1}`;
}

const ROMAN_GRADES: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
};

function normalizeClassToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^(?:klasy|klasa|kl\.?)\s*/i, '')
    .replace(/\s+/g, '');
}

function extractGradeNumber(token: string): number | null {
  const cleaned = normalizeClassToken(token);
  if (!cleaned) return null;
  const digitMatch = cleaned.match(/^(\d{1,2})/);
  if (digitMatch) {
    return Number(digitMatch[1]);
  }
  const romanMatch = cleaned.match(/^(viii|vii|vi|iv|v|iii|ii|i)(?=[a-z]|$)/);
  if (romanMatch && romanMatch[1] in ROMAN_GRADES) {
    return ROMAN_GRADES[romanMatch[1]];
  }
  return null;
}

function parseRangeBound(raw: string): number | null {
  const cleaned = normalizeClassToken(raw);
  if (/^\d{1,2}$/.test(cleaned)) {
    return Number(cleaned);
  }
  if (cleaned in ROMAN_GRADES) {
    return ROMAN_GRADES[cleaned];
  }
  return null;
}

export function scoreClassScopeMatch(scope: string, className: string): number {
  const trimmedScope = scope.trim();
  const normClass = normalizeClassToken(className);

  if (!trimmedScope) {
    return 10; // General subject-wide fallback
  }
  if (!normClass) {
    return -1;
  }

  const grade = extractGradeNumber(normClass);
  const segments = trimmedScope
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let bestScore = -1;

  for (const segment of segments) {
    const normSeg = normalizeClassToken(segment);
    if (!normSeg) continue;

    // 1. Exact class match (e.g. "4a" === "4a")
    if (normSeg === normClass) {
      bestScore = Math.max(bestScore, 1000);
      continue;
    }

    // 2. Exact single grade match (e.g. "4" matches "4a" or "4")
    const exactSingleGrade = parseRangeBound(normSeg);
    if (exactSingleGrade !== null && grade !== null && exactSingleGrade === grade) {
      bestScore = Math.max(bestScore, 800);
      continue;
    }

    // 3. Range match (e.g. "1-4", "1–4", "I-III", "5-8")
    const rangeParts = segment.split(/\s*[-–—]\s*/);
    if (rangeParts.length === 2 && grade !== null) {
      const start = parseRangeBound(rangeParts[0]);
      const end = parseRangeBound(rangeParts[1]);
      if (start !== null && end !== null) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        if (grade >= min && grade <= max) {
          // Narrower range receives higher specificity
          bestScore = Math.max(bestScore, 600 - (max - min));
          continue;
        }
      }
    }
  }

  return bestScore;
}

export function findSubjectAssignment(
  profile: TeacherProfile,
  subject: string,
  className?: string
): SubjectAssignment | undefined {
  const normalized = subject.trim().toLowerCase();
  if (!normalized) return undefined;
  const candidates = (profile.subjectAssignments ?? []).filter(
    (item) => item.subject.trim().toLowerCase() === normalized
  );
  if (candidates.length === 0) return undefined;

  const trimmedClass = className?.trim() ?? '';
  if (!trimmedClass) {
    if (candidates.length === 1) return candidates[0];
    return candidates.find((item) => !item.classScope?.trim());
  }

  let bestItem: SubjectAssignment | undefined;
  let bestScore = -1;
  for (const item of candidates) {
    const score = scoreClassScopeMatch(item.classScope ?? '', trimmedClass);
    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }
  return bestScore >= 0 ? bestItem : undefined;
}

export function createDefaultProfile(): TeacherProfile {
  return {
    senderId: createId(),
    fullName: '',
    schoolName: '',
    schoolYear: '2025/2026',
    defaultSemester: 'II',
    periodPreset: 'sem2',
    periodText: '01.02.2026 – 26.06.2026',
    homeroomClass: '',
    classesList: ['4A', '5B'],
    subjectsList: ['Matematyka'],
    subjectAssignments: [
      {
        id: createId(),
        subject: 'Matematyka',
        classScope: '',
        programNumber: '',
        textbookNumber: '',
        textbookTitle: '',
      },
    ],
    signatureDate: getTodayPolishDate(),
  };
}

export function createEfektyNauczaniaDoc(
  profile: TeacherProfile,
  overrides?: Partial<EfektyNauczaniaDoc>
): EfektyNauczaniaDoc {
  const now = new Date().toISOString();
  const subject =
    overrides?.subject ??
    profile.subjectAssignments?.[0]?.subject ??
    profile.subjectsList[0] ??
    '';
  const className = overrides?.className ?? profile.classesList[0] ?? '';
  const assignment = findSubjectAssignment(profile, subject, className);
  const titleParts = [subject || 'Przedmiot', className ? `kl. ${className}` : ''].filter(Boolean);

  return {
    id: createId(),
    type: 'efekty_nauczania',
    title:
      overrides?.title ??
      (titleParts.length > 0 ? titleParts.join(' · ') : DOCUMENT_TYPE_LABELS.efekty_nauczania),
    createdAt: now,
    updatedAt: now,
    schoolName: profile.schoolName,
    schoolYear: profile.schoolYear,
    semester: profile.defaultSemester,
    teacherName: profile.fullName,
    subject,
    programNumber: assignment?.programNumber ?? '',
    textbookNumber: assignment?.textbookNumber ?? '',
    textbookTitle: assignment?.textbookTitle ?? '',
    className,
    curriculumStatus: 'na_biezaco',
    curriculumScope: '',
    curriculumNotes: '',
    failingGradesCount: '0',
    excellentGradesCount: '0',
    gradesNotes: '',
    individualPathNotApplicable: true,
    individualPathSummary: '',
    competitionsNone: false,
    competitionsDetails: '',
    educationalTrips: '',
    preventiveProgram: '',
    previousConclusionsStatus: '',
    futureConclusions: '',
    signatureDate: profile.signatureDate || getTodayPolishDate(),
    ...overrides,
  };
}

export function createZbiorczeEfektyDoc(
  profile: TeacherProfile,
  mode: 'przedmiotowy' | 'wczesnoszkolna' = 'przedmiotowy',
  schoolYearOverride?: string
): ZbiorczeEfektyDoc {
  const now = new Date().toISOString();
  const defaultSubject =
    profile.subjectAssignments?.[0]?.subject ?? profile.subjectsList[0] ?? '';
  return {
    id: createId(),
    type: 'zbiorcze_efekty',
    title:
      mode === 'wczesnoszkolna'
        ? 'Sprawozdanie zbiorcze · Edukacja wczesnoszkolna'
        : `Sprawozdanie zbiorcze · ${defaultSubject || 'Zespół przedmiotowy'}`,
    createdAt: now,
    updatedAt: now,
    schoolName: profile.schoolName,
    schoolYear: schoolYearOverride ?? profile.schoolYear,
    semester: profile.defaultSemester,
    coordinatorName: profile.fullName,
    subjectOrStage:
      mode === 'wczesnoszkolna'
        ? 'Edukacja wczesnoszkolna (klasy I–III)'
        : defaultSubject,
    mode,
    rows: [
      {
        id: createId(),
        className: profile.classesList[0] || '',
        teacherName: profile.fullName,
        curriculumStatus: 'na_biezaco',
        curriculumDetails: '',
        failingCount: '0',
        excellentCount: '0',
        notes: '',
      },
    ],
    earlyEdWeakAreas: '',
    earlyEdStrongAreas: '',
    achievements: '',
    educationalTrips: '',
    preventiveProgram: '',
    previousConclusionsStatus: '',
    futureConclusions: '',
    signatureDate: profile.signatureDate || getTodayPolishDate(),
  };
}

export function createKartaInformacyjnaDoc(
  profile: TeacherProfile,
  schoolYearOverride?: string
): KartaInformacyjnaDoc {
  const now = new Date().toISOString();
  const subjects =
    profile.subjectAssignments?.length > 0
      ? profile.subjectAssignments.map((a) => a.subject)
      : profile.subjectsList;

  return {
    id: createId(),
    type: 'karta_informacyjna',
    title: `Karta informacyjna · ${profile.periodText || 'okres rozliczeniowy'}`,
    createdAt: now,
    updatedAt: now,
    schoolName: profile.schoolName,
    schoolYear: schoolYearOverride ?? profile.schoolYear,
    teacherName: profile.fullName,
    period: profile.periodText,
    totalHours: '',
    homeroomClass: profile.homeroomClass,
    subjectHours:
      subjects.length > 0
        ? subjects.map((s) => ({ id: createId(), subject: s, hours: '' }))
        : [{ id: createId(), subject: '', hours: '' }],
    qualificationsStudies: '',
    qualificationsWorkshops: '',
    qualificationsMethodical: '',
    studentAchievements: '',
    tripsOrganization: '',
    didacticBaseEnrichment: '',
    statutoryActivities: '',
    directorTasks: [{ id: createId(), taskType: '', results: '', conclusions: '' }],
    teacherInitiativeTasks: [{ id: createId(), taskType: '', results: '', conclusions: '' }],
    signatureDate: profile.signatureDate || getTodayPolishDate(),
  };
}

export function createPodsumowanieSpecjalistyDoc(
  profile: TeacherProfile,
  role: SpecialistRole = 'pedagog_psycholog',
  schoolYearOverride?: string
): PodsumowanieSpecjalistyDoc {
  const now = new Date().toISOString();
  return {
    id: createId(),
    type: 'podsumowanie_specjalisty',
    title: SPECIALIST_ROLE_LABELS[role],
    createdAt: now,
    updatedAt: now,
    schoolName: profile.schoolName,
    schoolYear: schoolYearOverride ?? profile.schoolYear,
    semester: 'II',
    role,
    specialistName: profile.fullName,
    studentInfo: '',
    plannedTasks: '',
    tasksRealization: '',
    effects: '',
    conclusions: '',
    preventiveProgram: '',
    previousConclusionsStatus: '',
    futureConclusions: '',
    signatureDate: profile.signatureDate || getTodayPolishDate(),
  };
}

export function createUzasadnienieNieklasyfikowaniaDoc(
  profile: TeacherProfile,
  classificationPeriod: ClassificationPeriod = 'srodroczne',
  schoolYearOverride?: string
): UzasadnienieNieklasyfikowaniaDoc {
  const now = new Date().toISOString();
  const subject =
    profile.subjectAssignments?.[0]?.subject ?? profile.subjectsList[0] ?? '';
  const className = profile.classesList[0] ?? '';
  const periodLabel = classificationPeriod === 'roczne' ? 'roczne' : 'I półrocze';

  return {
    id: createId(),
    type: 'uzasadnienie_nieklasyfikowania',
    title: `Uzasadnienie NKL (${periodLabel}) · ${subject || 'Przedmiot'}`,
    createdAt: now,
    updatedAt: now,
    schoolName: profile.schoolName,
    schoolYear: schoolYearOverride ?? profile.schoolYear,
    classificationPeriod,
    attachmentNumber: '',
    studentName: '',
    className,
    subject,
    teacherName: profile.fullName,
    absencePercent: '',
    additionalJustification: '',
    signatureDate: profile.signatureDate || getTodayPolishDate(),
  };
}

export function createUzasadnienieNdstDoc(
  profile: TeacherProfile,
  classificationPeriod: ClassificationPeriod = 'srodroczne',
  schoolYearOverride?: string
): UzasadnienieNdstDoc {
  const now = new Date().toISOString();
  const subject =
    profile.subjectAssignments?.[0]?.subject ?? profile.subjectsList[0] ?? '';
  const className = profile.classesList[0] ?? '';
  const periodLabel = classificationPeriod === 'roczne' ? 'roczna' : 'I półrocze';

  return {
    id: createId(),
    type: 'uzasadnienie_ndst',
    title: `Uzasadnienie NDST (${periodLabel}) · ${subject || 'Przedmiot'}`,
    createdAt: now,
    updatedAt: now,
    schoolName: profile.schoolName,
    schoolYear: schoolYearOverride ?? profile.schoolYear,
    classificationPeriod,
    attachmentNumber: '',
    studentName: '',
    className,
    subject,
    teacherName: profile.fullName,
    educationStage: 'drugiego etapu kształcenia',
    curriculumGaps: '',
    observations: [],
    teacherActions: [],
    improvementScheduleWhen: '',
    improvementScheduleForm: '',
    additionalTasksExamples: '',
    additionalTasksCompleted: '',
    remedialClassesWhat: '',
    remedialClassesAttended: '',
    remedialClassesNotAttendedReason: '',
    parentsNotifiedDate: '',
    parentsInstructedDate: '',
    pedagogueNotifiedDate: '',
    otherTeacherActionsText: '',
    parentsCooperation: '',
    nextSemesterActions: [],
    nextSemesterOtherText: '',
    signatureDate: profile.signatureDate || getTodayPolishDate(),
  };
}

export function createDocumentByType(
  type: DocumentType,
  profile: TeacherProfile,
  options?: {
    specialistRole?: SpecialistRole;
    coordinatorMode?: 'przedmiotowy' | 'wczesnoszkolna';
    classificationPeriod?: ClassificationPeriod;
    schoolYear?: string;
  }
): ReportDocument {
  switch (type) {
    case 'efekty_nauczania':
      return createEfektyNauczaniaDoc(
        profile,
        options?.schoolYear ? { schoolYear: options.schoolYear } : undefined
      );
    case 'zbiorcze_efekty':
      return createZbiorczeEfektyDoc(
        profile,
        options?.coordinatorMode ?? 'przedmiotowy',
        options?.schoolYear
      );
    case 'karta_informacyjna':
      return createKartaInformacyjnaDoc(profile, options?.schoolYear);
    case 'podsumowanie_specjalisty':
      return createPodsumowanieSpecjalistyDoc(
        profile,
        options?.specialistRole ?? 'pedagog_psycholog',
        options?.schoolYear
      );
    case 'uzasadnienie_nieklasyfikowania':
      return createUzasadnienieNieklasyfikowaniaDoc(
        profile,
        options?.classificationPeriod ?? 'srodroczne',
        options?.schoolYear
      );
    case 'uzasadnienie_ndst':
      return createUzasadnienieNdstDoc(
        profile,
        options?.classificationPeriod ?? 'srodroczne',
        options?.schoolYear
      );
  }
}

export function duplicateDocument(doc: ReportDocument): ReportDocument {
  const now = new Date().toISOString();
  const clone = JSON.parse(JSON.stringify(doc)) as ReportDocument;
  clone.id = createId();
  clone.title = `${doc.title} (kopia)`;
  clone.createdAt = now;
  clone.updatedAt = now;
  return clone;
}

export function clearDocumentFields(doc: ReportDocument, profile: TeacherProfile): ReportDocument {
  const fresh = createDocumentByType(doc.type, profile, {
    specialistRole: doc.type === 'podsumowanie_specjalisty' ? doc.role : undefined,
    coordinatorMode: doc.type === 'zbiorcze_efekty' ? doc.mode : undefined,
    classificationPeriod:
      doc.type === 'uzasadnienie_nieklasyfikowania' || doc.type === 'uzasadnienie_ndst'
        ? doc.classificationPeriod
        : undefined,
    schoolYear: doc.schoolYear,
  });
  fresh.id = doc.id;
  fresh.createdAt = doc.createdAt;
  return fresh;
}

export function cloneDocumentsForNewSchoolYear(
  sourceDocs: ReportDocument[],
  options: {
    targetYear: string;
    targetSemester: SemesterType;
    mode: 'clean_base' | 'full_copy';
    carryOverConclusions: boolean;
  },
  profile: TeacherProfile
): ReportDocument[] {
  const now = new Date().toISOString();
  const signatureDate = profile.signatureDate || getTodayPolishDate();

  return sourceDocs.map((source) => {
    const clone = JSON.parse(JSON.stringify(source)) as ReportDocument;
    clone.id = createId();
    clone.createdAt = now;
    clone.updatedAt = now;
    clone.schoolYear = options.targetYear.trim() || profile.schoolYear;
    clone.signatureDate = signatureDate;

    if (clone.type === 'efekty_nauczania') {
      clone.semester = options.targetSemester;
      const assignment = findSubjectAssignment(profile, clone.subject, clone.className);
      if (assignment) {
        if (assignment.programNumber) clone.programNumber = assignment.programNumber;
        if (assignment.textbookNumber) clone.textbookNumber = assignment.textbookNumber;
        if (assignment.textbookTitle) clone.textbookTitle = assignment.textbookTitle;
      }

      if (options.mode === 'clean_base') {
        const prevFuture = clone.futureConclusions.trim();
        clone.curriculumStatus = 'na_biezaco';
        clone.curriculumScope = '';
        clone.curriculumNotes = '';
        clone.failingGradesCount = '0';
        clone.excellentGradesCount = '0';
        clone.gradesNotes = '';
        clone.individualPathSummary = '';
        clone.competitionsNone = false;
        clone.competitionsDetails = '';
        clone.educationalTrips = '';
        clone.preventiveProgram = '';
        clone.previousConclusionsStatus =
          options.carryOverConclusions && prevFuture ? prevFuture : '';
        clone.futureConclusions = '';
      }
      return clone;
    }

    if (clone.type === 'zbiorcze_efekty') {
      clone.semester = options.targetSemester;
      if (options.mode === 'clean_base') {
        const prevFuture = clone.futureConclusions.trim();
        clone.rows = clone.rows.map((row) => ({
          ...row,
          id: createId(),
          curriculumStatus: 'na_biezaco',
          curriculumDetails: '',
          failingCount: '0',
          excellentCount: '0',
          notes: '',
        }));
        clone.earlyEdWeakAreas = '';
        clone.earlyEdStrongAreas = '';
        clone.achievements = '';
        clone.educationalTrips = '';
        clone.preventiveProgram = '';
        clone.previousConclusionsStatus =
          options.carryOverConclusions && prevFuture ? prevFuture : '';
        clone.futureConclusions = '';
      }
      return clone;
    }

    if (clone.type === 'karta_informacyjna') {
      if (options.mode === 'clean_base') {
        clone.subjectHours = clone.subjectHours.map((s) => ({
          ...s,
          id: createId(),
        }));
        clone.qualificationsStudies = '';
        clone.qualificationsWorkshops = '';
        clone.qualificationsMethodical = '';
        clone.studentAchievements = '';
        clone.tripsOrganization = '';
        clone.didacticBaseEnrichment = '';
        clone.statutoryActivities = '';
        clone.directorTasks = [{ id: createId(), taskType: '', results: '', conclusions: '' }];
        clone.teacherInitiativeTasks = [
          { id: createId(), taskType: '', results: '', conclusions: '' },
        ];
      }
      return clone;
    }

    if (clone.type === 'podsumowanie_specjalisty') {
      clone.semester = options.targetSemester;
      if (options.mode === 'clean_base') {
        const prevFuture = clone.futureConclusions.trim();
        clone.tasksRealization = '';
        clone.effects = '';
        clone.conclusions = '';
        clone.preventiveProgram = '';
        clone.previousConclusionsStatus =
          options.carryOverConclusions && prevFuture ? prevFuture : '';
        clone.futureConclusions = '';
      }
      return clone;
    }

    if (clone.type === 'uzasadnienie_nieklasyfikowania') {
      if (options.mode === 'clean_base') {
        clone.attachmentNumber = '';
        clone.studentName = '';
        clone.absencePercent = '';
        clone.additionalJustification = '';
      }
      return clone;
    }

    // uzasadnienie_ndst
    if (options.mode === 'clean_base') {
      clone.attachmentNumber = '';
      clone.studentName = '';
      clone.curriculumGaps = '';
      clone.observations = [];
      clone.teacherActions = [];
      clone.improvementScheduleWhen = '';
      clone.improvementScheduleForm = '';
      clone.additionalTasksExamples = '';
      clone.additionalTasksCompleted = '';
      clone.remedialClassesWhat = '';
      clone.remedialClassesAttended = '';
      clone.remedialClassesNotAttendedReason = '';
      clone.parentsNotifiedDate = '';
      clone.parentsInstructedDate = '';
      clone.pedagogueNotifiedDate = '';
      clone.otherTeacherActionsText = '';
      clone.parentsCooperation = '';
      clone.nextSemesterActions = [];
      clone.nextSemesterOtherText = '';
    }
    return clone;
  });
}

export function getMatchingSubjectCardsForCoordinator(
  allDocs: ReportDocument[],
  target: ZbiorczeEfektyDoc
): EfektyNauczaniaDoc[] {
  return allDocs.filter((d): d is EfektyNauczaniaDoc => {
    if (d.type !== 'efekty_nauczania') return false;
    if (target.schoolYear && d.schoolYear && d.schoolYear !== target.schoolYear) {
      return false;
    }
    if (target.semester && d.semester !== target.semester) {
      return false;
    }
    return true;
  });
}

export function aggregateIntoCoordinatorDoc(
  allDocs: ReportDocument[],
  target: ZbiorczeEfektyDoc
): ZbiorczeEfektyDoc {
  const matchingCards = getMatchingSubjectCardsForCoordinator(allDocs, target);

  if (matchingCards.length === 0) {
    return target;
  }

  const rows: ZbiorczeRow[] = matchingCards.map((c) => ({
    id: createId(),
    className: c.className || '—',
    teacherName: c.teacherName || '—',
    curriculumStatus: c.curriculumStatus,
    curriculumDetails: c.curriculumScope || c.curriculumNotes || '',
    failingCount: c.failingGradesCount,
    excellentCount: c.excellentGradesCount,
    notes: c.gradesNotes || '',
  }));

  const achievementsList = matchingCards
    .filter((c) => !c.competitionsNone && c.competitionsDetails.trim())
    .map((c) => `${c.className ? `Kl. ${c.className}: ` : ''}${c.competitionsDetails.trim()}`);

  const tripsList = matchingCards
    .filter((c) => c.educationalTrips.trim())
    .map((c) => `${c.className ? `Kl. ${c.className}: ` : ''}${c.educationalTrips.trim()}`);

  const preventiveList = matchingCards
    .filter((c) => c.preventiveProgram.trim())
    .map((c) => `${c.className ? `Kl. ${c.className}: ` : ''}${c.preventiveProgram.trim()}`);

  const prevConclusions = matchingCards
    .filter((c) => c.previousConclusionsStatus.trim())
    .map((c) => `${c.className ? `Kl. ${c.className}: ` : ''}${c.previousConclusionsStatus.trim()}`);

  const futureConclusions = matchingCards
    .filter((c) => c.futureConclusions.trim())
    .map((c) => c.futureConclusions.trim());

  const uniqueFuture = Array.from(new Set(futureConclusions));

  return {
    ...target,
    updatedAt: new Date().toISOString(),
    rows,
    achievements: achievementsList.join('\n') || target.achievements,
    educationalTrips: tripsList.join('\n') || target.educationalTrips,
    preventiveProgram: preventiveList.join('\n') || target.preventiveProgram,
    previousConclusionsStatus: prevConclusions.join('\n') || target.previousConclusionsStatus,
    futureConclusions: uniqueFuture.join('\n') || target.futureConclusions,
  };
}

export function createInitialAppState(): AppState {
  const profile = createDefaultProfile();
  const starterDoc = createEfektyNauczaniaDoc(profile, {
    subject: 'Matematyka',
    className: '4A',
    title: 'Matematyka · kl. 4A',
  });
  return {
    version: 1,
    profile,
    documents: [starterDoc],
    activeDocumentId: starterDoc.id,
    customWnioski: [],
    customTemplates: [],
    supervisionPackages: [],
    supervisionClassNotes: {},
  };
}

import {
  CURRICULUM_STATUS_LABELS,
  CurriculumStatus,
  ReportDocument,
  SPECIALIST_ROLE_LABELS,
  SemesterType,
  TeacherProfile,
  TeacherSupervisionPackage,
} from '../types/reports';
import { createId } from './documentFactory';
import { triggerJsonDownload } from './download';

export interface SupervisionPackageJsonPayload {
  app: 'E-Sprawozdania';
  kind: 'supervision_package';
  version: number;
  packageId: string;
  teacherKey: string;
  exportedAt: string;
  schoolYearFilter: string;
  semesterFilter: 'all' | SemesterType;
  teacherProfileSnapshot: TeacherProfile;
  documents: ReportDocument[];
}

export interface FieldDiff {
  field: string;
  label: string;
  before: string;
  after: string;
}

export type DocumentDiffStatus = 'added' | 'modified' | 'unchanged' | 'removed';

export interface DocumentVersionDiff {
  key: string;
  status: DocumentDiffStatus;
  existingDoc?: ReportDocument;
  incomingDoc?: ReportDocument;
  changes: FieldDiff[];
}

export interface PackageDiffResult {
  existingPackage: TeacherSupervisionPackage;
  incomingPackage: TeacherSupervisionPackage;
  profileChanges: FieldDiff[];
  documentDiffs: DocumentVersionDiff[];
  counts: {
    added: number;
    modified: number;
    unchanged: number;
    removed: number;
  };
  hasAnyChanges: boolean;
}

export interface ClassCollectiveSubjectRow {
  docId: string;
  subject: string;
  teacherName: string;
  semester: SemesterType;
  programNumber: string;
  textbookNumber: string;
  textbookTitle: string;
  curriculumStatus: CurriculumStatus;
  curriculumScope: string;
  curriculumNotes: string;
  failingGradesCount: string;
  excellentGradesCount: string;
  gradesNotes: string;
  individualPathSummary: string;
  competitionsDetails: string;
  educationalTrips: string;
  preventiveProgram: string;
  previousConclusionsStatus: string;
  futureConclusions: string;
}

export interface ClassCollectiveNklEntry {
  docId: string;
  studentName: string;
  subject: string;
  teacherName: string;
  classificationPeriod: 'srodroczne' | 'roczne';
  absencePercent: string;
  additionalJustification: string;
  attachmentNumber: string;
}

export interface ClassCollectiveNdstEntry {
  docId: string;
  studentName: string;
  subject: string;
  teacherName: string;
  classificationPeriod: 'srodroczne' | 'roczne';
  curriculumGaps: string;
  observationsCount: number;
  teacherActionsCount: number;
  parentsCooperation: string;
  attachmentNumber: string;
}

export interface ClassCollectiveHomeroomEntry {
  docId: string;
  teacherName: string;
  period: string;
  studentAchievements: string;
  tripsOrganization: string;
  didacticBaseEnrichment: string;
  statutoryActivities: string;
  directorTasksSummary: string[];
  teacherInitiativeSummary: string[];
}

export interface ClassCollectiveReport {
  className: string;
  schoolName: string;
  schoolYear: string;
  semesterFilter: 'all' | SemesterType;
  homeroomEntries: ClassCollectiveHomeroomEntry[];
  subjectRows: ClassCollectiveSubjectRow[];
  nklEntries: ClassCollectiveNklEntry[];
  ndstEntries: ClassCollectiveNdstEntry[];
  contributingTeachers: Array<{
    teacherKey: string;
    teacherName: string;
    exportedAt: string;
    isHomeroom: boolean;
  }>;
  totals: {
    subjectsCount: number;
    teachersCount: number;
    totalFailingGrades: number;
    totalExcellentGrades: number;
    delayedSubjectsCount: number;
    nklCount: number;
    ndstCount: number;
  };
  notesKey: string;
  directorNotes: string;
}

export function normalizeClassKey(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^(?:klasy|klasa|kl\.?)\s*/i, '')
    .replace(/\s+/g, '')
    .toUpperCase();
  if (!cleaned || ['BRAK', 'NIEDOTYCZY', '-', '—'].includes(cleaned)) {
    return '';
  }
  return cleaned;
}

export function sortClassNames(classes: string[]): string[] {
  return [...classes].sort((a, b) => a.localeCompare(b, 'pl', { numeric: true, sensitivity: 'base' }));
}

export function buildTeacherKey(profile: TeacherProfile, docs: ReportDocument[] = []): string {
  if (profile.senderId && profile.senderId.trim()) {
    return `id:${profile.senderId.trim()}`;
  }
  const fallbackDocTeacher = docs
    .map((d) => {
      if (d.type === 'efekty_nauczania') return d.teacherName;
      if (d.type === 'karta_informacyjna') return d.teacherName;
      if (d.type === 'uzasadnienie_nieklasyfikowania') return d.teacherName;
      if (d.type === 'uzasadnienie_ndst') return d.teacherName;
      if (d.type === 'podsumowanie_specjalisty') return d.specialistName;
      return d.coordinatorName;
    })
    .find((n) => n && n.trim().length > 0);

  const name = (profile.fullName || fallbackDocTeacher || 'nauczyciel')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  const school = (profile.schoolName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `name:${name}::${school}`;
}

export const MAX_SUPERVISION_BATCH_FILES = 50;
export const MAX_SUPERVISION_BATCH_TOTAL_BYTES = 50 * 1024 * 1024;

export type NameCollisionResolution = 'same_teacher' | 'new_teacher';

export function resolvePackageTeacherName(pkg: TeacherSupervisionPackage): string {
  if (pkg.teacherName.trim()) return pkg.teacherName.trim();
  if (pkg.teacherProfileSnapshot.fullName.trim()) return pkg.teacherProfileSnapshot.fullName.trim();
  for (const d of pkg.documents) {
    if ('teacherName' in d && d.teacherName.trim()) return d.teacherName.trim();
    if ('specialistName' in d && d.specialistName.trim()) return d.specialistName.trim();
    if ('coordinatorName' in d && d.coordinatorName.trim()) return d.coordinatorName.trim();
  }
  return 'Nauczyciel (brak podpisu w profilu)';
}

export function findNameOnlySupervisionMatchIndex(
  packages: TeacherSupervisionPackage[],
  incoming: TeacherSupervisionPackage
): number {
  const normName = resolvePackageTeacherName(incoming).trim().toLowerCase();
  if (!normName || normName.startsWith('nauczyciel (brak')) return -1;
  const normSchool = incoming.schoolName.trim().toLowerCase();
  return packages.findIndex((p) => {
    if (p.teacherKey === incoming.teacherKey) return false;
    const pName = resolvePackageTeacherName(p).trim().toLowerCase();
    const pSchool = p.schoolName.trim().toLowerCase();
    return pName === normName && (!normSchool || !pSchool || pSchool === normSchool);
  });
}

export function mergeSupervisionBatch(
  basePackages: TeacherSupervisionPackage[],
  parsedItems: Array<
    | { fileName: string; ok: true; pkg: TeacherSupervisionPackage }
    | { fileName: string; ok: false; error: string }
  >,
  nameCollisionDecisions: Record<string, NameCollisionResolution> = {},
  batchImportedAt: string = new Date().toISOString()
): {
  working: TeacherSupervisionPackage[];
  diffs: PackageDiffResult[];
  added: number;
  unchanged: number;
  errors: string[];
} {
  const working = [...basePackages];
  const diffs: PackageDiffResult[] = [];
  let added = 0;
  let unchanged = 0;
  const errors: string[] = [];

  for (const item of parsedItems) {
    if (!item.ok) {
      errors.push(`${item.fileName}: ${item.error}`);
      continue;
    }

    const incoming: TeacherSupervisionPackage = {
      ...item.pkg,
      importedAt: batchImportedAt,
    };

    let existingIdx = working.findIndex((p) => p.teacherKey === incoming.teacherKey);
    if (existingIdx === -1) {
      const decision = nameCollisionDecisions[incoming.id];
      if (decision === 'same_teacher') {
        existingIdx = findNameOnlySupervisionMatchIndex(working, incoming);
      }
    }

    if (existingIdx === -1) {
      working.push(incoming);
      added += 1;
    } else {
      const existingPkg = working[existingIdx];
      if (!existingPkg) continue;
      const diff = diffSupervisionPackage(existingPkg, incoming);
      if (diff.hasAnyChanges) {
        diffs.push(diff);
      } else {
        working[existingIdx] = {
          ...existingPkg,
          importedAt: batchImportedAt,
        };
        unchanged += 1;
      }
    }
  }

  return { working, diffs, added, unchanged, errors };
}

export function buildClassNotesKey(
  schoolYear: string,
  semesterFilter: 'all' | SemesterType,
  className: string
): string {
  const yr = schoolYear.trim() || 'all';
  const normCls = normalizeClassKey(className) || className.trim().toUpperCase();
  return `${yr}::${semesterFilter}::${normCls}`;
}

function sanitizeFilenamePart(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

export function buildSupervisionPackagePayload(
  profile: TeacherProfile,
  documents: ReportDocument[],
  options: {
    schoolYearFilter: string;
    semesterFilter: 'all' | SemesterType;
  }
): SupervisionPackageJsonPayload {
  const snapshot: TeacherProfile = {
    ...profile,
    senderId: profile.senderId?.trim() || createId(),
  };
  const teacherKey = buildTeacherKey(snapshot, documents);
  return {
    app: 'E-Sprawozdania',
    kind: 'supervision_package',
    version: 1,
    packageId: createId(),
    teacherKey,
    exportedAt: new Date().toISOString(),
    schoolYearFilter: options.schoolYearFilter,
    semesterFilter: options.semesterFilter,
    teacherProfileSnapshot: snapshot,
    documents,
  };
}

export function exportSupervisionPackageAsJson(
  profile: TeacherProfile,
  documents: ReportDocument[],
  options: {
    schoolYearFilter: string;
    semesterFilter: 'all' | SemesterType;
  }
): SupervisionPackageJsonPayload | null {
  const payload = buildSupervisionPackagePayload(profile, documents, options);

  const teacherPart =
    sanitizeFilenamePart(payload.teacherProfileSnapshot.fullName || 'nauczyciel') || 'nauczyciel';
  const yearPart =
    options.schoolYearFilter !== 'all'
      ? sanitizeFilenamePart(options.schoolYearFilter)
      : 'wszystkie_lata';
  const dateTag = new Date().toISOString().slice(0, 10);
  const filename = `nadzor-${teacherPart}-${yearPart}-${dateTag}.json`;

  if (!triggerJsonDownload(payload, filename)) {
    return null;
  }

  return payload;
}

function semanticDocSignature(doc: ReportDocument): string {
  switch (doc.type) {
    case 'efekty_nauczania':
      return `efekty::${doc.schoolYear.trim()}::${doc.semester}::${normalizeClassKey(doc.className)}::${doc.subject.trim().toLowerCase()}`;
    case 'karta_informacyjna':
      return `karta::${doc.schoolYear.trim()}::${doc.period.trim().toLowerCase()}::${normalizeClassKey(doc.homeroomClass)}`;
    case 'uzasadnienie_nieklasyfikowania':
      return `nkl::${doc.schoolYear.trim()}::${doc.classificationPeriod}::${normalizeClassKey(doc.className)}::${doc.subject.trim().toLowerCase()}::${doc.studentName.trim().toLowerCase()}`;
    case 'uzasadnienie_ndst':
      return `ndst::${doc.schoolYear.trim()}::${doc.classificationPeriod}::${normalizeClassKey(doc.className)}::${doc.subject.trim().toLowerCase()}::${doc.studentName.trim().toLowerCase()}`;
    case 'podsumowanie_specjalisty':
      return `spec::${doc.schoolYear.trim()}::${doc.semester}::${doc.role}`;
    case 'zbiorcze_efekty':
      return `zbiorcze::${doc.schoolYear.trim()}::${doc.semester}::${doc.mode}::${doc.subjectOrStage.trim().toLowerCase()}`;
  }
}

function formatDiffValue(value: string | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'Tak' : 'Nie';
  const trimmed = (value ?? '').trim();
  return trimmed || '—';
}

function compareDocumentFields(prev: ReportDocument, next: ReportDocument): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const pushIfChanged = (
    field: string,
    label: string,
    beforeVal: string | boolean | undefined,
    afterVal: string | boolean | undefined
  ) => {
    const b = formatDiffValue(beforeVal);
    const a = formatDiffValue(afterVal);
    if (b !== a) {
      diffs.push({ field, label, before: b, after: a });
    }
  };

  pushIfChanged('schoolYear', 'Rok szkolny', prev.schoolYear, next.schoolYear);

  if (prev.type !== next.type) {
    pushIfChanged('type', 'Typ formularza', prev.type, next.type);
    return diffs;
  }

  if (prev.type === 'efekty_nauczania' && next.type === 'efekty_nauczania') {
    pushIfChanged('subject', 'Przedmiot / zajęcia', prev.subject, next.subject);
    pushIfChanged('className', 'Klasa', prev.className, next.className);
    pushIfChanged('semester', 'Semestr', prev.semester, next.semester);
    pushIfChanged('programNumber', 'Numer programu', prev.programNumber, next.programNumber);
    pushIfChanged('textbookNumber', 'Nr podręcznika', prev.textbookNumber, next.textbookNumber);
    pushIfChanged('textbookTitle', 'Podręcznik', prev.textbookTitle, next.textbookTitle);
    pushIfChanged(
      'curriculumStatus',
      'Realizacja podstawy',
      CURRICULUM_STATUS_LABELS[prev.curriculumStatus],
      CURRICULUM_STATUS_LABELS[next.curriculumStatus]
    );
    pushIfChanged('curriculumScope', 'Zakres opóźnienia / wyprzedzenia', prev.curriculumScope, next.curriculumScope);
    pushIfChanged('curriculumNotes', 'Uwagi o podstawie', prev.curriculumNotes, next.curriculumNotes);
    pushIfChanged('failingGradesCount', 'Oceny niedostateczne', prev.failingGradesCount, next.failingGradesCount);
    pushIfChanged('excellentGradesCount', 'Oceny celujące', prev.excellentGradesCount, next.excellentGradesCount);
    pushIfChanged('gradesNotes', 'Uwagi o wynikach', prev.gradesNotes, next.gradesNotes);
    pushIfChanged(
      'individualPath',
      'Ścieżka indywidualna',
      prev.individualPathNotApplicable ? 'Nie dotyczy' : prev.individualPathSummary,
      next.individualPathNotApplicable ? 'Nie dotyczy' : next.individualPathSummary
    );
    pushIfChanged(
      'competitions',
      'Konkursy i sukcesy',
      prev.competitionsNone ? 'Brak' : prev.competitionsDetails,
      next.competitionsNone ? 'Brak' : next.competitionsDetails
    );
    pushIfChanged('educationalTrips', 'Wycieczki i wyjścia', prev.educationalTrips, next.educationalTrips);
    pushIfChanged('preventiveProgram', 'Program wychowawczo-profilaktyczny', prev.preventiveProgram, next.preventiveProgram);
    pushIfChanged('previousConclusionsStatus', 'Wnioski z ubiegłego roku', prev.previousConclusionsStatus, next.previousConclusionsStatus);
    pushIfChanged('futureConclusions', 'Wnioski do dalszej pracy', prev.futureConclusions, next.futureConclusions);
  } else if (prev.type === 'karta_informacyjna' && next.type === 'karta_informacyjna') {
    pushIfChanged('period', 'Okres sprawozdawczy', prev.period, next.period);
    pushIfChanged('homeroomClass', 'Wychowawstwo', prev.homeroomClass, next.homeroomClass);
    pushIfChanged('totalHours', 'Łączna liczba godzin', prev.totalHours, next.totalHours);
    pushIfChanged(
      'subjectHours',
      'Przydział godzin przedmiotowych',
      prev.subjectHours.map((r) => `${r.subject}: ${r.hours}`).join('; '),
      next.subjectHours.map((r) => `${r.subject}: ${r.hours}`).join('; ')
    );
    pushIfChanged('studentAchievements', 'Osiągnięcia uczniów', prev.studentAchievements, next.studentAchievements);
    pushIfChanged('tripsOrganization', 'Organizacja wycieczek', prev.tripsOrganization, next.tripsOrganization);
    pushIfChanged('didacticBaseEnrichment', 'Wzbogacenie bazy dydaktycznej', prev.didacticBaseEnrichment, next.didacticBaseEnrichment);
    pushIfChanged('statutoryActivities', 'Działalność statutowa', prev.statutoryActivities, next.statutoryActivities);
    pushIfChanged(
      'directorTasks',
      'Zadania zlecone przez dyrektora',
      prev.directorTasks.map((t) => `${t.taskType} (${t.results})`).filter(Boolean).join('; '),
      next.directorTasks.map((t) => `${t.taskType} (${t.results})`).filter(Boolean).join('; ')
    );
    pushIfChanged(
      'teacherInitiativeTasks',
      'Działania z inicjatywy własnej',
      prev.teacherInitiativeTasks.map((t) => `${t.taskType} (${t.results})`).filter(Boolean).join('; '),
      next.teacherInitiativeTasks.map((t) => `${t.taskType} (${t.results})`).filter(Boolean).join('; ')
    );
  } else if (
    prev.type === 'uzasadnienie_nieklasyfikowania' &&
    next.type === 'uzasadnienie_nieklasyfikowania'
  ) {
    pushIfChanged(
      'classificationPeriod',
      'Okres klasyfikacji',
      prev.classificationPeriod === 'roczne' ? 'Roczne' : 'I półrocze',
      next.classificationPeriod === 'roczne' ? 'Roczne' : 'I półrocze'
    );
    pushIfChanged('studentName', 'Uczeń', prev.studentName, next.studentName);
    pushIfChanged('className', 'Klasa', prev.className, next.className);
    pushIfChanged('subject', 'Przedmiot', prev.subject, next.subject);
    pushIfChanged('absencePercent', 'Procent nieobecności', prev.absencePercent, next.absencePercent);
    pushIfChanged('additionalJustification', 'Uzasadnienie', prev.additionalJustification, next.additionalJustification);
  } else if (prev.type === 'uzasadnienie_ndst' && next.type === 'uzasadnienie_ndst') {
    pushIfChanged(
      'classificationPeriod',
      'Okres klasyfikacji',
      prev.classificationPeriod === 'roczne' ? 'Roczne' : 'I półrocze',
      next.classificationPeriod === 'roczne' ? 'Roczne' : 'I półrocze'
    );
    pushIfChanged('studentName', 'Uczeń', prev.studentName, next.studentName);
    pushIfChanged('className', 'Klasa', prev.className, next.className);
    pushIfChanged('subject', 'Przedmiot', prev.subject, next.subject);
    pushIfChanged('curriculumGaps', 'Braki programowe', prev.curriculumGaps, next.curriculumGaps);
    pushIfChanged('observations', 'Zaznaczone obserwacje', prev.observations.join(', '), next.observations.join(', '));
    pushIfChanged('teacherActions', 'Działania nauczyciela', prev.teacherActions.join(', '), next.teacherActions.join(', '));
    pushIfChanged('parentsCooperation', 'Współpraca z rodzicami', prev.parentsCooperation, next.parentsCooperation);
    pushIfChanged('nextSemesterActions', 'Działania na kolejny okres', prev.nextSemesterActions.join(', '), next.nextSemesterActions.join(', '));
  } else if (prev.type === 'podsumowanie_specjalisty' && next.type === 'podsumowanie_specjalisty') {
    pushIfChanged('role', 'Stanowisko', SPECIALIST_ROLE_LABELS[prev.role], SPECIALIST_ROLE_LABELS[next.role]);
    pushIfChanged('semester', 'Semestr', prev.semester, next.semester);
    pushIfChanged('plannedTasks', 'Zaplanowane zadania', prev.plannedTasks, next.plannedTasks);
    pushIfChanged('tasksRealization', 'Realizacja zadań', prev.tasksRealization, next.tasksRealization);
    pushIfChanged('effects', 'Efekty pracy', prev.effects, next.effects);
    pushIfChanged('conclusions', 'Wnioski', prev.conclusions, next.conclusions);
  } else if (prev.type === 'zbiorcze_efekty' && next.type === 'zbiorcze_efekty') {
    pushIfChanged('subjectOrStage', 'Przedmiot / etap', prev.subjectOrStage, next.subjectOrStage);
    pushIfChanged('semester', 'Semestr', prev.semester, next.semester);
    pushIfChanged('rows', 'Liczba wierszy klas', String(prev.rows.length), String(next.rows.length));
    pushIfChanged('futureConclusions', 'Wnioski do dalszej pracy', prev.futureConclusions, next.futureConclusions);
  }

  return diffs;
}

export function diffSupervisionPackage(
  existingPackage: TeacherSupervisionPackage,
  incomingPackage: TeacherSupervisionPackage
): PackageDiffResult {
  const profileChanges: FieldDiff[] = [];
  if (existingPackage.teacherName.trim() !== incomingPackage.teacherName.trim()) {
    profileChanges.push({
      field: 'teacherName',
      label: 'Nauczyciel',
      before: existingPackage.teacherName || '—',
      after: incomingPackage.teacherName || '—',
    });
  }
  if (existingPackage.homeroomClass.trim() !== incomingPackage.homeroomClass.trim()) {
    profileChanges.push({
      field: 'homeroomClass',
      label: 'Wychowawstwo',
      before: existingPackage.homeroomClass || '—',
      after: incomingPackage.homeroomClass || '—',
    });
  }
  if (existingPackage.schoolName.trim() !== incomingPackage.schoolName.trim()) {
    profileChanges.push({
      field: 'schoolName',
      label: 'Szkoła',
      before: existingPackage.schoolName || '—',
      after: incomingPackage.schoolName || '—',
    });
  }

  const remainingExisting = [...existingPackage.documents];
  const documentDiffs: DocumentVersionDiff[] = [];

  for (const incomingDoc of incomingPackage.documents) {
    let matchIndex = remainingExisting.findIndex((d) => d.id === incomingDoc.id);
    if (matchIndex === -1) {
      const incomingSig = semanticDocSignature(incomingDoc);
      matchIndex = remainingExisting.findIndex((d) => semanticDocSignature(d) === incomingSig);
    }

    if (matchIndex === -1) {
      documentDiffs.push({
        key: `add:${incomingDoc.id}`,
        status: 'added',
        incomingDoc,
        changes: [],
      });
      continue;
    }

    const existingDoc = remainingExisting.splice(matchIndex, 1)[0];
    if (!existingDoc) continue;
    const changes = compareDocumentFields(existingDoc, incomingDoc);
    documentDiffs.push({
      key: `match:${existingDoc.id}:${incomingDoc.id}`,
      status: changes.length > 0 ? 'modified' : 'unchanged',
      existingDoc,
      incomingDoc,
      changes,
    });
  }

  for (const leftoverExisting of remainingExisting) {
    documentDiffs.push({
      key: `rem:${leftoverExisting.id}`,
      status: 'removed',
      existingDoc: leftoverExisting,
      changes: [],
    });
  }

  const counts = {
    added: documentDiffs.filter((d) => d.status === 'added').length,
    modified: documentDiffs.filter((d) => d.status === 'modified').length,
    unchanged: documentDiffs.filter((d) => d.status === 'unchanged').length,
    removed: documentDiffs.filter((d) => d.status === 'removed').length,
  };

  const hasAnyChanges =
    profileChanges.length > 0 ||
    counts.added > 0 ||
    counts.modified > 0 ||
    counts.removed > 0;

  return {
    existingPackage,
    incomingPackage,
    profileChanges,
    documentDiffs,
    counts,
    hasAnyChanges,
  };
}

export function applySupervisionDiffDecisions(
  diff: PackageDiffResult,
  decisions: Record<string, 'incoming' | 'existing'>
): TeacherSupervisionPackage {
  const nextDocs: ReportDocument[] = [];
  let tookIncoming = false;

  for (const item of diff.documentDiffs) {
    if (item.status === 'unchanged' && item.incomingDoc) {
      nextDocs.push(item.incomingDoc);
      continue;
    }
    const choice = decisions[item.key] ?? 'incoming';
    if (item.status === 'added') {
      if (choice === 'incoming' && item.incomingDoc) {
        nextDocs.push(item.incomingDoc);
        tookIncoming = true;
      }
    } else if (item.status === 'modified') {
      if (choice === 'incoming' && item.incomingDoc) {
        nextDocs.push(item.incomingDoc);
        tookIncoming = true;
      } else if (item.existingDoc) {
        nextDocs.push(item.existingDoc);
      }
    } else if (item.status === 'removed') {
      // For removed docs: 'incoming' means accept removal from new package; 'existing' means keep old doc
      if (choice === 'existing' && item.existingDoc) {
        nextDocs.push(item.existingDoc);
      } else {
        tookIncoming = true;
      }
    }
  }

  return {
    ...diff.incomingPackage,
    id: diff.existingPackage.id,
    teacherKey: diff.existingPackage.teacherKey,
    exportedAt: tookIncoming ? diff.incomingPackage.exportedAt : diff.existingPackage.exportedAt,
    importedAt: new Date().toISOString(),
    documents: nextDocs,
  };
}

function parseIntSafe(raw: string): number {
  const num = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function matchesYearFilter(docYear: string, schoolYearFilter: string): boolean {
  if (schoolYearFilter === 'all') return true;
  const trimmedDocYear = docYear.trim();
  if (!trimmedDocYear) return true;
  return trimmedDocYear === schoolYearFilter;
}

function matchesSemesterFilterForDoc(
  doc: ReportDocument,
  semesterFilter: 'all' | SemesterType
): boolean {
  if (semesterFilter === 'all') return true;
  if (doc.type === 'efekty_nauczania') return doc.semester === semesterFilter;
  if (doc.type === 'uzasadnienie_nieklasyfikowania' || doc.type === 'uzasadnienie_ndst') {
    return semesterFilter === 'I'
      ? doc.classificationPeriod === 'srodroczne'
      : doc.classificationPeriod === 'roczne';
  }
  if (doc.type === 'karta_informacyjna') return true;
  return true;
}

export function getAvailableSupervisionYears(packages: TeacherSupervisionPackage[]): string[] {
  const set = new Set<string>();
  for (const pkg of packages) {
    if (pkg.teacherProfileSnapshot.schoolYear.trim()) {
      set.add(pkg.teacherProfileSnapshot.schoolYear.trim());
    }
    for (const d of pkg.documents) {
      if (d.schoolYear.trim()) {
        set.add(d.schoolYear.trim());
      }
    }
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a, 'pl'));
}

export function aggregateClassCollectiveReports(
  packages: TeacherSupervisionPackage[],
  classNotes: Record<string, string>,
  filters: {
    schoolYear: string;
    semester: 'all' | SemesterType;
  }
): ClassCollectiveReport[] {
  interface ClassAccumulator {
    className: string;
    schoolNames: Set<string>;
    schoolYears: Set<string>;
    homeroomEntries: ClassCollectiveHomeroomEntry[];
    subjectRows: ClassCollectiveSubjectRow[];
    nklEntries: ClassCollectiveNklEntry[];
    ndstEntries: ClassCollectiveNdstEntry[];
    teachersMap: Map<
      string,
      { teacherKey: string; teacherName: string; exportedAt: string; isHomeroom: boolean }
    >;
  }

  const classMap = new Map<string, ClassAccumulator>();

  const ensureClass = (classKey: string): ClassAccumulator => {
    let acc = classMap.get(classKey);
    if (!acc) {
      acc = {
        className: classKey,
        schoolNames: new Set<string>(),
        schoolYears: new Set<string>(),
        homeroomEntries: [],
        subjectRows: [],
        nklEntries: [],
        ndstEntries: [],
        teachersMap: new Map(),
      };
      classMap.set(classKey, acc);
    }
    return acc;
  };

  for (const pkg of packages) {
    const teacherDisplayName = resolvePackageTeacherName(pkg);

    for (const doc of pkg.documents) {
      if (!matchesYearFilter(doc.schoolYear, filters.schoolYear)) continue;
      if (!matchesSemesterFilterForDoc(doc, filters.semester)) continue;

      if (doc.type === 'efekty_nauczania') {
        const classKey = normalizeClassKey(doc.className);
        if (!classKey) continue;
        const acc = ensureClass(classKey);
        if (doc.schoolName.trim()) acc.schoolNames.add(doc.schoolName.trim());
        else if (pkg.schoolName.trim()) acc.schoolNames.add(pkg.schoolName.trim());
        if (doc.schoolYear.trim()) acc.schoolYears.add(doc.schoolYear.trim());

        const rowTeacher = doc.teacherName.trim() || teacherDisplayName;
        acc.subjectRows.push({
          docId: doc.id,
          subject: doc.subject.trim() || 'Przedmiot bez nazwy',
          teacherName: rowTeacher,
          semester: doc.semester,
          programNumber: doc.programNumber.trim(),
          textbookNumber: (doc.textbookNumber ?? '').trim(),
          textbookTitle: doc.textbookTitle.trim(),
          curriculumStatus: doc.curriculumStatus,
          curriculumScope: doc.curriculumScope.trim(),
          curriculumNotes: doc.curriculumNotes.trim(),
          failingGradesCount: doc.failingGradesCount.trim() || '0',
          excellentGradesCount: doc.excellentGradesCount.trim() || '0',
          gradesNotes: doc.gradesNotes.trim(),
          individualPathSummary: doc.individualPathNotApplicable
            ? ''
            : doc.individualPathSummary.trim(),
          competitionsDetails: doc.competitionsNone ? '' : doc.competitionsDetails.trim(),
          educationalTrips: doc.educationalTrips.trim(),
          preventiveProgram: doc.preventiveProgram.trim(),
          previousConclusionsStatus: doc.previousConclusionsStatus.trim(),
          futureConclusions: doc.futureConclusions.trim(),
        });

        const existingTeacher = acc.teachersMap.get(pkg.teacherKey);
        acc.teachersMap.set(pkg.teacherKey, {
          teacherKey: pkg.teacherKey,
          teacherName: existingTeacher?.teacherName || rowTeacher,
          exportedAt: pkg.exportedAt,
          isHomeroom: existingTeacher?.isHomeroom ?? false,
        });
      } else if (doc.type === 'uzasadnienie_nieklasyfikowania') {
        const classKey = normalizeClassKey(doc.className);
        if (!classKey) continue;
        const acc = ensureClass(classKey);
        if (doc.schoolName.trim()) acc.schoolNames.add(doc.schoolName.trim());
        else if (pkg.schoolName.trim()) acc.schoolNames.add(pkg.schoolName.trim());
        if (doc.schoolYear.trim()) acc.schoolYears.add(doc.schoolYear.trim());
        const rowTeacher = doc.teacherName.trim() || teacherDisplayName;

        acc.nklEntries.push({
          docId: doc.id,
          studentName: doc.studentName.trim() || 'Uczeń bez imienia',
          subject: doc.subject.trim() || 'Przedmiot',
          teacherName: rowTeacher,
          classificationPeriod: doc.classificationPeriod,
          absencePercent: doc.absencePercent.trim(),
          additionalJustification: doc.additionalJustification.trim(),
          attachmentNumber: doc.attachmentNumber.trim(),
        });

        const existingTeacher = acc.teachersMap.get(pkg.teacherKey);
        acc.teachersMap.set(pkg.teacherKey, {
          teacherKey: pkg.teacherKey,
          teacherName: existingTeacher?.teacherName || rowTeacher,
          exportedAt: pkg.exportedAt,
          isHomeroom: existingTeacher?.isHomeroom ?? false,
        });
      } else if (doc.type === 'uzasadnienie_ndst') {
        const classKey = normalizeClassKey(doc.className);
        if (!classKey) continue;
        const acc = ensureClass(classKey);
        if (doc.schoolName.trim()) acc.schoolNames.add(doc.schoolName.trim());
        else if (pkg.schoolName.trim()) acc.schoolNames.add(pkg.schoolName.trim());
        if (doc.schoolYear.trim()) acc.schoolYears.add(doc.schoolYear.trim());
        const rowTeacher = doc.teacherName.trim() || teacherDisplayName;

        acc.ndstEntries.push({
          docId: doc.id,
          studentName: doc.studentName.trim() || 'Uczeń bez imienia',
          subject: doc.subject.trim() || 'Przedmiot',
          teacherName: rowTeacher,
          classificationPeriod: doc.classificationPeriod,
          curriculumGaps: doc.curriculumGaps.trim(),
          observationsCount: doc.observations.length,
          teacherActionsCount: doc.teacherActions.length,
          parentsCooperation: doc.parentsCooperation.trim(),
          attachmentNumber: doc.attachmentNumber.trim(),
        });

        const existingTeacher = acc.teachersMap.get(pkg.teacherKey);
        acc.teachersMap.set(pkg.teacherKey, {
          teacherKey: pkg.teacherKey,
          teacherName: existingTeacher?.teacherName || rowTeacher,
          exportedAt: pkg.exportedAt,
          isHomeroom: existingTeacher?.isHomeroom ?? false,
        });
      } else if (doc.type === 'karta_informacyjna') {
        const classKey = normalizeClassKey(doc.homeroomClass);
        if (!classKey) continue;
        const acc = ensureClass(classKey);
        if (doc.schoolName.trim()) acc.schoolNames.add(doc.schoolName.trim());
        else if (pkg.schoolName.trim()) acc.schoolNames.add(pkg.schoolName.trim());
        if (doc.schoolYear.trim()) acc.schoolYears.add(doc.schoolYear.trim());
        const rowTeacher = doc.teacherName.trim() || teacherDisplayName;

        acc.homeroomEntries.push({
          docId: doc.id,
          teacherName: rowTeacher,
          period: doc.period.trim(),
          studentAchievements: doc.studentAchievements.trim(),
          tripsOrganization: doc.tripsOrganization.trim(),
          didacticBaseEnrichment: doc.didacticBaseEnrichment.trim(),
          statutoryActivities: doc.statutoryActivities.trim(),
          directorTasksSummary: doc.directorTasks
            .filter((t) => t.taskType.trim() || t.results.trim())
            .map((t) =>
              [t.taskType.trim(), t.results.trim(), t.conclusions.trim()].filter(Boolean).join(' — ')
            ),
          teacherInitiativeSummary: doc.teacherInitiativeTasks
            .filter((t) => t.taskType.trim() || t.results.trim())
            .map((t) =>
              [t.taskType.trim(), t.results.trim(), t.conclusions.trim()].filter(Boolean).join(' — ')
            ),
        });

        acc.teachersMap.set(pkg.teacherKey, {
          teacherKey: pkg.teacherKey,
          teacherName: rowTeacher,
          exportedAt: pkg.exportedAt,
          isHomeroom: true,
        });
      }
    }
  }

  const orderedClasses = sortClassNames(Array.from(classMap.keys()));

  return orderedClasses.map((className) => {
    const acc = classMap.get(className)!;
    acc.subjectRows.sort((a, b) => {
      const bySubj = a.subject.localeCompare(b.subject, 'pl', { sensitivity: 'base' });
      if (bySubj !== 0) return bySubj;
      return a.semester.localeCompare(b.semester, 'pl');
    });
    acc.nklEntries.sort((a, b) => a.studentName.localeCompare(b.studentName, 'pl'));
    acc.ndstEntries.sort((a, b) => a.studentName.localeCompare(b.studentName, 'pl'));

    const schoolYear =
      filters.schoolYear !== 'all'
        ? filters.schoolYear
        : Array.from(acc.schoolYears)[0] ?? '';

    const notesKey = buildClassNotesKey(filters.schoolYear, filters.semester, className);

    const totalFailingGrades = acc.subjectRows.reduce(
      (sum, r) => sum + parseIntSafe(r.failingGradesCount),
      0
    );
    const totalExcellentGrades = acc.subjectRows.reduce(
      (sum, r) => sum + parseIntSafe(r.excellentGradesCount),
      0
    );
    const delayedSubjectsCount = acc.subjectRows.filter(
      (r) => r.curriculumStatus === 'opoznienie'
    ).length;

    return {
      className,
      schoolName: Array.from(acc.schoolNames)[0] ?? '',
      schoolYear,
      semesterFilter: filters.semester,
      homeroomEntries: acc.homeroomEntries,
      subjectRows: acc.subjectRows,
      nklEntries: acc.nklEntries,
      ndstEntries: acc.ndstEntries,
      contributingTeachers: Array.from(acc.teachersMap.values()).sort((a, b) =>
        a.teacherName.localeCompare(b.teacherName, 'pl')
      ),
      totals: {
        subjectsCount: acc.subjectRows.length,
        teachersCount: acc.teachersMap.size,
        totalFailingGrades,
        totalExcellentGrades,
        delayedSubjectsCount,
        nklCount: acc.nklEntries.length,
        ndstCount: acc.ndstEntries.length,
      },
      notesKey,
      directorNotes: classNotes[notesKey] ?? '',
    };
  });
}

export function getDocumentSubtitleForDiff(doc: ReportDocument): string {
  switch (doc.type) {
    case 'efekty_nauczania':
      return `${doc.subject || 'Przedmiot'} · kl. ${doc.className || '—'} · Sem. ${doc.semester}`;
    case 'karta_informacyjna':
      return `Wychowawstwo: ${doc.homeroomClass || 'brak'} · ${doc.period || doc.schoolYear}`;
    case 'uzasadnienie_nieklasyfikowania':
      return `NKL · ${doc.studentName || 'Uczeń'} · kl. ${doc.className || '—'} · ${doc.subject || 'Przedmiot'}`;
    case 'uzasadnienie_ndst':
      return `NDST · ${doc.studentName || 'Uczeń'} · kl. ${doc.className || '—'} · ${doc.subject || 'Przedmiot'}`;
    case 'podsumowanie_specjalisty':
      return `${SPECIALIST_ROLE_LABELS[doc.role]} · Sem. ${doc.semester}`;
    case 'zbiorcze_efekty':
      return `${doc.subjectOrStage || 'Zespół'} · Sem. ${doc.semester}`;
  }
}

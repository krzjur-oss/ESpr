import {
  CUSTOM_WNIOSKI_CATEGORY_ID,
  WNIOSKI_CATEGORY_OPTIONS,
} from '../data/wnioskiDatabase';
import {
  AdditionalTaskRow,
  AppState,
  ClassificationPeriod,
  CurriculumStatus,
  CustomTemplateEntry,
  CustomWniosekEntry,
  DocumentType,
  EfektyNauczaniaDoc,
  KartaInformacyjnaDoc,
  NdstNextSemesterActionKey,
  NdstObservationKey,
  NdstTeacherActionKey,
  PodsumowanieSpecjalistyDoc,
  ReportDocument,
  SPECIALIST_ROLE_LABELS,
  SemesterType,
  SpecialistRole,
  SubjectAssignment,
  SubjectHoursRow,
  TEMPLATE_CATEGORY_LABELS,
  TeacherProfile,
  TeacherSupervisionPackage,
  TemplateSectionCategory,
  UzasadnienieNdstDoc,
  UzasadnienieNieklasyfikowaniaDoc,
  ZbiorczeEfektyDoc,
  ZbiorczeRow,
} from '../types/reports';
import {
  createDefaultProfile,
  createDocumentByType,
  createId,
  createInitialAppState,
} from './documentFactory';
import { APP_VERSION } from '../data/changelog';
import { triggerJsonDownload } from './download';
import { MAX_IMPORT_FILE_MIB, MAX_IMPORT_JSON_CHARS } from './importLimits';
import { buildTeacherKey } from './supervision';

export { MAX_IMPORT_FILE_BYTES, MAX_IMPORT_FILE_MIB, MAX_IMPORT_JSON_CHARS } from './importLimits';

export const LEGACY_STORAGE_KEY = 'esprawozdania_local_state_v1';
export const TERMS_ACCEPTANCE_LS_KEY = 'esprawozdania_terms_accepted_v1';
export const MIN_REQUIRED_TERMS_VERSION = '1.8.0';
export const BACKUP_REMINDER_LS_KEY = 'esprawozdania_backup_meta_v1';
export const BACKUP_REMINDER_INTERVAL_DAYS = 14;
export const BACKUP_REMINDER_SNOOZE_DAYS = 7;
export const DB_NAME = 'esprawozdania_db';
export const DB_VERSION = 3;

const STORE_META = 'meta';
const STORE_DOCUMENTS = 'documents';
const STORE_WNIOSKI = 'customWnioski';
const STORE_TEMPLATES = 'customTemplates';
const STORE_SUPERVISION_PACKAGES = 'supervisionPackages';
const BROADCAST_CHANNEL_NAME = 'esprawozdania';

const MAX_TEXT_LENGTH = 100_000;
const MAX_SHORT_LENGTH = 500;
const FORBIDDEN_RECORD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const VALID_WNIOSEK_CATEGORY_IDS = new Set<string>(
  WNIOSKI_CATEGORY_OPTIONS.map((opt) => opt.id)
);
const VALID_TEMPLATE_CATEGORIES = new Set<string>(Object.keys(TEMPLATE_CATEGORY_LABELS));
const VALID_CURRICULUM_STATUSES = new Set<CurriculumStatus>([
  'na_biezaco',
  'opoznienie',
  'wyprzedzenie',
]);
const VALID_SPECIALIST_ROLES = new Set<string>(Object.keys(SPECIALIST_ROLE_LABELS));
export const VALID_DOC_TYPES = new Set<string>([
  'efekty_nauczania',
  'zbiorcze_efekty',
  'karta_informacyjna',
  'podsumowanie_specjalisty',
  'uzasadnienie_nieklasyfikowania',
  'uzasadnienie_ndst',
]);

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === 'object' && !Array.isArray(val);
}

function asStr(val: unknown, fallback: string, maxLen = MAX_TEXT_LENGTH): string {
  if (typeof val !== 'string') return fallback;
  return val.length > maxLen ? val.slice(0, maxLen) : val;
}

function asBool(val: unknown, fallback: boolean): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

function asSemester(val: unknown, fallback: SemesterType): SemesterType {
  return val === 'I' || val === 'II' ? val : fallback;
}

function asCurriculumStatus(val: unknown, fallback: CurriculumStatus): CurriculumStatus {
  return typeof val === 'string' && VALID_CURRICULUM_STATUSES.has(val as CurriculumStatus)
    ? (val as CurriculumStatus)
    : fallback;
}

function asClassificationPeriod(
  val: unknown,
  fallback: ClassificationPeriod
): ClassificationPeriod {
  return val === 'srodroczne' || val === 'roczne' ? val : fallback;
}

function asStringArray<T extends string>(val: unknown, fallback: T[]): T[] {
  if (!Array.isArray(val)) return fallback;
  return val.filter(
    (item): item is T =>
      typeof item === 'string' && item.trim().length > 0 && item.length <= MAX_SHORT_LENGTH
  );
}

function sanitizeIsoDate(val: unknown, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (!trimmed || trimmed.length > 64) return fallback;
  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) return fallback;
  return trimmed;
}

function findDuplicateExplicitId(
  items: unknown[],
  nestedKeys: string[] = []
): { kind: 'top' | 'nested'; id: string; nestedKey?: string } | null {
  const seenTop = new Set<string>();
  for (const item of items) {
    if (!isPlainObject(item)) continue;
    if (typeof item.id === 'string' && item.id.trim().length > 0) {
      const id = item.id.trim();
      if (seenTop.has(id)) {
        return { kind: 'top', id };
      }
      seenTop.add(id);
    }

    for (const key of nestedKeys) {
      const nested = item[key];
      if (!Array.isArray(nested)) continue;
      const seenNested = new Set<string>();
      for (const sub of nested) {
        if (!isPlainObject(sub)) continue;
        if (typeof sub.id === 'string' && sub.id.trim().length > 0) {
          const subId = sub.id.trim();
          if (seenNested.has(subId)) {
            return { kind: 'nested', id: subId, nestedKey: key };
          }
          seenNested.add(subId);
        }
      }
    }
  }
  return null;
}

export function sanitizeCustomWnioski(raw: unknown): CustomWniosekEntry[] {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();
  const nowFallback = new Date().toISOString();

  return raw
    .filter(
      (item): item is Partial<CustomWniosekEntry> & { text: string } =>
        isPlainObject(item) &&
        typeof item.text === 'string' &&
        item.text.trim().length > 0
    )
    .map((item) => {
      let id =
        typeof item.id === 'string' && item.id.trim()
          ? item.id.trim().slice(0, MAX_SHORT_LENGTH)
          : createId();
      if (seenIds.has(id)) {
        id = createId();
      }
      seenIds.add(id);

      return {
        id,
        categoryId:
          typeof item.categoryId === 'string' && VALID_WNIOSEK_CATEGORY_IDS.has(item.categoryId)
            ? item.categoryId
            : CUSTOM_WNIOSKI_CATEGORY_ID,
        text: item.text.trim().slice(0, MAX_TEXT_LENGTH),
        createdAt: sanitizeIsoDate(item.createdAt, nowFallback),
      };
    });
}

export function sanitizeCustomTemplates(raw: unknown): CustomTemplateEntry[] {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();
  const nowFallback = new Date().toISOString();

  return raw
    .filter(
      (item): item is Partial<CustomTemplateEntry> & { content: string } =>
        isPlainObject(item) &&
        typeof item.content === 'string' &&
        item.content.trim().length > 0
    )
    .map((item) => {
      let id =
        typeof item.id === 'string' && item.id.trim()
          ? item.id.trim().slice(0, MAX_SHORT_LENGTH)
          : createId();
      if (seenIds.has(id)) {
        id = createId();
      }
      seenIds.add(id);

      return {
        id,
        title:
          typeof item.title === 'string' && item.title.trim()
            ? item.title.trim().slice(0, MAX_SHORT_LENGTH)
            : 'Szablon własny',
        category:
          typeof item.category === 'string' && VALID_TEMPLATE_CATEGORIES.has(item.category)
            ? (item.category as TemplateSectionCategory)
            : 'ogolne',
        content: item.content.trim().slice(0, MAX_TEXT_LENGTH),
        createdAt: sanitizeIsoDate(item.createdAt, nowFallback),
      };
    });
}

function sanitizeZbiorczeRows(raw: unknown, fallback: ZbiorczeRow[]): ZbiorczeRow[] {
  if (!Array.isArray(raw)) return fallback;
  const seenIds = new Set<string>();
  return raw
    .filter((item): item is Record<string, unknown> => isPlainObject(item))
    .map((item) => {
      let id =
        typeof item.id === 'string' && item.id.trim()
          ? item.id.trim().slice(0, MAX_SHORT_LENGTH)
          : createId();
      if (seenIds.has(id)) id = createId();
      seenIds.add(id);
      return {
        id,
        className: asStr(item.className, '', MAX_SHORT_LENGTH),
        teacherName: asStr(item.teacherName, '', MAX_SHORT_LENGTH),
        curriculumStatus: asCurriculumStatus(item.curriculumStatus, 'na_biezaco'),
        curriculumDetails: asStr(item.curriculumDetails, ''),
        failingCount: asStr(item.failingCount, '0', 32),
        excellentCount: asStr(item.excellentCount, '0', 32),
        notes: asStr(item.notes, ''),
      };
    });
}

function sanitizeSubjectHoursRows(
  raw: unknown,
  fallback: SubjectHoursRow[]
): SubjectHoursRow[] {
  if (!Array.isArray(raw)) return fallback;
  const seenIds = new Set<string>();
  return raw
    .filter((item): item is Record<string, unknown> => isPlainObject(item))
    .map((item) => {
      let id =
        typeof item.id === 'string' && item.id.trim()
          ? item.id.trim().slice(0, MAX_SHORT_LENGTH)
          : createId();
      if (seenIds.has(id)) id = createId();
      seenIds.add(id);
      return {
        id,
        subject: asStr(item.subject, '', MAX_SHORT_LENGTH),
        hours: asStr(item.hours, '', 64),
      };
    });
}

function sanitizeAdditionalTaskRows(
  raw: unknown,
  fallback: AdditionalTaskRow[]
): AdditionalTaskRow[] {
  if (!Array.isArray(raw)) return fallback;
  const seenIds = new Set<string>();
  return raw
    .filter((item): item is Record<string, unknown> => isPlainObject(item))
    .map((item) => {
      let id =
        typeof item.id === 'string' && item.id.trim()
          ? item.id.trim().slice(0, MAX_SHORT_LENGTH)
          : createId();
      if (seenIds.has(id)) id = createId();
      seenIds.add(id);
      return {
        id,
        taskType: asStr(item.taskType, ''),
        results: asStr(item.results, ''),
        conclusions: asStr(item.conclusions, ''),
      };
    });
}

function sanitizeSingleDocument(
  raw: unknown,
  fallbackProfile: TeacherProfile,
  seenIds: Set<string>
): ReportDocument | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.type !== 'string' || !VALID_DOC_TYPES.has(raw.type)) {
    return null;
  }

  const docType = raw.type as DocumentType;
  let id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim().slice(0, MAX_SHORT_LENGTH)
      : createId();
  if (seenIds.has(id)) {
    id = createId();
  }
  seenIds.add(id);

  const specialistRole: SpecialistRole =
    typeof raw.role === 'string' && VALID_SPECIALIST_ROLES.has(raw.role)
      ? (raw.role as SpecialistRole)
      : 'pedagog_psycholog';
  const coordinatorMode: 'przedmiotowy' | 'wczesnoszkolna' =
    raw.mode === 'wczesnoszkolna' ? 'wczesnoszkolna' : 'przedmiotowy';
  const classPeriod: ClassificationPeriod = asClassificationPeriod(
    raw.classificationPeriod,
    'srodroczne'
  );

  const base = createDocumentByType(docType, fallbackProfile, {
    specialistRole,
    coordinatorMode,
    classificationPeriod: classPeriod,
    schoolYear: typeof raw.schoolYear === 'string' ? raw.schoolYear.slice(0, 64) : undefined,
  });

  const common = {
    id,
    title: asStr(raw.title, base.title, MAX_SHORT_LENGTH),
    createdAt: sanitizeIsoDate(raw.createdAt, base.createdAt),
    updatedAt: sanitizeIsoDate(raw.updatedAt, base.updatedAt),
    schoolName: asStr(raw.schoolName, base.schoolName, MAX_SHORT_LENGTH),
    schoolYear: asStr(raw.schoolYear, base.schoolYear, 64),
    signatureDate: asStr(raw.signatureDate, base.signatureDate, 64),
    isLocked: asBool(raw.isLocked, false),
  };

  switch (base.type) {
    case 'efekty_nauczania': {
      const def = base as EfektyNauczaniaDoc;
      return {
        ...def,
        ...common,
        type: 'efekty_nauczania',
        semester: asSemester(raw.semester, def.semester),
        teacherName: asStr(raw.teacherName, def.teacherName, MAX_SHORT_LENGTH),
        subject: asStr(raw.subject, def.subject, MAX_SHORT_LENGTH),
        programNumber: asStr(raw.programNumber, def.programNumber, MAX_SHORT_LENGTH),
        textbookNumber: asStr(raw.textbookNumber, def.textbookNumber, MAX_SHORT_LENGTH),
        textbookTitle: asStr(raw.textbookTitle, def.textbookTitle, MAX_SHORT_LENGTH),
        className: asStr(raw.className, def.className, 64),
        curriculumStatus: asCurriculumStatus(raw.curriculumStatus, def.curriculumStatus),
        curriculumScope: asStr(raw.curriculumScope, def.curriculumScope),
        curriculumNotes: asStr(raw.curriculumNotes, def.curriculumNotes),
        failingGradesCount: asStr(raw.failingGradesCount, def.failingGradesCount, 32),
        excellentGradesCount: asStr(raw.excellentGradesCount, def.excellentGradesCount, 32),
        gradesNotes: asStr(raw.gradesNotes, def.gradesNotes),
        individualPathNotApplicable: asBool(
          raw.individualPathNotApplicable,
          def.individualPathNotApplicable
        ),
        individualPathSummary: asStr(raw.individualPathSummary, def.individualPathSummary),
        competitionsNone: asBool(raw.competitionsNone, def.competitionsNone),
        competitionsDetails: asStr(raw.competitionsDetails, def.competitionsDetails),
        educationalTrips: asStr(raw.educationalTrips, def.educationalTrips),
        preventiveProgram: asStr(raw.preventiveProgram, def.preventiveProgram),
        previousConclusionsStatus: asStr(
          raw.previousConclusionsStatus,
          def.previousConclusionsStatus
        ),
        futureConclusions: asStr(raw.futureConclusions, def.futureConclusions),
      };
    }
    case 'zbiorcze_efekty': {
      const def = base as ZbiorczeEfektyDoc;
      return {
        ...def,
        ...common,
        type: 'zbiorcze_efekty',
        semester: asSemester(raw.semester, def.semester),
        coordinatorName: asStr(raw.coordinatorName, def.coordinatorName, MAX_SHORT_LENGTH),
        subjectOrStage: asStr(raw.subjectOrStage, def.subjectOrStage, MAX_SHORT_LENGTH),
        mode: coordinatorMode,
        rows: sanitizeZbiorczeRows(raw.rows, def.rows),
        earlyEdWeakAreas: asStr(raw.earlyEdWeakAreas, def.earlyEdWeakAreas),
        earlyEdStrongAreas: asStr(raw.earlyEdStrongAreas, def.earlyEdStrongAreas),
        achievements: asStr(raw.achievements, def.achievements),
        educationalTrips: asStr(raw.educationalTrips, def.educationalTrips),
        preventiveProgram: asStr(raw.preventiveProgram, def.preventiveProgram),
        previousConclusionsStatus: asStr(
          raw.previousConclusionsStatus,
          def.previousConclusionsStatus
        ),
        futureConclusions: asStr(raw.futureConclusions, def.futureConclusions),
      };
    }
    case 'karta_informacyjna': {
      const def = base as KartaInformacyjnaDoc;
      return {
        ...def,
        ...common,
        type: 'karta_informacyjna',
        teacherName: asStr(raw.teacherName, def.teacherName, MAX_SHORT_LENGTH),
        period: asStr(raw.period, def.period, MAX_SHORT_LENGTH),
        totalHours: asStr(raw.totalHours, def.totalHours, 64),
        homeroomClass: asStr(raw.homeroomClass, def.homeroomClass, 64),
        subjectHours: sanitizeSubjectHoursRows(raw.subjectHours, def.subjectHours),
        qualificationsStudies: asStr(raw.qualificationsStudies, def.qualificationsStudies),
        qualificationsWorkshops: asStr(
          raw.qualificationsWorkshops,
          def.qualificationsWorkshops
        ),
        qualificationsMethodical: asStr(
          raw.qualificationsMethodical,
          def.qualificationsMethodical
        ),
        studentAchievements: asStr(raw.studentAchievements, def.studentAchievements),
        tripsOrganization: asStr(raw.tripsOrganization, def.tripsOrganization),
        didacticBaseEnrichment: asStr(raw.didacticBaseEnrichment, def.didacticBaseEnrichment),
        statutoryActivities: asStr(raw.statutoryActivities, def.statutoryActivities),
        directorTasks: sanitizeAdditionalTaskRows(raw.directorTasks, def.directorTasks),
        teacherInitiativeTasks: sanitizeAdditionalTaskRows(
          raw.teacherInitiativeTasks,
          def.teacherInitiativeTasks
        ),
      };
    }
    case 'podsumowanie_specjalisty': {
      const def = base as PodsumowanieSpecjalistyDoc;
      return {
        ...def,
        ...common,
        type: 'podsumowanie_specjalisty',
        semester: asSemester(raw.semester, def.semester),
        role: specialistRole,
        specialistName: asStr(raw.specialistName, def.specialistName, MAX_SHORT_LENGTH),
        studentInfo: asStr(raw.studentInfo, def.studentInfo),
        plannedTasks: asStr(raw.plannedTasks, def.plannedTasks),
        tasksRealization: asStr(raw.tasksRealization, def.tasksRealization),
        effects: asStr(raw.effects, def.effects),
        conclusions: asStr(raw.conclusions, def.conclusions),
        preventiveProgram: asStr(raw.preventiveProgram, def.preventiveProgram),
        previousConclusionsStatus: asStr(
          raw.previousConclusionsStatus,
          def.previousConclusionsStatus
        ),
        futureConclusions: asStr(raw.futureConclusions, def.futureConclusions),
      };
    }
    case 'uzasadnienie_nieklasyfikowania': {
      const def = base as UzasadnienieNieklasyfikowaniaDoc;
      return {
        ...def,
        ...common,
        type: 'uzasadnienie_nieklasyfikowania',
        classificationPeriod: classPeriod,
        attachmentNumber: asStr(raw.attachmentNumber, def.attachmentNumber, 64),
        studentName: asStr(raw.studentName, def.studentName, MAX_SHORT_LENGTH),
        className: asStr(raw.className, def.className, 64),
        subject: asStr(raw.subject, def.subject, MAX_SHORT_LENGTH),
        teacherName: asStr(raw.teacherName, def.teacherName, MAX_SHORT_LENGTH),
        absencePercent: asStr(raw.absencePercent, def.absencePercent, 64),
        additionalJustification: asStr(
          raw.additionalJustification,
          def.additionalJustification
        ),
      };
    }
    case 'uzasadnienie_ndst': {
      const def = base as UzasadnienieNdstDoc;
      const completed =
        raw.additionalTasksCompleted === 'TAK' || raw.additionalTasksCompleted === 'NIE'
          ? raw.additionalTasksCompleted
          : '';
      const attended =
        raw.remedialClassesAttended === 'TAK' ||
        raw.remedialClassesAttended === 'NIE' ||
        raw.remedialClassesAttended === 'RZADKO'
          ? raw.remedialClassesAttended
          : '';
      return {
        ...def,
        ...common,
        type: 'uzasadnienie_ndst',
        classificationPeriod: classPeriod,
        attachmentNumber: asStr(raw.attachmentNumber, def.attachmentNumber, 64),
        studentName: asStr(raw.studentName, def.studentName, MAX_SHORT_LENGTH),
        className: asStr(raw.className, def.className, 64),
        subject: asStr(raw.subject, def.subject, MAX_SHORT_LENGTH),
        teacherName: asStr(raw.teacherName, def.teacherName, MAX_SHORT_LENGTH),
        educationStage: asStr(raw.educationStage, def.educationStage, MAX_SHORT_LENGTH),
        curriculumGaps: asStr(raw.curriculumGaps, def.curriculumGaps),
        observations: asStringArray<NdstObservationKey>(raw.observations, def.observations),
        teacherActions: asStringArray<NdstTeacherActionKey>(
          raw.teacherActions,
          def.teacherActions
        ),
        improvementScheduleWhen: asStr(
          raw.improvementScheduleWhen,
          def.improvementScheduleWhen
        ),
        improvementScheduleForm: asStr(
          raw.improvementScheduleForm,
          def.improvementScheduleForm
        ),
        additionalTasksExamples: asStr(
          raw.additionalTasksExamples,
          def.additionalTasksExamples
        ),
        additionalTasksCompleted: completed,
        remedialClassesWhat: asStr(raw.remedialClassesWhat, def.remedialClassesWhat),
        remedialClassesAttended: attended,
        remedialClassesNotAttendedReason: asStr(
          raw.remedialClassesNotAttendedReason,
          def.remedialClassesNotAttendedReason
        ),
        parentsNotifiedDate: asStr(raw.parentsNotifiedDate, def.parentsNotifiedDate, 128),
        parentsInstructedDate: asStr(raw.parentsInstructedDate, def.parentsInstructedDate, 128),
        pedagogueNotifiedDate: asStr(raw.pedagogueNotifiedDate, def.pedagogueNotifiedDate, 128),
        otherTeacherActionsText: asStr(
          raw.otherTeacherActionsText,
          def.otherTeacherActionsText
        ),
        parentsCooperation: asStr(raw.parentsCooperation, def.parentsCooperation),
        nextSemesterActions: asStringArray<NdstNextSemesterActionKey>(
          raw.nextSemesterActions,
          def.nextSemesterActions
        ),
        nextSemesterOtherText: asStr(raw.nextSemesterOtherText, def.nextSemesterOtherText),
      };
    }
  }
}

export function sanitizeDocuments(
  docs: unknown,
  fallbackProfile: TeacherProfile = createDefaultProfile()
): ReportDocument[] {
  if (!Array.isArray(docs)) return [];
  const seenIds = new Set<string>();
  const result: ReportDocument[] = [];
  for (const rawDoc of docs) {
    const sanitized = sanitizeSingleDocument(rawDoc, fallbackProfile, seenIds);
    if (sanitized) {
      result.push(sanitized);
    }
  }
  return result;
}

export function sanitizeProfile(raw: Partial<TeacherProfile>): TeacherProfile {
  const defaults = createDefaultProfile();
  const subjectsList = Array.isArray(raw.subjectsList)
    ? raw.subjectsList
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim().slice(0, MAX_SHORT_LENGTH))
    : defaults.subjectsList;

  const classesList = Array.isArray(raw.classesList)
    ? Array.from(
        new Set(
          raw.classesList
            .filter((c): c is string => typeof c === 'string')
            .map((c) => c.trim().slice(0, 64))
            .filter((c) => c.length > 0)
        )
      )
    : defaults.classesList;

  const seenAssignmentIds = new Set<string>();
  let subjectAssignments: SubjectAssignment[];
  if (Array.isArray(raw.subjectAssignments)) {
    subjectAssignments = raw.subjectAssignments
      .filter(
        (a): a is SubjectAssignment =>
          isPlainObject(a) && typeof (a as SubjectAssignment).subject === 'string'
      )
      .map((a) => {
        let id =
          typeof a.id === 'string' && a.id.trim()
            ? a.id.trim().slice(0, MAX_SHORT_LENGTH)
            : createId();
        if (seenAssignmentIds.has(id)) id = createId();
        seenAssignmentIds.add(id);

        return {
          id,
          subject: a.subject.slice(0, MAX_SHORT_LENGTH),
          classScope: typeof a.classScope === 'string' ? a.classScope.slice(0, MAX_SHORT_LENGTH) : '',
          programNumber:
            typeof a.programNumber === 'string' ? a.programNumber.slice(0, MAX_SHORT_LENGTH) : '',
          textbookNumber:
            typeof a.textbookNumber === 'string' ? a.textbookNumber.slice(0, MAX_SHORT_LENGTH) : '',
          textbookTitle:
            typeof a.textbookTitle === 'string' ? a.textbookTitle.slice(0, MAX_SHORT_LENGTH) : '',
        };
      });
  } else {
    subjectAssignments = subjectsList.map((subject) => ({
      id: createId(),
      subject,
      classScope: '',
      programNumber: '',
      textbookNumber: '',
      textbookTitle: '',
    }));
  }

  const derivedSubjectsList =
    subjectAssignments.length > 0
      ? Array.from(
          new Set(
            subjectAssignments
              .map((a) => a.subject.trim())
              .filter((s) => s.length > 0)
          )
        )
      : subjectsList;

  return {
    senderId:
      typeof raw.senderId === 'string' && raw.senderId.trim()
        ? raw.senderId.trim().slice(0, MAX_SHORT_LENGTH)
        : defaults.senderId,
    fullName: asStr(raw.fullName, defaults.fullName, MAX_SHORT_LENGTH),
    schoolName: asStr(raw.schoolName, defaults.schoolName, MAX_SHORT_LENGTH),
    schoolYear: asStr(raw.schoolYear, defaults.schoolYear, 64),
    defaultSemester:
      raw.defaultSemester === 'I' || raw.defaultSemester === 'II'
        ? raw.defaultSemester
        : defaults.defaultSemester,
    periodPreset:
      raw.periodPreset === 'sem1' || raw.periodPreset === 'sem2' || raw.periodPreset === 'custom'
        ? raw.periodPreset
        : defaults.periodPreset,
    periodText: asStr(raw.periodText, defaults.periodText, MAX_SHORT_LENGTH),
    homeroomClass: asStr(raw.homeroomClass, defaults.homeroomClass, 64),
    classesList,
    subjectsList: derivedSubjectsList,
    subjectAssignments,
    signatureDate: asStr(raw.signatureDate, defaults.signatureDate, 64),
  };
}

export function isValidReportDocument(doc: unknown): doc is ReportDocument {
  if (!isPlainObject(doc)) return false;
  return typeof doc.type === 'string' && VALID_DOC_TYPES.has(doc.type);
}

export function sanitizeSupervisionPackages(raw: unknown): TeacherSupervisionPackage[] {
  if (!Array.isArray(raw)) return [];
  const seenPkgIds = new Set<string>();
  const nowFallback = new Date().toISOString();

  return raw
    .filter((item): item is Partial<TeacherSupervisionPackage> => isPlainObject(item))
    .map((item) => {
      let id =
        typeof item.id === 'string' && item.id.trim()
          ? item.id.trim().slice(0, MAX_SHORT_LENGTH)
          : createId();
      if (seenPkgIds.has(id)) id = createId();
      seenPkgIds.add(id);

      const profile = sanitizeProfile(
        isPlainObject(item.teacherProfileSnapshot)
          ? (item.teacherProfileSnapshot as Partial<TeacherProfile>)
          : {}
      );
      const validDocs = Array.isArray(item.documents)
        ? sanitizeDocuments(item.documents.filter(isValidReportDocument), profile)
        : [];
      const teacherKey =
        typeof item.teacherKey === 'string' && item.teacherKey.trim()
          ? item.teacherKey.trim().slice(0, MAX_SHORT_LENGTH)
          : buildTeacherKey(profile, validDocs);

      return {
        id,
        teacherKey,
        teacherName:
          typeof item.teacherName === 'string' && item.teacherName.trim()
            ? item.teacherName.trim().slice(0, MAX_SHORT_LENGTH)
            : profile.fullName,
        schoolName:
          typeof item.schoolName === 'string' && item.schoolName.trim()
            ? item.schoolName.trim().slice(0, MAX_SHORT_LENGTH)
            : profile.schoolName,
        homeroomClass:
          typeof item.homeroomClass === 'string'
            ? item.homeroomClass.slice(0, 64)
            : profile.homeroomClass,
        exportedAt: sanitizeIsoDate(item.exportedAt, nowFallback),
        importedAt: sanitizeIsoDate(item.importedAt, nowFallback),
        schoolYearFilter:
          typeof item.schoolYearFilter === 'string' && item.schoolYearFilter.trim()
            ? item.schoolYearFilter.slice(0, 64)
            : 'all',
        semesterFilter:
          item.semesterFilter === 'I' || item.semesterFilter === 'II'
            ? item.semesterFilter
            : ('all' as const),
        teacherProfileSnapshot: profile,
        documents: validDocs,
      };
    })
    .filter((pkg) => pkg.documents.length > 0);
}

export function sanitizeSupervisionClassNotes(raw: unknown): Record<string, string> {
  if (!isPlainObject(raw)) return {};
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (
      typeof key === 'string' &&
      !FORBIDDEN_RECORD_KEYS.has(key) &&
      key.length <= MAX_SHORT_LENGTH &&
      typeof val === 'string' &&
      val.trim().length > 0
    ) {
      result[key] = val.slice(0, MAX_TEXT_LENGTH);
    }
  }
  return result;
}

export interface TermsAcceptanceRecord {
  accepted: boolean;
  pending?: boolean;
  acceptedAt: string | null;
  version: string;
}

export interface BackupReminderMeta {
  lastBackupExportAt: string | null;
  snoozedUntil: string | null;
}

export type StorageBackend = 'indexeddb' | 'memory';
export type SaveStatus = 'saved' | 'saving' | 'conflict' | 'error' | 'memory_only';
export type LegacyMigrationStatus =
  | 'none'
  | 'migrated'
  | 'corrupted'
  | 'read_error'
  | 'migration_write_failed';

export type SaveResult =
  | { ok: true; revision: number }
  | {
      ok: false;
      reason: 'conflict' | 'error' | 'unavailable';
      dbRevision?: number;
      error?: string;
    };

export interface LoadAppStateResult {
  state: AppState;
  backend: StorageBackend;
  legacyStatus: LegacyMigrationStatus;
  revision: number;
  dbReadError?: string;
  requiresTermsAcceptance: boolean;
  backupReminderMeta: BackupReminderMeta;
}

interface MetaRecord<T = unknown> {
  key: string;
  value: T;
}

const TAB_INSTANCE_ID = createId();

let dbPromise: Promise<IDBDatabase> | null = null;
let lastPersistedState: AppState | null = null;
let currentKnownRevision = 0;
let currentStorageBackend: StorageBackend = 'indexeddb';
let writeQueue: Promise<SaveResult> = Promise.resolve({ ok: true, revision: 0 });
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingStateToSave: AppState | null = null;
let currentSaveStatus: SaveStatus = 'saved';
let cachedBackupReminderMeta: BackupReminderMeta = {
  lastBackupExportAt: null,
  snoozedUntil: null,
};

const saveStatusListeners = new Set<(status: SaveStatus) => void>();
const crossTabListeners = new Set<(detail: { revision?: number }) => void>();
const backupMetaListeners = new Set<(meta: BackupReminderMeta) => void>();
let sharedBroadcastChannel: BroadcastChannel | null = null;

function setSaveStatus(next: SaveStatus): void {
  if (currentSaveStatus === next) return;
  currentSaveStatus = next;
  for (const listener of saveStatusListeners) {
    listener(next);
  }
}

export function getSaveStatus(): SaveStatus {
  return currentSaveStatus;
}

export function getCurrentStorageBackend(): StorageBackend {
  return currentStorageBackend;
}

export function getCurrentRevision(): number {
  return currentKnownRevision;
}

export function subscribeSaveStatus(listener: (status: SaveStatus) => void): () => void {
  saveStatusListeners.add(listener);
  listener(currentSaveStatus);
  return () => {
    saveStatusListeners.delete(listener);
  };
}

function getBroadcastChannel(): BroadcastChannel | null {
  const BC =
    typeof globalThis !== 'undefined' && 'BroadcastChannel' in globalThis
      ? globalThis.BroadcastChannel
      : undefined;
  if (!BC) return null;

  if (!sharedBroadcastChannel) {
    try {
      sharedBroadcastChannel = new BC(BROADCAST_CHANNEL_NAME);
      sharedBroadcastChannel.onmessage = (event: MessageEvent) => {
        const data = event.data as { type?: string; tabId?: string; revision?: number } | null;
        if (data?.type === 'state_saved' && data.tabId && data.tabId !== TAB_INSTANCE_ID) {
          for (const listener of crossTabListeners) {
            listener({ revision: data.revision });
          }
        }
      };
    } catch {
      return null;
    }
  }
  return sharedBroadcastChannel;
}

export function notifyOtherTabsSaved(revision?: number): void {
  const ch = getBroadcastChannel();
  if (!ch) return;
  try {
    ch.postMessage({
      type: 'state_saved',
      tabId: TAB_INSTANCE_ID,
      revision,
      timestamp: Date.now(),
    });
  } catch {
    // Ignore closed channel or unsupported structured clone errors
  }
}

export function subscribeCrossTabChanges(
  listener: (detail: { revision?: number }) => void
): () => void {
  getBroadcastChannel();
  crossTabListeners.add(listener);
  return () => {
    crossTabListeners.delete(listener);
  };
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function reorderByIds<T extends { id: string }>(items: T[], orderIds?: unknown): T[] {
  if (!Array.isArray(orderIds) || orderIds.length === 0) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered: T[] = [];
  for (const id of orderIds) {
    if (typeof id === 'string') {
      const found = byId.get(id);
      if (found) {
        ordered.push(found);
        byId.delete(id);
      }
    }
  }
  for (const remaining of byId.values()) {
    ordered.push(remaining);
  }
  return ordered;
}

function getIndexedDbApi(): IDBFactory | null {
  if (typeof globalThis !== 'undefined' && 'indexedDB' in globalThis && globalThis.indexedDB) {
    return globalThis.indexedDB;
  }
  return null;
}

function getLocalStorageApi(): Storage | null {
  try {
    if (
      typeof globalThis !== 'undefined' &&
      'localStorage' in globalThis &&
      globalThis.localStorage
    ) {
      return globalThis.localStorage;
    }
    return null;
  } catch {
    return null;
  }
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  const idb = getIndexedDbApi();
  if (!idb) {
    return Promise.reject(new Error('IndexedDB is not supported in this browser'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        const docStore = db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('schoolYear', 'schoolYear', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_WNIOSKI)) {
        db.createObjectStore(STORE_WNIOSKI, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
        db.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SUPERVISION_PACKAGES)) {
        db.createObjectStore(STORE_SUPERVISION_PACKAGES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error('Failed to open IndexedDB'));
    };

    request.onblocked = () => {
      dbPromise = null;
      reject(new Error('IndexedDB open request blocked'));
    };
  });

  return dbPromise;
}

type LegacyReadResult =
  | { status: 'none' }
  | { status: 'valid'; state: AppState }
  | { status: 'corrupted' }
  | { status: 'read_error' };

function readLegacyLocalStorageDetailed(): LegacyReadResult {
  let raw: string | null = null;
  try {
    const ls = getLocalStorageApi();
    if (!ls) return { status: 'none' };
    raw = ls.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return { status: 'read_error' };
  }

  if (raw === null) return { status: 'none' };
  if (!raw.trim()) return { status: 'corrupted' };

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (
      !isPlainObject(parsed) ||
      !isPlainObject(parsed.profile) ||
      !Array.isArray(parsed.documents)
    ) {
      return { status: 'corrupted' };
    }
    const profile = sanitizeProfile(parsed.profile as Partial<TeacherProfile>);
    const documents = sanitizeDocuments(parsed.documents, profile);
    const activeId =
      typeof parsed.activeDocumentId === 'string' &&
      documents.some((d) => d.id === parsed.activeDocumentId)
        ? parsed.activeDocumentId
        : documents[0]?.id ?? null;

    return {
      status: 'valid',
      state: {
        version: typeof parsed.version === 'number' && Number.isFinite(parsed.version) ? parsed.version : 1,
        profile,
        documents,
        activeDocumentId: activeId,
        customWnioski: sanitizeCustomWnioski(parsed.customWnioski),
        customTemplates: sanitizeCustomTemplates(parsed.customTemplates),
        supervisionPackages: sanitizeSupervisionPackages(parsed.supervisionPackages),
        supervisionClassNotes: sanitizeSupervisionClassNotes(parsed.supervisionClassNotes),
      },
    };
  } catch {
    return { status: 'corrupted' };
  }
}

function clearLegacyLocalStorage(): void {
  try {
    const ls = getLocalStorageApi();
    if (ls) {
      ls.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

function sanitizeTermsAcceptanceRecord(raw: unknown): TermsAcceptanceRecord | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.accepted !== 'boolean') return null;
  return {
    accepted: raw.accepted,
    pending: typeof raw.pending === 'boolean' ? raw.pending : undefined,
    acceptedAt:
      typeof raw.acceptedAt === 'string' && raw.acceptedAt.trim()
        ? sanitizeIsoDate(raw.acceptedAt, '') || null
        : null,
    version: asStr(raw.version, APP_VERSION, 64),
  };
}

function sanitizeBackupReminderMetaRecord(raw: unknown): BackupReminderMeta {
  if (!isPlainObject(raw)) {
    return { lastBackupExportAt: null, snoozedUntil: null };
  }
  const lastBackup =
    typeof raw.lastBackupExportAt === 'string' && raw.lastBackupExportAt.trim()
      ? sanitizeIsoDate(raw.lastBackupExportAt, '') || null
      : null;
  const snoozed =
    typeof raw.snoozedUntil === 'string' && raw.snoozedUntil.trim()
      ? sanitizeIsoDate(raw.snoozedUntil, '') || null
      : null;
  return {
    lastBackupExportAt: lastBackup,
    snoozedUntil: snoozed,
  };
}

function pickLatestIsoDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (!Number.isFinite(ta)) return b;
  if (!Number.isFinite(tb)) return a;
  return tb > ta ? b : a;
}

function mergeBackupReminderMeta(a: BackupReminderMeta, b: BackupReminderMeta): BackupReminderMeta {
  return {
    lastBackupExportAt: pickLatestIsoDate(a.lastBackupExportAt, b.lastBackupExportAt),
    snoozedUntil: pickLatestIsoDate(a.snoozedUntil, b.snoozedUntil),
  };
}

function readLocalTermsAcceptance(): TermsAcceptanceRecord | null {
  try {
    const ls = getLocalStorageApi();
    if (!ls) return null;
    const raw = ls.getItem(TERMS_ACCEPTANCE_LS_KEY);
    if (!raw) return null;
    return sanitizeTermsAcceptanceRecord(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocalTermsAcceptance(record: TermsAcceptanceRecord | null): void {
  try {
    const ls = getLocalStorageApi();
    if (!ls) return;
    if (!record) {
      ls.removeItem(TERMS_ACCEPTANCE_LS_KEY);
    } else {
      ls.setItem(TERMS_ACCEPTANCE_LS_KEY, JSON.stringify(record));
    }
  } catch {
    // Ignore storage access errors
  }
}

function readLocalBackupReminderMeta(): BackupReminderMeta {
  try {
    const ls = getLocalStorageApi();
    if (!ls) return { lastBackupExportAt: null, snoozedUntil: null };
    const raw = ls.getItem(BACKUP_REMINDER_LS_KEY);
    if (!raw) return { lastBackupExportAt: null, snoozedUntil: null };
    return sanitizeBackupReminderMetaRecord(JSON.parse(raw));
  } catch {
    return { lastBackupExportAt: null, snoozedUntil: null };
  }
}

function writeLocalBackupReminderMeta(meta: BackupReminderMeta | null): void {
  try {
    const ls = getLocalStorageApi();
    if (!ls) return;
    if (!meta) {
      ls.removeItem(BACKUP_REMINDER_LS_KEY);
    } else {
      ls.setItem(BACKUP_REMINDER_LS_KEY, JSON.stringify(meta));
    }
  } catch {
    // Ignore storage access errors
  }
}

function setCachedBackupReminderMeta(next: BackupReminderMeta): void {
  cachedBackupReminderMeta = next;
  for (const listener of backupMetaListeners) {
    listener(next);
  }
}

export function getBackupReminderMeta(): BackupReminderMeta {
  return cachedBackupReminderMeta;
}

export function subscribeBackupReminderMeta(
  listener: (meta: BackupReminderMeta) => void
): () => void {
  backupMetaListeners.add(listener);
  listener(cachedBackupReminderMeta);
  return () => {
    backupMetaListeners.delete(listener);
  };
}

async function writeMetaRecordToDb(key: string, value: unknown): Promise<void> {
  if (!getIndexedDbApi() || currentStorageBackend !== 'indexeddb') return;
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_META], 'readwrite');
    tx.objectStore(STORE_META).put({ key, value });
    await txDone(tx);
  } catch {
    // Best-effort meta persistence; localStorage fallback preserves value
  }
}

async function writeStateToDb(
  state: AppState,
  options?: {
    replaceAll?: boolean;
    forceOverwriteRevision?: boolean;
    initialTermsRecord?: TermsAcceptanceRecord;
    resetBackupMeta?: boolean;
  }
): Promise<SaveResult> {
  if (!getIndexedDbApi()) {
    return { ok: false, reason: 'unavailable', error: 'IndexedDB niedostępne w przeglądarce.' };
  }

  let db: IDBDatabase;
  try {
    db = await openDatabase();
  } catch (err) {
    return {
      ok: false,
      reason: 'unavailable',
      error: err instanceof Error ? err.message : 'Nie można otworzyć bazy IndexedDB.',
    };
  }

  const replaceAll = Boolean(options?.replaceAll || !lastPersistedState);
  if (
    !replaceAll &&
    !options?.forceOverwriteRevision &&
    lastPersistedState === state &&
    currentSaveStatus === 'saved'
  ) {
    return { ok: true, revision: currentKnownRevision };
  }

  let conflictInfo: { dbRevision: number } | null = null;
  let committedNextRevision = 0;

  try {
    const prev = replaceAll ? null : lastPersistedState;
    const tx = db.transaction(
      [
        STORE_META,
        STORE_DOCUMENTS,
        STORE_WNIOSKI,
        STORE_TEMPLATES,
        STORE_SUPERVISION_PACKAGES,
      ],
      'readwrite'
    );
    const metaStore = tx.objectStore(STORE_META);
    const docStore = tx.objectStore(STORE_DOCUMENTS);
    const wnioskiStore = tx.objectStore(STORE_WNIOSKI);
    const templatesStore = tx.objectStore(STORE_TEMPLATES);
    const supervisionStore = tx.objectStore(STORE_SUPERVISION_PACKAGES);

    const revReq = metaStore.get('revision');
    revReq.onsuccess = () => {
      const rec = revReq.result as MetaRecord<number> | undefined;
      const dbRevision =
        typeof rec?.value === 'number' && Number.isInteger(rec.value) && rec.value >= 0
          ? rec.value
          : 0;

      if (!options?.forceOverwriteRevision && dbRevision > currentKnownRevision) {
        conflictInfo = { dbRevision };
        try {
          tx.abort();
        } catch {
          // Ignore abort errors
        }
        return;
      }

      const nextRevision = Math.max(dbRevision, currentKnownRevision, 0) + 1;
      committedNextRevision = nextRevision;

      metaStore.put({ key: 'revision', value: nextRevision });

      if (!prev) {
        metaStore.put({ key: 'initialized', value: true });
        metaStore.put({ key: 'version', value: state.version });
        metaStore.put({ key: 'profile', value: state.profile });
        metaStore.put({ key: 'activeDocumentId', value: state.activeDocumentId });
        metaStore.put({ key: 'documentOrder', value: state.documents.map((d) => d.id) });
        metaStore.put({ key: 'customWnioskiOrder', value: state.customWnioski.map((w) => w.id) });
        metaStore.put({
          key: 'customTemplatesOrder',
          value: state.customTemplates.map((t) => t.id),
        });
        metaStore.put({
          key: 'supervisionPackageOrder',
          value: state.supervisionPackages.map((p) => p.id),
        });
        metaStore.put({ key: 'supervisionClassNotes', value: state.supervisionClassNotes });
        if (options?.initialTermsRecord) {
          metaStore.put({ key: 'termsAcceptance', value: options.initialTermsRecord });
        }
        if (options?.resetBackupMeta) {
          metaStore.put({
            key: 'backupReminderMeta',
            value: { lastBackupExportAt: null, snoozedUntil: null },
          });
        }
      } else {
        if (prev.version !== state.version) {
          metaStore.put({ key: 'version', value: state.version });
        }
        if (prev.profile !== state.profile) {
          metaStore.put({ key: 'profile', value: state.profile });
        }
        if (prev.activeDocumentId !== state.activeDocumentId) {
          metaStore.put({ key: 'activeDocumentId', value: state.activeDocumentId });
        }
        const prevDocOrder = prev.documents.map((d) => d.id);
        const nextDocOrder = state.documents.map((d) => d.id);
        if (!arraysEqual(prevDocOrder, nextDocOrder)) {
          metaStore.put({ key: 'documentOrder', value: nextDocOrder });
        }
        const prevWnioskiOrder = prev.customWnioski.map((w) => w.id);
        const nextWnioskiOrder = state.customWnioski.map((w) => w.id);
        if (!arraysEqual(prevWnioskiOrder, nextWnioskiOrder)) {
          metaStore.put({ key: 'customWnioskiOrder', value: nextWnioskiOrder });
        }
        const prevTemplatesOrder = prev.customTemplates.map((t) => t.id);
        const nextTemplatesOrder = state.customTemplates.map((t) => t.id);
        if (!arraysEqual(prevTemplatesOrder, nextTemplatesOrder)) {
          metaStore.put({ key: 'customTemplatesOrder', value: nextTemplatesOrder });
        }
        const prevPkgOrder = prev.supervisionPackages.map((p) => p.id);
        const nextPkgOrder = state.supervisionPackages.map((p) => p.id);
        if (!arraysEqual(prevPkgOrder, nextPkgOrder)) {
          metaStore.put({ key: 'supervisionPackageOrder', value: nextPkgOrder });
        }
        if (prev.supervisionClassNotes !== state.supervisionClassNotes) {
          metaStore.put({ key: 'supervisionClassNotes', value: state.supervisionClassNotes });
        }
      }

      if (!prev) {
        docStore.clear();
        for (const doc of state.documents) {
          docStore.put(doc);
        }
      } else if (prev.documents !== state.documents) {
        const prevMap = new Map(prev.documents.map((d) => [d.id, d]));
        const nextIds = new Set(state.documents.map((d) => d.id));
        for (const oldId of prevMap.keys()) {
          if (!nextIds.has(oldId)) {
            docStore.delete(oldId);
          }
        }
        for (const doc of state.documents) {
          if (prevMap.get(doc.id) !== doc) {
            docStore.put(doc);
          }
        }
      }

      if (!prev) {
        wnioskiStore.clear();
        for (const entry of state.customWnioski) {
          wnioskiStore.put(entry);
        }
      } else if (prev.customWnioski !== state.customWnioski) {
        const prevMap = new Map(prev.customWnioski.map((w) => [w.id, w]));
        const nextIds = new Set(state.customWnioski.map((w) => w.id));
        for (const oldId of prevMap.keys()) {
          if (!nextIds.has(oldId)) {
            wnioskiStore.delete(oldId);
          }
        }
        for (const entry of state.customWnioski) {
          if (prevMap.get(entry.id) !== entry) {
            wnioskiStore.put(entry);
          }
        }
      }

      if (!prev) {
        templatesStore.clear();
        for (const tpl of state.customTemplates) {
          templatesStore.put(tpl);
        }
      } else if (prev.customTemplates !== state.customTemplates) {
        const prevMap = new Map(prev.customTemplates.map((t) => [t.id, t]));
        const nextIds = new Set(state.customTemplates.map((t) => t.id));
        for (const oldId of prevMap.keys()) {
          if (!nextIds.has(oldId)) {
            templatesStore.delete(oldId);
          }
        }
        for (const tpl of state.customTemplates) {
          if (prevMap.get(tpl.id) !== tpl) {
            templatesStore.put(tpl);
          }
        }
      }

      if (!prev) {
        supervisionStore.clear();
        for (const pkg of state.supervisionPackages) {
          supervisionStore.put(pkg);
        }
      } else if (prev.supervisionPackages !== state.supervisionPackages) {
        const prevMap = new Map(prev.supervisionPackages.map((p) => [p.id, p]));
        const nextIds = new Set(state.supervisionPackages.map((p) => p.id));
        for (const oldId of prevMap.keys()) {
          if (!nextIds.has(oldId)) {
            supervisionStore.delete(oldId);
          }
        }
        for (const pkg of state.supervisionPackages) {
          if (prevMap.get(pkg.id) !== pkg) {
            supervisionStore.put(pkg);
          }
        }
      }
    };

    await txDone(tx);
    currentKnownRevision = committedNextRevision;
    lastPersistedState = state;
    currentStorageBackend = 'indexeddb';
    return { ok: true, revision: committedNextRevision };
  } catch (err) {
    if (conflictInfo) {
      return {
        ok: false,
        reason: 'conflict',
        dbRevision: (conflictInfo as { dbRevision: number }).dbRevision,
      };
    }
    return {
      ok: false,
      reason: 'error',
      error: err instanceof Error ? err.message : 'Błąd transakcji zapisu w IndexedDB.',
    };
  }
}

export async function readIndexedDbStateOnly(): Promise<{
  found: boolean;
  state?: AppState;
  revision: number;
  termsAcceptance?: TermsAcceptanceRecord | null;
  backupReminderMeta?: BackupReminderMeta;
}> {
  const db = await openDatabase();
  const tx = db.transaction(
    [
      STORE_META,
      STORE_DOCUMENTS,
      STORE_WNIOSKI,
      STORE_TEMPLATES,
      STORE_SUPERVISION_PACKAGES,
    ],
    'readonly'
  );
  const [metaRecords, rawDocs, rawWnioski, rawTemplates, rawPackages] = await Promise.all([
    reqToPromise<MetaRecord[]>(tx.objectStore(STORE_META).getAll()),
    reqToPromise<AppState['documents']>(tx.objectStore(STORE_DOCUMENTS).getAll()),
    reqToPromise<CustomWniosekEntry[]>(tx.objectStore(STORE_WNIOSKI).getAll()),
    reqToPromise<CustomTemplateEntry[]>(tx.objectStore(STORE_TEMPLATES).getAll()),
    reqToPromise<TeacherSupervisionPackage[]>(
      tx.objectStore(STORE_SUPERVISION_PACKAGES).getAll()
    ),
  ]);
  await txDone(tx);

  const metaMap = new Map<string, unknown>(metaRecords.map((m) => [m.key, m.value]));
  const termsAcceptance = sanitizeTermsAcceptanceRecord(metaMap.get('termsAcceptance'));
  const backupReminderMeta = sanitizeBackupReminderMetaRecord(metaMap.get('backupReminderMeta'));
  const hasExistingDbData =
    metaMap.get('initialized') === true ||
    metaMap.has('profile') ||
    rawDocs.length > 0 ||
    rawPackages.length > 0;

  if (!hasExistingDbData) {
    return { found: false, revision: 0, termsAcceptance, backupReminderMeta };
  }

  const rawProfile = metaMap.get('profile') as Partial<TeacherProfile> | undefined;
  const profile = sanitizeProfile(isPlainObject(rawProfile) ? rawProfile : {});
  const orderedDocs = sanitizeDocuments(
    reorderByIds(rawDocs, metaMap.get('documentOrder')),
    profile
  );
  const orderedWnioski = sanitizeCustomWnioski(
    reorderByIds(rawWnioski, metaMap.get('customWnioskiOrder'))
  );
  const orderedTemplates = sanitizeCustomTemplates(
    reorderByIds(rawTemplates, metaMap.get('customTemplatesOrder'))
  );
  const orderedPackages = sanitizeSupervisionPackages(
    reorderByIds(rawPackages, metaMap.get('supervisionPackageOrder'))
  );
  const rawActiveId = metaMap.get('activeDocumentId');
  const activeDocumentId =
    typeof rawActiveId === 'string' && orderedDocs.some((d) => d.id === rawActiveId)
      ? rawActiveId
      : orderedDocs[0]?.id ?? null;

  const rawRevision = metaMap.get('revision');
  const revision =
    typeof rawRevision === 'number' && Number.isInteger(rawRevision) && rawRevision >= 1
      ? rawRevision
      : 1;

  const hydrated: AppState = {
    version:
      typeof metaMap.get('version') === 'number' && Number.isFinite(metaMap.get('version'))
        ? (metaMap.get('version') as number)
        : 1,
    profile,
    documents: orderedDocs,
    activeDocumentId,
    customWnioski: orderedWnioski,
    customTemplates: orderedTemplates,
    supervisionPackages: orderedPackages,
    supervisionClassNotes: sanitizeSupervisionClassNotes(metaMap.get('supervisionClassNotes')),
  };

  return {
    found: true,
    state: hydrated,
    revision,
    termsAcceptance,
    backupReminderMeta,
  };
}

export async function loadAppState(): Promise<LoadAppStateResult> {
  const lsTerms = readLocalTermsAcceptance();
  const lsBackupMeta = readLocalBackupReminderMeta();

  try {
    const dbRead = await readIndexedDbStateOnly();
    const legacy = readLegacyLocalStorageDetailed();

    const mergedBackupMeta = mergeBackupReminderMeta(
      dbRead.backupReminderMeta ?? { lastBackupExportAt: null, snoozedUntil: null },
      lsBackupMeta
    );
    setCachedBackupReminderMeta(mergedBackupMeta);

    const isVersionBelowRequired = (ver: string | null | undefined): boolean => {
      if (!ver) return false;
      const parseParts = (v: string) =>
        v
          .trim()
          .split('.')
          .map((part) => Number.parseInt(part, 10) || 0);
      const a = parseParts(ver);
      const b = parseParts(MIN_REQUIRED_TERMS_VERSION);
      const len = Math.max(a.length, b.length);
      for (let i = 0; i < len; i += 1) {
        const av = a[i] ?? 0;
        const bv = b[i] ?? 0;
        if (av < bv) return true;
        if (av > bv) return false;
      }
      return false;
    };

    const acceptedVersion = dbRead.termsAcceptance?.version ?? lsTerms?.version ?? null;
    const isOutdatedAcceptedTerms = isVersionBelowRequired(acceptedVersion);

    const isTermsAccepted =
      (dbRead.termsAcceptance?.accepted === true || lsTerms?.accepted === true) &&
      !isOutdatedAcceptedTerms;

    if (dbRead.found && dbRead.state) {
      currentKnownRevision = dbRead.revision;
      lastPersistedState = dbRead.state;
      currentStorageBackend = 'indexeddb';
      setSaveStatus('saved');

      // Clear only valid migrated legacy key once DB is already populated & verified;
      // preserve corrupted legacy data so user is not misled or deprived of manual recovery.
      if (legacy.status === 'valid') {
        clearLegacyLocalStorage();
      }

      // Require acceptance on pending initial boot OR when an explicit prior acceptance version is outdated
      const requiresTermsAcceptance =
        (!isTermsAccepted && dbRead.termsAcceptance?.pending === true) ||
        isOutdatedAcceptedTerms;

      return {
        state: dbRead.state,
        backend: 'indexeddb',
        legacyStatus:
          legacy.status === 'corrupted' || legacy.status === 'read_error'
            ? legacy.status
            : 'none',
        revision: dbRead.revision,
        requiresTermsAcceptance,
        backupReminderMeta: mergedBackupMeta,
      };
    }

    if (legacy.status === 'valid') {
      const saveRes = await saveAppStateImmediate(legacy.state, {
        replaceAll: true,
        forceOverwriteRevision: true,
      });
      if (saveRes.ok) {
        clearLegacyLocalStorage();
        return {
          state: legacy.state,
          backend: 'indexeddb',
          legacyStatus: 'migrated',
          revision: saveRes.revision,
          requiresTermsAcceptance: false,
          backupReminderMeta: mergedBackupMeta,
        };
      }
      currentStorageBackend = 'memory';
      setSaveStatus('memory_only');
      return {
        state: legacy.state,
        backend: 'memory',
        legacyStatus: 'migration_write_failed',
        revision: 0,
        requiresTermsAcceptance: false,
        backupReminderMeta: mergedBackupMeta,
      };
    }

    if (legacy.status === 'corrupted' || legacy.status === 'read_error') {
      // Do not overwrite DB or delete legacy key when legacy read failed or is corrupted
      currentKnownRevision = 0;
      lastPersistedState = null;
      currentStorageBackend = 'indexeddb';
      setSaveStatus('error');
      return {
        state: createInitialAppState(),
        backend: 'indexeddb',
        legacyStatus: legacy.status,
        revision: 0,
        requiresTermsAcceptance: false,
        backupReminderMeta: mergedBackupMeta,
      };
    }

    const initialState = createInitialAppState();
    const requiresTermsAcceptance = !isTermsAccepted;
    const pendingTermsRecord: TermsAcceptanceRecord | undefined = requiresTermsAcceptance
      ? { accepted: false, pending: true, acceptedAt: null, version: APP_VERSION }
      : undefined;

    const saveRes = await saveAppStateImmediate(initialState, {
      replaceAll: true,
      forceOverwriteRevision: true,
      initialTermsRecord: pendingTermsRecord,
    });
    if (saveRes.ok) {
      return {
        state: initialState,
        backend: 'indexeddb',
        legacyStatus: 'none',
        revision: saveRes.revision,
        requiresTermsAcceptance,
        backupReminderMeta: mergedBackupMeta,
      };
    }

    currentStorageBackend = 'memory';
    setSaveStatus('memory_only');
    return {
      state: initialState,
      backend: 'memory',
      legacyStatus: 'none',
      revision: 0,
      requiresTermsAcceptance,
      backupReminderMeta: mergedBackupMeta,
    };
  } catch {
    currentStorageBackend = 'memory';
    setSaveStatus('memory_only');
    const legacy = readLegacyLocalStorageDetailed();
    setCachedBackupReminderMeta(lsBackupMeta);
    const requiresTermsAcceptance =
      legacy.status !== 'valid' &&
      legacy.status !== 'corrupted' &&
      legacy.status !== 'read_error' &&
      lsTerms?.accepted !== true;
    return {
      state: legacy.status === 'valid' ? legacy.state : createInitialAppState(),
      backend: 'memory',
      legacyStatus:
        legacy.status === 'valid'
          ? 'migration_write_failed'
          : legacy.status === 'corrupted' || legacy.status === 'read_error'
            ? legacy.status
            : 'none',
      revision: 0,
      dbReadError: 'Nie udało się odczytać lokalnej bazy IndexedDB.',
      requiresTermsAcceptance,
      backupReminderMeta: lsBackupMeta,
    };
  }
}

export async function reloadAppStateFromDb(): Promise<
  | { ok: true; state: AppState; revision: number }
  | { ok: false; error: string }
> {
  try {
    const dbRead = await readIndexedDbStateOnly();
    if (!dbRead.found || !dbRead.state) {
      return { ok: false, error: 'W bazie IndexedDB nie znaleziono zapisanej sesji.' };
    }
    if (debounceTimer !== null) {
      globalThis.clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    pendingStateToSave = null;
    currentKnownRevision = dbRead.revision;
    lastPersistedState = dbRead.state;
    currentStorageBackend = 'indexeddb';
    setSaveStatus('saved');
    return { ok: true, state: dbRead.state, revision: dbRead.revision };
  } catch {
    return { ok: false, error: 'Nie udało się ponownie odczytać bazy IndexedDB.' };
  }
}

export function saveAppStateImmediate(
  state: AppState,
  options?: {
    replaceAll?: boolean;
    forceOverwriteRevision?: boolean;
    initialTermsRecord?: TermsAcceptanceRecord;
    resetBackupMeta?: boolean;
  }
): Promise<SaveResult> {
  if (debounceTimer !== null) {
    globalThis.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingStateToSave = null;

  if (currentSaveStatus === 'conflict' && !options?.forceOverwriteRevision) {
    return Promise.resolve({
      ok: false,
      reason: 'conflict',
      dbRevision: currentKnownRevision,
    });
  }

  if (currentStorageBackend === 'indexeddb') {
    setSaveStatus('saving');
  }

  const task = writeQueue.then(async (): Promise<SaveResult> => {
    const res = await writeStateToDb(state, options);
    if (res.ok) {
      setSaveStatus('saved');
      notifyOtherTabsSaved(res.revision);
      return res;
    }
    if (res.reason === 'conflict') {
      setSaveStatus('conflict');
    } else if (res.reason === 'unavailable' || currentStorageBackend === 'memory') {
      currentStorageBackend = 'memory';
      setSaveStatus('memory_only');
    } else {
      setSaveStatus('error');
    }
    return res;
  });

  writeQueue = task.catch((): SaveResult => {
    setSaveStatus(currentStorageBackend === 'memory' ? 'memory_only' : 'error');
    return { ok: false, reason: 'error', error: 'Nieoczekiwany błąd kolejki zapisu.' };
  });

  return task;
}

export function scheduleSaveAppState(state: AppState, delayMs = 250): void {
  if (currentSaveStatus === 'conflict') {
    // Do not overwrite conflicting newer revision in IndexedDB
    return;
  }
  pendingStateToSave = state;
  if (currentStorageBackend === 'memory') {
    setSaveStatus('memory_only');
    return;
  }

  setSaveStatus('saving');
  if (debounceTimer !== null) {
    globalThis.clearTimeout(debounceTimer);
  }
  debounceTimer = globalThis.setTimeout(() => {
    debounceTimer = null;
    if (pendingStateToSave) {
      const target = pendingStateToSave;
      pendingStateToSave = null;
      void saveAppStateImmediate(target);
    }
  }, delayMs);
}

export function flushPendingAppStateSave(): void {
  if (debounceTimer !== null) {
    globalThis.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (currentStorageBackend === 'memory' || currentSaveStatus === 'conflict') {
    return;
  }
  if (pendingStateToSave) {
    const target = pendingStateToSave;
    pendingStateToSave = null;
    void saveAppStateImmediate(target);
  }
}

export async function retryIndexedDbPersistence(state: AppState): Promise<SaveResult> {
  currentStorageBackend = 'indexeddb';
  dbPromise = null;
  const res = await saveAppStateImmediate(state, {
    replaceAll: true,
    forceOverwriteRevision: true,
  });
  if (res.ok) {
    const legacy = readLegacyLocalStorageDetailed();
    if (legacy.status === 'valid') {
      clearLegacyLocalStorage();
    }
  }
  return res;
}

export async function acceptTermsAndConditions(
  version: string = APP_VERSION
): Promise<TermsAcceptanceRecord> {
  const record: TermsAcceptanceRecord = {
    accepted: true,
    pending: false,
    acceptedAt: new Date().toISOString(),
    version,
  };
  writeLocalTermsAcceptance(record);
  await writeMetaRecordToDb('termsAcceptance', record);
  return record;
}

export async function recordBackupExportNow(): Promise<BackupReminderMeta> {
  const next: BackupReminderMeta = {
    lastBackupExportAt: new Date().toISOString(),
    snoozedUntil: null,
  };
  setCachedBackupReminderMeta(next);
  writeLocalBackupReminderMeta(next);
  await writeMetaRecordToDb('backupReminderMeta', next);
  return next;
}

export async function snoozeBackupReminder(
  days: number = BACKUP_REMINDER_SNOOZE_DAYS
): Promise<BackupReminderMeta> {
  const snoozeMs = Math.max(1, days) * 24 * 60 * 60 * 1000;
  const next: BackupReminderMeta = {
    lastBackupExportAt: cachedBackupReminderMeta.lastBackupExportAt,
    snoozedUntil: new Date(Date.now() + snoozeMs).toISOString(),
  };
  setCachedBackupReminderMeta(next);
  writeLocalBackupReminderMeta(next);
  await writeMetaRecordToDb('backupReminderMeta', next);
  return next;
}

export function hasUserWorkWorthBackingUp(state: AppState): boolean {
  if (
    state.documents.length > 1 ||
    state.customWnioski.length > 0 ||
    state.customTemplates.length > 0 ||
    state.supervisionPackages.length > 0 ||
    Object.keys(state.supervisionClassNotes).length > 0
  ) {
    return true;
  }

  if (
    state.profile.fullName.trim().length > 0 ||
    state.profile.schoolName.trim().length > 0 ||
    state.profile.homeroomClass.trim().length > 0 ||
    state.profile.classesList.length > 0 ||
    state.profile.subjectAssignments.some(
      (a) =>
        a.programNumber.trim().length > 0 ||
        a.textbookNumber.trim().length > 0 ||
        a.textbookTitle.trim().length > 0
    )
  ) {
    return true;
  }

  return state.documents.some((doc) => {
    if (doc.updatedAt !== doc.createdAt) return true;
    if (doc.type === 'efekty_nauczania') {
      return Boolean(
        doc.teacherName.trim() ||
          doc.curriculumScope.trim() ||
          doc.curriculumNotes.trim() ||
          doc.futureConclusions.trim() ||
          doc.educationalTrips.trim() ||
          doc.preventiveProgram.trim()
      );
    }
    return true;
  });
}

export function shouldShowBackupReminder(
  state: AppState,
  meta: BackupReminderMeta,
  nowMs: number = Date.now()
): {
  show: boolean;
  reason: 'never_backed_up' | 'stale_backup' | null;
  daysSinceLastBackup: number | null;
} {
  if (!hasUserWorkWorthBackingUp(state)) {
    return { show: false, reason: null, daysSinceLastBackup: null };
  }

  if (meta.snoozedUntil) {
    const snoozeTs = Date.parse(meta.snoozedUntil);
    if (Number.isFinite(snoozeTs) && snoozeTs > nowMs) {
      return { show: false, reason: null, daysSinceLastBackup: null };
    }
  }

  if (!meta.lastBackupExportAt) {
    return { show: true, reason: 'never_backed_up', daysSinceLastBackup: null };
  }

  const lastExportTs = Date.parse(meta.lastBackupExportAt);
  if (!Number.isFinite(lastExportTs)) {
    return { show: true, reason: 'never_backed_up', daysSinceLastBackup: null };
  }

  const elapsedMs = Math.max(0, nowMs - lastExportTs);
  const daysSince = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
  if (daysSince >= BACKUP_REMINDER_INTERVAL_DAYS) {
    return { show: true, reason: 'stale_backup', daysSinceLastBackup: daysSince };
  }

  return { show: false, reason: null, daysSinceLastBackup: daysSince };
}

export async function resetAllStoredState(freshState: AppState): Promise<SaveResult> {
  clearLegacyLocalStorage();
  writeLocalTermsAcceptance(null);
  writeLocalBackupReminderMeta(null);
  setCachedBackupReminderMeta({ lastBackupExportAt: null, snoozedUntil: null });
  lastPersistedState = null;
  return saveAppStateImmediate(freshState, {
    replaceAll: true,
    forceOverwriteRevision: true,
    initialTermsRecord: {
      accepted: false,
      pending: true,
      acceptedAt: null,
      version: APP_VERSION,
    },
    resetBackupMeta: true,
  });
}

export async function exportRawIndexedDbBackup(): Promise<boolean> {
  try {
    const dbRead = await readIndexedDbStateOnly();
    if (dbRead.found && dbRead.state) {
      return exportStateAsJson(dbRead.state);
    }
  } catch {
    // Fall back to legacy localStorage check without modifying storage
  }
  const legacy = readLegacyLocalStorageDetailed();
  if (legacy.status === 'valid') {
    return exportStateAsJson(legacy.state);
  }
  return false;
}

export async function wipeDatabaseForRecovery(): Promise<void> {
  clearLegacyLocalStorage();
  writeLocalTermsAcceptance(null);
  writeLocalBackupReminderMeta(null);
  setCachedBackupReminderMeta({ lastBackupExportAt: null, snoozedUntil: null });
  lastPersistedState = null;
  currentKnownRevision = 0;
  dbPromise = null;
  const idb = getIndexedDbApi();
  if (idb) {
    await new Promise<void>((resolve) => {
      const req = idb.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  }
}

export function resetStorageRuntimeForTests(): void {
  if (debounceTimer !== null) {
    globalThis.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingStateToSave = null;
  lastPersistedState = null;
  currentKnownRevision = 0;
  currentStorageBackend = 'indexeddb';
  currentSaveStatus = 'saved';
  cachedBackupReminderMeta = { lastBackupExportAt: null, snoozedUntil: null };
  writeQueue = Promise.resolve({ ok: true, revision: 0 });
  dbPromise = null;
  if (sharedBroadcastChannel) {
    try {
      sharedBroadcastChannel.close();
    } catch {
      // Ignore close errors
    }
    sharedBroadcastChannel = null;
  }
  saveStatusListeners.clear();
  crossTabListeners.clear();
  backupMetaListeners.clear();
}

export function exportStateAsJson(state: AppState): boolean {
  const payload = {
    app: 'E-Sprawozdania',
    exportedAt: new Date().toISOString(),
    ...state,
  };
  const dateTag = new Date().toISOString().slice(0, 10);
  const ok = triggerJsonDownload(payload, `sprawozdania-kopia-${dateTag}.json`);
  if (ok) {
    void recordBackupExportNow();
  }
  return ok;
}

export function validateAndParseImportedJson(jsonText: string):
  | { ok: true; state: AppState }
  | { ok: false; error: string } {
  if (typeof jsonText !== 'string' || jsonText.trim().length === 0) {
    return { ok: false, error: 'Wybrany plik JSON jest pusty.' };
  }
  if (jsonText.length > MAX_IMPORT_JSON_CHARS) {
    return {
      ok: false,
      error: `Zawartość pliku JSON przekracza dopuszczalny limit rozmiaru (${MAX_IMPORT_FILE_MIB} MiB) i nie została przetworzona.`,
    };
  }
  try {
    const data = JSON.parse(jsonText) as Record<string, unknown>;
    if (!isPlainObject(data)) {
      return { ok: false, error: 'Plik nie zawiera prawidłowego obiektu JSON.' };
    }
    if (data.app !== undefined && data.app !== 'E-Sprawozdania') {
      return {
        ok: false,
        error: 'Wybrany plik nie jest kopią aplikacji E-Sprawozdania (niezgodne pole „app”).',
      };
    }
    if (data.kind === 'phrases_bundle') {
      return {
        ok: false,
        error:
          'To jest plik bazy wniosków i szablonów. Zaimportuj go w zakładce „Wnioski i szablony” -> „Udostępnianie”.',
      };
    }
    if (data.kind === 'supervision_package') {
      return {
        ok: false,
        error:
          'To jest paczka sprawozdań dla dyrektora. Zaimportuj ją w panelu „Nadzór dyrektora”.',
      };
    }
    if (data.kind !== undefined && data.kind !== 'full_backup') {
      return { ok: false, error: 'Nieznany typ pliku kopii JSON.' };
    }
    if (
      data.version !== undefined &&
      (typeof data.version !== 'number' || !Number.isFinite(data.version) || data.version < 1)
    ) {
      return { ok: false, error: 'Plik zawiera nieprawidłowy numer wersji.' };
    }

    if (!isPlainObject(data.profile)) {
      return { ok: false, error: 'Brak sekcji profilu nauczyciela (profile) w pliku.' };
    }
    if (
      data.profile.subjectAssignments !== undefined &&
      !Array.isArray(data.profile.subjectAssignments)
    ) {
      return {
        ok: false,
        error: 'Sekcja przypisań przedmiotów w profilu ma nieprawidłowy format.',
      };
    }
    if (Array.isArray(data.profile.subjectAssignments)) {
      const dupAssign = findDuplicateExplicitId(data.profile.subjectAssignments);
      if (dupAssign) {
        return {
          ok: false,
          error: 'Wykryto zduplikowane identyfikatory w przypisaniach przedmiotów profilu.',
        };
      }
    }

    if (!Array.isArray(data.documents)) {
      return { ok: false, error: 'Brak listy dokumentów (documents) w pliku.' };
    }

    const hasInvalidDoc = data.documents.some((doc) => !isValidReportDocument(doc));
    if (hasInvalidDoc) {
      return {
        ok: false,
        error:
          'Co najmniej jeden dokument w pliku ma nieznany typ lub uszkodzoną strukturę.',
      };
    }

    const dupDocs = findDuplicateExplicitId(data.documents, [
      'rows',
      'subjectHours',
      'directorTasks',
      'teacherInitiativeTasks',
    ]);
    if (dupDocs) {
      return {
        ok: false,
        error:
          dupDocs.kind === 'top'
            ? 'Wykryto zduplikowane identyfikatory dokumentów w pliku.'
            : 'Wykryto zduplikowane identyfikatory wierszy wewnątrz dokumentu.',
      };
    }

    if (data.customWnioski !== undefined) {
      if (!Array.isArray(data.customWnioski)) {
        return { ok: false, error: 'Lista własnych wniosków (customWnioski) ma błędny format.' };
      }
      if (findDuplicateExplicitId(data.customWnioski)) {
        return {
          ok: false,
          error: 'Wykryto zduplikowane identyfikatory w kolekcji własnych wniosków.',
        };
      }
    }

    if (data.customTemplates !== undefined) {
      if (!Array.isArray(data.customTemplates)) {
        return {
          ok: false,
          error: 'Lista szablonów własnych (customTemplates) ma błędny format.',
        };
      }
      if (findDuplicateExplicitId(data.customTemplates)) {
        return {
          ok: false,
          error: 'Wykryto zduplikowane identyfikatory w kolekcji szablonów własnych.',
        };
      }
    }

    if (data.supervisionPackages !== undefined) {
      if (!Array.isArray(data.supervisionPackages)) {
        return {
          ok: false,
          error: 'Lista pakietów nadzoru (supervisionPackages) ma błędny format.',
        };
      }
      if (findDuplicateExplicitId(data.supervisionPackages, ['documents'])) {
        return {
          ok: false,
          error: 'Wykryto zduplikowane identyfikatory w kolekcji pakietów nadzoru.',
        };
      }
    }

    if (data.supervisionClassNotes !== undefined && !isPlainObject(data.supervisionClassNotes)) {
      return {
        ok: false,
        error: 'Notatki klasowe nadzoru (supervisionClassNotes) mają błędny format.',
      };
    }

    const profile = sanitizeProfile(data.profile as Partial<TeacherProfile>);
    const sanitizedDocuments = sanitizeDocuments(data.documents, profile);
    const activeDocumentId =
      typeof data.activeDocumentId === 'string' &&
      sanitizedDocuments.some((d) => d.id === data.activeDocumentId)
        ? data.activeDocumentId
        : sanitizedDocuments[0]?.id ?? null;

    return {
      ok: true,
      state: {
        version: typeof data.version === 'number' ? data.version : 1,
        profile,
        documents: sanitizedDocuments,
        activeDocumentId,
        customWnioski: sanitizeCustomWnioski(data.customWnioski),
        customTemplates: sanitizeCustomTemplates(data.customTemplates),
        supervisionPackages: sanitizeSupervisionPackages(data.supervisionPackages),
        supervisionClassNotes: sanitizeSupervisionClassNotes(data.supervisionClassNotes),
      },
    };
  } catch {
    return {
      ok: false,
      error: 'Nie udało się odczytać pliku JSON. Sprawdź, czy plik nie jest uszkodzony.',
    };
  }
}

export function validateAndParseSupervisionPackageJson(jsonText: string):
  | {
      ok: true;
      pkg: TeacherSupervisionPackage;
      sourceKind: 'supervision_package' | 'full_backup';
    }
  | {
      ok: false;
      error: string;
    } {
  if (typeof jsonText !== 'string' || jsonText.trim().length === 0) {
    return { ok: false, error: 'Wybrany plik paczki nadzoru jest pusty.' };
  }
  if (jsonText.length > MAX_IMPORT_JSON_CHARS) {
    return {
      ok: false,
      error: `Plik paczki nadzoru przekracza dopuszczalny limit rozmiaru (${MAX_IMPORT_FILE_MIB} MiB).`,
    };
  }
  try {
    const raw = JSON.parse(jsonText) as Record<string, unknown>;
    if (!isPlainObject(raw)) {
      return { ok: false, error: 'Wybrany plik nie zawiera prawidłowego obiektu JSON.' };
    }
    if (raw.app !== undefined && raw.app !== 'E-Sprawozdania') {
      return {
        ok: false,
        error: 'Wybrany plik nie pochodzi z aplikacji E-Sprawozdania.',
      };
    }
    if (raw.kind === 'phrases_bundle') {
      return {
        ok: false,
        error:
          'To jest plik bazy wniosków i szablonów, a nie paczka sprawozdań nauczyciela do nadzoru.',
      };
    }
    if (
      raw.kind !== undefined &&
      raw.kind !== 'supervision_package' &&
      raw.kind !== 'full_backup'
    ) {
      return { ok: false, error: 'Nieznany typ pliku JSON.' };
    }
    if (
      raw.version !== undefined &&
      (typeof raw.version !== 'number' || !Number.isFinite(raw.version) || raw.version < 1)
    ) {
      return { ok: false, error: 'Plik zawiera nieprawidłowy numer wersji.' };
    }

    const isDedicated = raw.kind === 'supervision_package';
    const rawProfile = isDedicated ? raw.teacherProfileSnapshot : raw.profile;

    if (!isPlainObject(rawProfile)) {
      return {
        ok: false,
        error:
          'Plik nie zawiera podpisu profilu nauczyciela. Poproś nauczyciela o eksport paczki dla dyrektora lub pełnej kopii JSON.',
      };
    }

    if (!Array.isArray(raw.documents)) {
      return { ok: false, error: 'Plik nie zawiera listy sprawozdań (documents).' };
    }
    if (raw.documents.some((doc) => !isValidReportDocument(doc))) {
      return {
        ok: false,
        error: 'Wskazana paczka zawiera dokument o nieprawidłowym typie lub strukturze.',
      };
    }
    if (findDuplicateExplicitId(raw.documents)) {
      return {
        ok: false,
        error: 'Wykryto zduplikowane identyfikatory dokumentów w paczce nadzoru.',
      };
    }

    const profile = sanitizeProfile(rawProfile as Partial<TeacherProfile>);
    const validDocs = sanitizeDocuments(raw.documents, profile);
    if (validDocs.length === 0) {
      return {
        ok: false,
        error: 'Wskazany plik nie zawiera żadnych poprawnych kart sprawozdań.',
      };
    }

    const teacherKey =
      typeof raw.teacherKey === 'string' && raw.teacherKey.trim()
        ? raw.teacherKey.trim().slice(0, MAX_SHORT_LENGTH)
        : buildTeacherKey(profile, validDocs);

    const teacherName =
      profile.fullName.trim() ||
      validDocs
        .map((d) =>
          'teacherName' in d
            ? d.teacherName
            : 'specialistName' in d
              ? d.specialistName
              : d.coordinatorName
        )
        .find((n) => n && n.trim().length > 0) ||
      '';

    const semesterFilter: 'all' | SemesterType =
      raw.semesterFilter === 'I' || raw.semesterFilter === 'II' ? raw.semesterFilter : 'all';

    const nowFallback = new Date().toISOString();
    const pkg: TeacherSupervisionPackage = {
      id:
        typeof raw.packageId === 'string' && raw.packageId.trim()
          ? raw.packageId.trim().slice(0, MAX_SHORT_LENGTH)
          : createId(),
      teacherKey,
      teacherName: teacherName.trim().slice(0, MAX_SHORT_LENGTH),
      schoolName: profile.schoolName.trim().slice(0, MAX_SHORT_LENGTH),
      homeroomClass: profile.homeroomClass.trim().slice(0, 64),
      exportedAt: sanitizeIsoDate(raw.exportedAt, nowFallback),
      importedAt: nowFallback,
      schoolYearFilter:
        typeof raw.schoolYearFilter === 'string' && raw.schoolYearFilter.trim()
          ? raw.schoolYearFilter.slice(0, 64)
          : 'all',
      semesterFilter,
      teacherProfileSnapshot: profile,
      documents: validDocs,
    };

    return {
      ok: true,
      pkg,
      sourceKind: isDedicated ? 'supervision_package' : 'full_backup',
    };
  } catch {
    return {
      ok: false,
      error: 'Nie udało się odczytać pliku JSON. Sprawdź, czy plik nie jest uszkodzony.',
    };
  }
}

export type PhrasesExportScope = 'all' | 'wnioski' | 'szablony';

export interface SharedPhrasesBundle {
  app: 'E-Sprawozdania';
  kind: 'phrases_bundle';
  version: number;
  exportedAt: string;
  customWnioski: CustomWniosekEntry[];
  customTemplates: CustomTemplateEntry[];
}

export function exportPhrasesAsJson(
  customWnioski: CustomWniosekEntry[],
  customTemplates: CustomTemplateEntry[],
  scope: PhrasesExportScope = 'all'
): boolean {
  const wnioskiToExport = scope === 'szablony' ? [] : customWnioski;
  const templatesToExport = scope === 'wnioski' ? [] : customTemplates;
  const payload: SharedPhrasesBundle = {
    app: 'E-Sprawozdania',
    kind: 'phrases_bundle',
    version: 1,
    exportedAt: new Date().toISOString(),
    customWnioski: wnioskiToExport,
    customTemplates: templatesToExport,
  };
  const dateTag = new Date().toISOString().slice(0, 10);
  const prefix =
    scope === 'wnioski'
      ? 'sprawozdania-wnioski'
      : scope === 'szablony'
        ? 'sprawozdania-szablony'
        : 'sprawozdania-wnioski-i-szablony';
  return triggerJsonDownload(payload, `${prefix}-${dateTag}.json`);
}

export function validateAndParseSharedPhrasesJson(jsonText: string):
  | {
      ok: true;
      customWnioski: CustomWniosekEntry[];
      customTemplates: CustomTemplateEntry[];
      sourceKind: 'phrases_bundle' | 'full_backup';
    }
  | {
      ok: false;
      error: string;
    } {
  if (typeof jsonText !== 'string' || jsonText.trim().length === 0) {
    return { ok: false, error: 'Wybrany plik wniosków i szablonów jest pusty.' };
  }
  if (jsonText.length > MAX_IMPORT_JSON_CHARS) {
    return {
      ok: false,
      error: `Plik wniosków i szablonów przekracza dopuszczalny limit rozmiaru (${MAX_IMPORT_FILE_MIB} MiB).`,
    };
  }
  try {
    const data = JSON.parse(jsonText) as Record<string, unknown>;
    if (!isPlainObject(data)) {
      return { ok: false, error: 'Plik nie zawiera prawidłowego obiektu JSON.' };
    }
    if (data.app !== undefined && data.app !== 'E-Sprawozdania') {
      return {
        ok: false,
        error: 'Wybrany plik nie pochodzi z aplikacji E-Sprawozdania.',
      };
    }
    if (data.kind === 'supervision_package') {
      return {
        ok: false,
        error:
          'To jest paczka sprawozdań dla dyrektora, a nie pakiet wniosków i szablonów.',
      };
    }
    if (
      data.kind !== undefined &&
      data.kind !== 'phrases_bundle' &&
      data.kind !== 'full_backup'
    ) {
      return { ok: false, error: 'Nieznany typ pliku JSON.' };
    }
    if (
      data.version !== undefined &&
      (typeof data.version !== 'number' || !Number.isFinite(data.version) || data.version < 1)
    ) {
      return { ok: false, error: 'Plik zawiera nieprawidłowy numer wersji.' };
    }

    const hasWnioskiArray = Array.isArray(data.customWnioski);
    const hasTemplatesArray = Array.isArray(data.customTemplates);

    if (!hasWnioskiArray && !hasTemplatesArray) {
      return {
        ok: false,
        error:
          'Wybrany plik JSON nie zawiera list „customWnioski” ani „customTemplates”. Upewnij się, że wskazano plik wyeksportowany z programu E-Sprawozdania.',
      };
    }
    if (data.customWnioski !== undefined && !hasWnioskiArray) {
      return { ok: false, error: 'Pole „customWnioski” ma nieprawidłowy format.' };
    }
    if (data.customTemplates !== undefined && !hasTemplatesArray) {
      return { ok: false, error: 'Pole „customTemplates” ma nieprawidłowy format.' };
    }

    if (hasWnioskiArray && findDuplicateExplicitId(data.customWnioski as unknown[])) {
      return {
        ok: false,
        error: 'Wykryto zduplikowane identyfikatory na liście własnych wniosków.',
      };
    }
    if (hasTemplatesArray && findDuplicateExplicitId(data.customTemplates as unknown[])) {
      return {
        ok: false,
        error: 'Wykryto zduplikowane identyfikatory na liście szablonów własnych.',
      };
    }

    const customWnioski = sanitizeCustomWnioski(data.customWnioski);
    const customTemplates = sanitizeCustomTemplates(data.customTemplates);

    if (customWnioski.length === 0 && customTemplates.length === 0) {
      return {
        ok: false,
        error:
          'Plik nie zawiera żadnych własnych wniosków ani szablonów do zaimportowania.',
      };
    }

    const sourceKind =
      data.kind === 'phrases_bundle'
        ? 'phrases_bundle'
        : Array.isArray(data.documents)
          ? 'full_backup'
          : 'phrases_bundle';

    return {
      ok: true,
      customWnioski,
      customTemplates,
      sourceKind,
    };
  } catch {
    return {
      ok: false,
      error: 'Nie udało się odczytać pliku JSON. Sprawdź, czy plik nie jest uszkodzony.',
    };
  }
}

function normalizeTextKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function mergeImportedWnioski(
  existing: CustomWniosekEntry[],
  incoming: CustomWniosekEntry[],
  mode: 'merge' | 'replace'
): { entries: CustomWniosekEntry[]; added: number; skippedDuplicates: number } {
  const seenKeys = new Set<string>();
  const usedIds = new Set<string>();

  if (mode === 'replace') {
    const entries: CustomWniosekEntry[] = [];
    let skippedDuplicates = 0;
    for (const item of incoming) {
      const key = `${item.categoryId}::${normalizeTextKey(item.text)}`;
      if (seenKeys.has(key)) {
        skippedDuplicates += 1;
        continue;
      }
      seenKeys.add(key);
      const id = usedIds.has(item.id) ? createId() : item.id;
      usedIds.add(id);
      entries.push({ ...item, id });
    }
    return { entries, added: entries.length, skippedDuplicates };
  }

  for (const item of existing) {
    seenKeys.add(`${item.categoryId}::${normalizeTextKey(item.text)}`);
    usedIds.add(item.id);
  }

  const toPrepend: CustomWniosekEntry[] = [];
  let skippedDuplicates = 0;
  for (const item of incoming) {
    const key = `${item.categoryId}::${normalizeTextKey(item.text)}`;
    if (seenKeys.has(key)) {
      skippedDuplicates += 1;
      continue;
    }
    seenKeys.add(key);
    const id = usedIds.has(item.id) ? createId() : item.id;
    usedIds.add(id);
    toPrepend.push({ ...item, id });
  }

  return {
    entries: [...toPrepend, ...existing],
    added: toPrepend.length,
    skippedDuplicates,
  };
}

export function mergeImportedTemplates(
  existing: CustomTemplateEntry[],
  incoming: CustomTemplateEntry[],
  mode: 'merge' | 'replace'
): { entries: CustomTemplateEntry[]; added: number; skippedDuplicates: number } {
  const seenKeys = new Set<string>();
  const usedIds = new Set<string>();

  if (mode === 'replace') {
    const entries: CustomTemplateEntry[] = [];
    let skippedDuplicates = 0;
    for (const item of incoming) {
      const key = `${item.category}::${normalizeTextKey(item.title)}::${normalizeTextKey(item.content)}`;
      if (seenKeys.has(key)) {
        skippedDuplicates += 1;
        continue;
      }
      seenKeys.add(key);
      const id = usedIds.has(item.id) ? createId() : item.id;
      usedIds.add(id);
      entries.push({ ...item, id });
    }
    return { entries, added: entries.length, skippedDuplicates };
  }

  for (const item of existing) {
    seenKeys.add(`${item.category}::${normalizeTextKey(item.title)}::${normalizeTextKey(item.content)}`);
    usedIds.add(item.id);
  }

  const toPrepend: CustomTemplateEntry[] = [];
  let skippedDuplicates = 0;
  for (const item of incoming) {
    const key = `${item.category}::${normalizeTextKey(item.title)}::${normalizeTextKey(item.content)}`;
    if (seenKeys.has(key)) {
      skippedDuplicates += 1;
      continue;
    }
    seenKeys.add(key);
    const id = usedIds.has(item.id) ? createId() : item.id;
    usedIds.add(id);
    toPrepend.push({ ...item, id });
  }

  return {
    entries: [...toPrepend, ...existing],
    added: toPrepend.length,
    skippedDuplicates,
  };
}

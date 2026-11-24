export type SemesterType = 'I' | 'II';

export type DocumentType =
  | 'efekty_nauczania'
  | 'zbiorcze_efekty'
  | 'karta_informacyjna'
  | 'podsumowanie_specjalisty';

export type CurriculumStatus = 'na_biezaco' | 'opoznienie' | 'wyprzedzenie';

export type SpecialistRole =
  | 'wspolorganizujacy_ksztalcenie'
  | 'wspolorganizujacy_indywidualne'
  | 'pedagog_psycholog'
  | 'biblioteka'
  | 'logopeda'
  | 'swietlica';

export interface SubjectAssignment {
  id: string;
  subject: string;
  programNumber: string;
  textbookTitle: string;
}

export interface TeacherProfile {
  fullName: string;
  schoolName: string;
  schoolYear: string;
  defaultSemester: SemesterType;
  periodPreset: 'sem1' | 'sem2' | 'custom';
  periodText: string;
  homeroomClass: string;
  classesList: string[];
  subjectsList: string[];
  subjectAssignments: SubjectAssignment[];
  signatureDate: string;
}

export interface EfektyNauczaniaDoc {
  id: string;
  type: 'efekty_nauczania';
  title: string;
  createdAt: string;
  updatedAt: string;
  schoolName: string;
  schoolYear: string;
  semester: SemesterType;
  teacherName: string;
  subject: string;
  programNumber: string;
  textbookTitle: string;
  className: string;
  curriculumStatus: CurriculumStatus;
  curriculumScope: string;
  curriculumNotes: string;
  failingGradesCount: string;
  excellentGradesCount: string;
  gradesNotes: string;
  individualPathNotApplicable: boolean;
  individualPathSummary: string;
  competitionsNone: boolean;
  competitionsDetails: string;
  educationalTrips: string;
  preventiveProgram: string;
  previousConclusionsStatus: string;
  futureConclusions: string;
  signatureDate: string;
}

export interface ZbiorczeRow {
  id: string;
  className: string;
  teacherName: string;
  curriculumStatus: CurriculumStatus;
  curriculumDetails: string;
  failingCount: string;
  excellentCount: string;
  notes: string;
}

export interface ZbiorczeEfektyDoc {
  id: string;
  type: 'zbiorcze_efekty';
  title: string;
  createdAt: string;
  updatedAt: string;
  schoolName: string;
  schoolYear: string;
  semester: SemesterType;
  coordinatorName: string;
  subjectOrStage: string;
  mode: 'przedmiotowy' | 'wczesnoszkolna';
  rows: ZbiorczeRow[];
  earlyEdWeakAreas: string;
  earlyEdStrongAreas: string;
  achievements: string;
  educationalTrips: string;
  preventiveProgram: string;
  previousConclusionsStatus: string;
  futureConclusions: string;
  signatureDate: string;
}

export interface SubjectHoursRow {
  id: string;
  subject: string;
  hours: string;
}

export interface AdditionalTaskRow {
  id: string;
  taskType: string;
  results: string;
  conclusions: string;
}

export interface KartaInformacyjnaDoc {
  id: string;
  type: 'karta_informacyjna';
  title: string;
  createdAt: string;
  updatedAt: string;
  schoolName: string;
  schoolYear: string;
  teacherName: string;
  period: string;
  totalHours: string;
  homeroomClass: string;
  subjectHours: SubjectHoursRow[];
  qualificationsStudies: string;
  qualificationsWorkshops: string;
  qualificationsMethodical: string;
  studentAchievements: string;
  tripsOrganization: string;
  didacticBaseEnrichment: string;
  statutoryActivities: string;
  directorTasks: AdditionalTaskRow[];
  teacherInitiativeTasks: AdditionalTaskRow[];
  signatureDate: string;
}

export interface PodsumowanieSpecjalistyDoc {
  id: string;
  type: 'podsumowanie_specjalisty';
  title: string;
  createdAt: string;
  updatedAt: string;
  schoolName: string;
  schoolYear: string;
  semester: SemesterType;
  role: SpecialistRole;
  specialistName: string;
  studentInfo: string;
  plannedTasks: string;
  tasksRealization: string;
  effects: string;
  conclusions: string;
  preventiveProgram: string;
  previousConclusionsStatus: string;
  futureConclusions: string;
  signatureDate: string;
}

export type ReportDocument =
  | EfektyNauczaniaDoc
  | ZbiorczeEfektyDoc
  | KartaInformacyjnaDoc
  | PodsumowanieSpecjalistyDoc;

export type MainTab = 'kreator' | 'profil' | 'baza_wnioskow' | 'kopia_json' | 'o_programie';

export interface CustomWniosekEntry {
  id: string;
  categoryId: string;
  text: string;
  createdAt: string;
}

export type TemplateSectionCategory =
  | 'ogolne'
  | 'podstawa_programowa'
  | 'oceny_wyniki'
  | 'sciezka_konkursy_wyjazdy'
  | 'program_profilaktyczny'
  | 'realizacja_zadan_efekty'
  | 'kwalifikacje_dzialalnosc'
  | 'wnioski_ewaluacja';

export interface CustomTemplateEntry {
  id: string;
  title: string;
  category: TemplateSectionCategory;
  content: string;
  createdAt: string;
}

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateSectionCategory, string> = {
  ogolne: 'Uniwersalne / inne fragmenty',
  podstawa_programowa: 'Podstawa programowa i uwagi',
  oceny_wyniki: 'Oceny, wyniki i obszary (mocne/słabsze)',
  sciezka_konkursy_wyjazdy: 'Ścieżka indyw., konkursy i wyjazdy',
  program_profilaktyczny: 'Program wychowawczo-profilaktyczny',
  realizacja_zadan_efekty: 'Realizacja zadań, plany i efekty',
  kwalifikacje_dzialalnosc: 'Kwalifikacje, baza i zajęcia statutowe',
  wnioski_ewaluacja: 'Wnioski i ewaluacja z ubiegłego roku',
};

export interface AppState {
  version: number;
  profile: TeacherProfile;
  documents: ReportDocument[];
  activeDocumentId: string | null;
  customWnioski: CustomWniosekEntry[];
  customTemplates: CustomTemplateEntry[];
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  efekty_nauczania: 'Karta efektów nauczania',
  zbiorcze_efekty: 'Zbiorcze sprawozdanie koordynatora',
  karta_informacyjna: 'Karta informacyjna nauczyciela',
  podsumowanie_specjalisty: 'Podsumowanie pracy specjalisty / komórki',
};

export const SPECIALIST_ROLE_LABELS: Record<SpecialistRole, string> = {
  wspolorganizujacy_ksztalcenie: 'Nauczyciel współorganizujący proces kształcenia',
  wspolorganizujacy_indywidualne: 'Nauczyciel współorganizujący indywidualne nauczanie specjalne',
  pedagog_psycholog: 'Pedagog / psycholog szkolny',
  biblioteka: 'Biblioteka szkolna',
  logopeda: 'Logopeda szkolny',
  swietlica: 'Świetlica szkolna',
};

export const CURRICULUM_STATUS_LABELS: Record<CurriculumStatus, string> = {
  na_biezaco: 'Na bieżąco',
  opoznienie: 'Opóźnienie (wymaga wyrównania)',
  wyprzedzenie: 'Wyprzedzenie założonego planu',
};

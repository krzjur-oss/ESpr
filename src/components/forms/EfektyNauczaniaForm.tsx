import React from 'react';
import { BookCheck } from 'lucide-react';
import {
  CURRICULUM_STATUS_LABELS,
  CurriculumStatus,
  EfektyNauczaniaDoc,
  TeacherProfile,
} from '../../types/reports';
import { findSubjectAssignment } from '../../utils/documentFactory';
import {
  ConclusionsField,
  Field,
  FormTopBar,
  SectionHeader,
  TemplateTextareaField,
  inputClass,
} from './FormPrimitives';
import {
  ProfileComboInput,
  getProfileClassOptions,
  getProfileDateOptions,
  getProfileProgramOptions,
  getProfileSchoolOptions,
  getProfileSubjectOptions,
  getProfileTeacherOptions,
  getProfileTextbookNumberOptions,
  getProfileTextbookOptions,
  getProfileYearOptions,
} from './ProfileComboInput';

interface Props {
  doc: EfektyNauczaniaDoc;
  profile: TeacherProfile;
  availableYears?: string[];
  onChange: (updated: EfektyNauczaniaDoc) => void;
  onOpenConclusionsPicker: () => void;
  onRequestReset: () => void;
}

export const EfektyNauczaniaForm: React.FC<Props> = ({
  doc,
  profile,
  availableYears = [],
  onChange,
  onOpenConclusionsPicker,
  onRequestReset,
}) => {
  const matchedAssignment = findSubjectAssignment(profile, doc.subject, doc.className);

  const isEmptyOrProfileMatched = (
    currentVal: string | undefined,
    field: 'programNumber' | 'textbookNumber' | 'textbookTitle'
  ): boolean => {
    const trimmed = (currentVal ?? '').trim();
    if (!trimmed) return true;
    return profile.subjectAssignments.some((a) => (a[field] ?? '').trim() === trimmed);
  };

  const update = (patch: Partial<EfektyNauczaniaDoc>) => {
    const next = { ...doc, ...patch, updatedAt: new Date().toISOString() };
    if ('subject' in patch || 'className' in patch) {
      const nextSubject = patch.subject ?? doc.subject;
      const nextClass = patch.className ?? doc.className;
      const nextAssignment = findSubjectAssignment(profile, nextSubject, nextClass);
      if (nextAssignment) {
        if (isEmptyOrProfileMatched(doc.programNumber, 'programNumber')) {
          next.programNumber = nextAssignment.programNumber ?? '';
        }
        if (isEmptyOrProfileMatched(doc.textbookNumber, 'textbookNumber')) {
          next.textbookNumber = nextAssignment.textbookNumber ?? '';
        }
        if (isEmptyOrProfileMatched(doc.textbookTitle, 'textbookTitle')) {
          next.textbookTitle = nextAssignment.textbookTitle ?? '';
        }
      }
    }
    if ('subject' in patch || 'className' in patch) {
      const subj = (patch.subject ?? doc.subject).trim();
      const cls = (patch.className ?? doc.className).trim();
      next.title = [subj || 'Przedmiot', cls ? `kl. ${cls}` : ''].filter(Boolean).join(' · ');
    }
    onChange(next);
  };

  const canApplyFromProfile =
    !!matchedAssignment &&
    ((matchedAssignment.programNumber &&
      matchedAssignment.programNumber !== doc.programNumber) ||
      (matchedAssignment.textbookNumber &&
        matchedAssignment.textbookNumber !== (doc.textbookNumber ?? '')) ||
      (matchedAssignment.textbookTitle &&
        matchedAssignment.textbookTitle !== doc.textbookTitle));

  return (
    <div className="space-y-8">
      <FormTopBar
        docTitle={doc.title || 'Karta sprawozdania z efektów nauczania'}
        metaText={`Karta efektów nauczania · Semestr ${doc.semester} · Rok szkolny ${doc.schoolYear || '—'}`}
        updatedAt={doc.updatedAt}
        onResetDoc={onRequestReset}
      />

      {/* 01. Dane podstawowe */}
      <section>
        <SectionHeader
          index="01"
          title="Dane organizacyjne karty"
          subtitle="Podstawowe informacje o przedmiocie, klasie, programie i podręczniku"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nazwa szkoły / placówki">
            <ProfileComboInput
              value={doc.schoolName}
              onChange={(val) => update({ schoolName: val })}
              options={getProfileSchoolOptions(profile)}
              placeholder="np. Szkoła Podstawowa nr 1 im. ..."
              dropdownHeader="Szkoła zapisana w Profilu"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rok szkolny">
              <ProfileComboInput
                value={doc.schoolYear}
                onChange={(val) => update({ schoolYear: val })}
                options={getProfileYearOptions(profile, availableYears)}
                placeholder="2025/2026"
                className={`${inputClass} font-mono-tabular`}
                dropdownHeader="Lata szkolne z Profilu i archiwum"
              />
            </Field>
            <Field label="Semestr">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                {(['I', 'II'] as const).map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => update({ semester: sem })}
                    className={`rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      doc.semester === sem
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semestr {sem}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field label="Przedmiot / rodzaj zajęć">
            <ProfileComboInput
              value={doc.subject}
              onChange={(val) => update({ subject: val })}
              options={getProfileSubjectOptions(profile)}
              placeholder="np. Matematyka, Język polski, Edukacja wczesnoszkolna"
              dropdownHeader="Przedmioty i programy z Profilu"
            />
          </Field>

          <Field label="Klasa / oddział">
            <ProfileComboInput
              value={doc.className}
              onChange={(val) => update({ className: val })}
              options={getProfileClassOptions(profile)}
              placeholder="np. 4A, 1B, 7C"
              dropdownHeader="Klasy zapisane w Profilu"
            />
          </Field>

          <Field label="Imię i nazwisko nauczyciela">
            <ProfileComboInput
              value={doc.teacherName}
              onChange={(val) => update({ teacherName: val })}
              options={getProfileTeacherOptions(profile)}
              placeholder="Imię i nazwisko"
              dropdownHeader="Nauczyciel z Profilu"
            />
          </Field>

          <Field label="Numer programu nauczania">
            <ProfileComboInput
              value={doc.programNumber}
              onChange={(val) => update({ programNumber: val })}
              options={getProfileProgramOptions(profile, doc.subject, doc.className)}
              onSelectOption={(opt) => {
                const patch: Partial<EfektyNauczaniaDoc> = { programNumber: opt.value };
                if (
                  opt.meta?.textbookNumber &&
                  isEmptyOrProfileMatched(doc.textbookNumber, 'textbookNumber')
                ) {
                  patch.textbookNumber = opt.meta.textbookNumber;
                }
                if (
                  opt.meta?.textbookTitle &&
                  isEmptyOrProfileMatched(doc.textbookTitle, 'textbookTitle')
                ) {
                  patch.textbookTitle = opt.meta.textbookTitle;
                }
                update(patch);
              }}
              placeholder="np. AZ-1-01/18 lub DKOS-5002-12/18"
              className={`${inputClass} font-mono-tabular`}
              dropdownHeader="Programy zapisane w Profilu"
            />
          </Field>

          <Field label="Numer podręcznika / nr zatwierdzenia">
            <ProfileComboInput
              value={doc.textbookNumber ?? ''}
              onChange={(val) => update({ textbookNumber: val })}
              options={getProfileTextbookNumberOptions(profile, doc.subject, doc.className)}
              onSelectOption={(opt) => {
                const patch: Partial<EfektyNauczaniaDoc> = { textbookNumber: opt.value };
                if (
                  opt.meta?.textbookTitle &&
                  isEmptyOrProfileMatched(doc.textbookTitle, 'textbookTitle')
                ) {
                  patch.textbookTitle = opt.meta.textbookTitle;
                }
                if (
                  opt.meta?.programNumber &&
                  isEmptyOrProfileMatched(doc.programNumber, 'programNumber')
                ) {
                  patch.programNumber = opt.meta.programNumber;
                }
                update(patch);
              }}
              placeholder="np. AZ-11-01/18-20"
              className={`${inputClass} font-mono-tabular`}
              dropdownHeader="Numery podręczników z Profilu"
            />
          </Field>

          <Field label="Tytuł i autor podręcznika">
            <ProfileComboInput
              value={doc.textbookTitle}
              onChange={(val) => update({ textbookTitle: val })}
              options={getProfileTextbookOptions(profile, doc.subject, doc.className)}
              onSelectOption={(opt) => {
                const patch: Partial<EfektyNauczaniaDoc> = { textbookTitle: opt.value };
                if (
                  opt.meta?.textbookNumber &&
                  isEmptyOrProfileMatched(doc.textbookNumber, 'textbookNumber')
                ) {
                  patch.textbookNumber = opt.meta.textbookNumber;
                }
                if (
                  opt.meta?.programNumber &&
                  isEmptyOrProfileMatched(doc.programNumber, 'programNumber')
                ) {
                  patch.programNumber = opt.meta.programNumber;
                }
                update(patch);
              }}
              placeholder="np. Matematyka z plusem 4, GWO (praca zbiorowa)"
              dropdownHeader="Podręczniki zapisane w Profilu"
            />
          </Field>

          {canApplyFromProfile && matchedAssignment && (
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs text-blue-950">
              <span>
                W Profilu zapisano program i podręcznik dla przedmiotu{' '}
                <strong>
                  {matchedAssignment.subject}
                  {matchedAssignment.classScope?.trim()
                    ? ` (kl. ${matchedAssignment.classScope.trim()})`
                    : ''}
                </strong>
                .
              </span>
              <button
                type="button"
                onClick={() =>
                  update({
                    programNumber:
                      matchedAssignment.programNumber || doc.programNumber,
                    textbookNumber:
                      matchedAssignment.textbookNumber || doc.textbookNumber || '',
                    textbookTitle:
                      matchedAssignment.textbookTitle || doc.textbookTitle,
                  })
                }
                className="inline-flex items-center gap-1 rounded-md bg-blue-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookCheck className="w-3.5 h-3.5" />
                <span>Wczytaj z Profilu</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 02. Realizacja podstawy programowej i oceny */}
      <section>
        <SectionHeader
          index="02"
          title="Realizacja podstawy programowej i wyniki klasyfikacji"
          subtitle="Ocena tempa realizacji materiału oraz zestawienie ocen niedostatecznych i celujących"
        />
        <div className="space-y-4">
          <Field label="Stopień realizacji podstawy programowej">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['na_biezaco', 'opoznienie', 'wyprzedzenie'] as CurriculumStatus[]).map(
                (status) => {
                  const active = doc.curriculumStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => update({ curriculumStatus: status })}
                      className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? 'border-blue-900 bg-blue-50 text-blue-900 font-semibold'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {CURRICULUM_STATUS_LABELS[status]}
                    </button>
                  );
                }
              )}
            </div>
          </Field>

          {doc.curriculumStatus !== 'na_biezaco' && (
            <TemplateTextareaField
              label={
                doc.curriculumStatus === 'opoznienie'
                  ? 'Zakres opóźnienia i planowane działania wyrównawcze'
                  : 'Zakres wyprzedzenia założonego planu'
              }
              category="podstawa_programowa"
              rows={2}
              value={doc.curriculumScope}
              onChange={(val) => update({ curriculumScope: val })}
              placeholder="Podaj konkretne działy / tematy oraz sposób nadrobienia lub wykorzystania czasu..."
            />
          )}

          <TemplateTextareaField
            label="Uwagi dotyczące realizacji podstawy programowej"
            category="podstawa_programowa"
            rows={2}
            value={doc.curriculumNotes}
            onChange={(val) => update({ curriculumNotes: val })}
            placeholder="Opcjonalne uwagi (np. dostosowanie do potrzeb klasy, absencje, dni wolne)..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Field label="Liczba ocen niedostatecznych">
              <input
                type="number"
                min="0"
                value={doc.failingGradesCount}
                onChange={(e) => update({ failingGradesCount: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </Field>
            <Field label="Liczba ocen celujących">
              <input
                type="number"
                min="0"
                value={doc.excellentGradesCount}
                onChange={(e) => update({ excellentGradesCount: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </Field>
          </div>

          <TemplateTextareaField
            label="Uwagi do ocen i wyników nauczania"
            category="oceny_wyniki"
            rows={2}
            value={doc.gradesNotes}
            onChange={(val) => update({ gradesNotes: val })}
            placeholder="Np. przyczyny ocen niedostatecznych, poziom przygotowania klasy, wysoka frekwencja..."
          />
        </div>
      </section>

      {/* 03. Zindywidualizowana ścieżka, konkursy, wyjazdy */}
      <section>
        <SectionHeader
          index="03"
          title="Zindywidualizowana ścieżka, konkursy i wyjazdy edukacyjne"
        />
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs font-medium text-slate-700">
                Podsumowanie efektów zindywidualizowanej ścieżki kształcenia
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doc.individualPathNotApplicable}
                  onChange={(e) =>
                    update({ individualPathNotApplicable: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                />
                <span>Nie dotyczy</span>
              </label>
            </div>
            {!doc.individualPathNotApplicable && (
              <TemplateTextareaField
                label="Opis efektów zindywidualizowanej ścieżki"
                category="sciezka_konkursy_wyjazdy"
                rows={3}
                value={doc.individualPathSummary}
                onChange={(val) => update({ individualPathSummary: val })}
                placeholder="Opisz efekty pracy z uczniem objętym zindywidualizowaną ścieżką kształcenia..."
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs font-medium text-slate-700">
                Udział w konkursach, zawodach międzyszkolnych i sukcesy uczniów
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doc.competitionsNone}
                  onChange={(e) => update({ competitionsNone: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                />
                <span>Brak w tym okresie</span>
              </label>
            </div>
            {!doc.competitionsNone && (
              <TemplateTextareaField
                label="Szczegóły konkursów i osiągnięć"
                category="sciezka_konkursy_wyjazdy"
                rows={3}
                value={doc.competitionsDetails}
                onChange={(val) => update({ competitionsDetails: val })}
                placeholder="Podaj nazwę konkursu/zawodów, liczbę biorących udział uczniów oraz uzyskane miejsca/wyróżnienia..."
              />
            )}
          </div>

          <TemplateTextareaField
            label="Wyjazdy edukacyjne w ramach realizacji podstawy programowej"
            category="sciezka_konkursy_wyjazdy"
            rows={2}
            value={doc.educationalTrips}
            onChange={(val) => update({ educationalTrips: val })}
            placeholder="Np. wycieczka do muzeum, warsztaty w centrum nauki, wyjście do teatru (lub wpisz 'Brak')..."
          />

          <TemplateTextareaField
            label="Realizacja programu wychowawczo-profilaktycznego"
            category="program_profilaktyczny"
            rows={3}
            value={doc.preventiveProgram}
            onChange={(val) => update({ preventiveProgram: val })}
            placeholder="Wpisz treści wychowawczo-profilaktyczne, pogadanki, warsztaty, spotkania, wyjścia, przedstawienia zrealizowane na zajęciach..."
          />
        </div>
      </section>

      {/* 04. Wnioski i podpis */}
      <section>
        <SectionHeader
          index="04"
          title="Wnioski i podpis nauczyciela"
          subtitle="Ewaluacja wniosków z ubiegłego roku oraz kierunki pracy na kolejny okres"
        />
        <div className="space-y-4">
          <TemplateTextareaField
            label="Stopień realizacji wniosków z poprzedniego roku szkolnego"
            category="wnioski_ewaluacja"
            rows={3}
            value={doc.previousConclusionsStatus}
            onChange={(val) => update({ previousConclusionsStatus: val })}
            placeholder="W jakim stopniu wdrożono wcześniejsze zalecenia i jakie przyniosły rezultaty..."
          />

          <ConclusionsField
            label="Wnioski do dalszej pracy"
            value={doc.futureConclusions}
            onChange={(val) => update({ futureConclusions: val })}
            onOpenPicker={onOpenConclusionsPicker}
            placeholder="Wpisz własne wnioski lub skorzystaj z przycisku 'Wstaw z bazy wniosków' powyżej..."
            rows={5}
          />

          <div className="max-w-xs">
            <Field label="Data sporządzenia dokumentu">
              <ProfileComboInput
                value={doc.signatureDate}
                onChange={(val) => update({ signatureDate: val })}
                options={getProfileDateOptions(profile)}
                placeholder="DD.MM.RRRR"
                className={`${inputClass} font-mono-tabular`}
                dropdownHeader="Data z Profilu lub bieżąca"
              />
            </Field>
          </div>
        </div>
      </section>
    </div>
  );
};

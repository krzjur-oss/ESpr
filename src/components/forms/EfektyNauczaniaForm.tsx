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
  inputClass,
  textareaClass,
} from './FormPrimitives';

interface Props {
  doc: EfektyNauczaniaDoc;
  profile: TeacherProfile;
  onChange: (updated: EfektyNauczaniaDoc) => void;
  onOpenConclusionsPicker: () => void;
  onRequestReset: () => void;
}

export const EfektyNauczaniaForm: React.FC<Props> = ({
  doc,
  profile,
  onChange,
  onOpenConclusionsPicker,
  onRequestReset,
}) => {
  const matchedAssignment = findSubjectAssignment(profile, doc.subject);

  const update = (patch: Partial<EfektyNauczaniaDoc>) => {
    const next = { ...doc, ...patch, updatedAt: new Date().toISOString() };
    if ('subject' in patch) {
      const prevAssignment = findSubjectAssignment(profile, doc.subject);
      const nextAssignment = findSubjectAssignment(profile, patch.subject ?? '');
      if (nextAssignment) {
        const programEmptyOrAuto =
          !doc.programNumber.trim() ||
          (prevAssignment && doc.programNumber === prevAssignment.programNumber);
        const textbookEmptyOrAuto =
          !doc.textbookTitle.trim() ||
          (prevAssignment && doc.textbookTitle === prevAssignment.textbookTitle);
        if (programEmptyOrAuto && nextAssignment.programNumber) {
          next.programNumber = nextAssignment.programNumber;
        }
        if (textbookEmptyOrAuto && nextAssignment.textbookTitle) {
          next.textbookTitle = nextAssignment.textbookTitle;
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
      (matchedAssignment.textbookTitle &&
        matchedAssignment.textbookTitle !== doc.textbookTitle));

  return (
    <div className="space-y-8">
      <FormTopBar
        docTitle={doc.title || 'Karta sprawozdania z efektów nauczania'}
        metaText={`Karta efektów nauczania · Semestr ${doc.semester} · Rok szkolny ${doc.schoolYear || '—'}`}
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
            <input
              type="text"
              value={doc.schoolName}
              onChange={(e) => update({ schoolName: e.target.value })}
              placeholder="np. Szkoła Podstawowa nr 1 im. ..."
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rok szkolny">
              <input
                type="text"
                value={doc.schoolYear}
                onChange={(e) => update({ schoolYear: e.target.value })}
                placeholder="2025/2026"
                className={`${inputClass} font-mono-tabular`}
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
            <input
              type="text"
              list="profile-subjects-datalist"
              value={doc.subject}
              onChange={(e) => update({ subject: e.target.value })}
              placeholder="np. Matematyka, Język polski, Edukacja wczesnoszkolna"
              className={inputClass}
            />
            <datalist id="profile-subjects-datalist">
              {profile.subjectsList.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>

          <Field label="Klasa / oddział">
            <input
              type="text"
              list="profile-classes-datalist"
              value={doc.className}
              onChange={(e) => update({ className: e.target.value })}
              placeholder="np. 4A, 1B, 7C"
              className={inputClass}
            />
            <datalist id="profile-classes-datalist">
              {profile.classesList.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field label="Imię i nazwisko nauczyciela">
            <input
              type="text"
              value={doc.teacherName}
              onChange={(e) => update({ teacherName: e.target.value })}
              placeholder="Imię i nazwisko"
              className={inputClass}
            />
          </Field>

          <Field label="Numer programu nauczania">
            <input
              type="text"
              value={doc.programNumber}
              onChange={(e) => update({ programNumber: e.target.value })}
              placeholder="np. DKOS-5002-12/18 lub nazwa programu"
              className={inputClass}
            />
          </Field>

          <div className="md:col-span-2 space-y-2">
            <Field label="Tytuł i autor podręcznika">
              <input
                type="text"
                value={doc.textbookTitle}
                onChange={(e) => update({ textbookTitle: e.target.value })}
                placeholder="np. Matematyka z plusem 4, GWO (praca zbiorowa)"
                className={inputClass}
              />
            </Field>
            {canApplyFromProfile && matchedAssignment && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs text-blue-950">
                <span>
                  W Profilu zapisano program i podręcznik dla przedmiotu{' '}
                  <strong>{matchedAssignment.subject}</strong>.
                </span>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      programNumber:
                        matchedAssignment.programNumber || doc.programNumber,
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
            <Field
              label={
                doc.curriculumStatus === 'opoznienie'
                  ? 'Zakres opóźnienia i planowane działania wyrównawcze'
                  : 'Zakres wyprzedzenia założonego planu'
              }
            >
              <textarea
                rows={2}
                value={doc.curriculumScope}
                onChange={(e) => update({ curriculumScope: e.target.value })}
                placeholder="Podaj konkretne działy / tematy oraz sposób nadrobienia lub wykorzystania czasu..."
                className={textareaClass}
              />
            </Field>
          )}

          <Field label="Uwagi dotyczące realizacji podstawy programowej">
            <textarea
              rows={2}
              value={doc.curriculumNotes}
              onChange={(e) => update({ curriculumNotes: e.target.value })}
              placeholder="Opcjonalne uwagi (np. dostosowanie do potrzeb klasy, absencje, dni wolne)..."
              className={textareaClass}
            />
          </Field>

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

          <Field label="Uwagi do ocen i wyników nauczania">
            <textarea
              rows={2}
              value={doc.gradesNotes}
              onChange={(e) => update({ gradesNotes: e.target.value })}
              placeholder="Np. przyczyny ocen niedostatecznych, poziom przygotowania klasy, wysoka frekwencja..."
              className={textareaClass}
            />
          </Field>
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
              <textarea
                rows={3}
                value={doc.individualPathSummary}
                onChange={(e) => update({ individualPathSummary: e.target.value })}
                placeholder="Opisz efekty pracy z uczniem objętym zindywidualizowaną ścieżką kształcenia..."
                className={textareaClass}
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
              <textarea
                rows={3}
                value={doc.competitionsDetails}
                onChange={(e) => update({ competitionsDetails: e.target.value })}
                placeholder="Podaj nazwę konkursu/zawodów, liczbę biorących udział uczniów oraz uzyskane miejsca/wyróżnienia..."
                className={textareaClass}
              />
            )}
          </div>

          <Field label="Wyjazdy edukacyjne w ramach realizacji podstawy programowej">
            <textarea
              rows={2}
              value={doc.educationalTrips}
              onChange={(e) => update({ educationalTrips: e.target.value })}
              placeholder="Np. wycieczka do muzeum, warsztaty w centrum nauki, wyjście do teatru (lub wpisz 'Brak')..."
              className={textareaClass}
            />
          </Field>

          <Field label="Realizacja programu wychowawczo-profilaktycznego">
            <textarea
              rows={3}
              value={doc.preventiveProgram}
              onChange={(e) => update({ preventiveProgram: e.target.value })}
              placeholder="Wpisz treści wychowawczo-profilaktyczne, pogadanki, warsztaty, spotkania, wyjścia, przedstawienia zrealizowane na zajęciach..."
              className={textareaClass}
            />
          </Field>
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
          <Field label="Stopień realizacji wniosków z poprzedniego roku szkolnego">
            <textarea
              rows={3}
              value={doc.previousConclusionsStatus}
              onChange={(e) => update({ previousConclusionsStatus: e.target.value })}
              placeholder="W jakim stopniu wdrożono wcześniejsze zalecenia i jakie przyniosły rezultaty..."
              className={textareaClass}
            />
          </Field>

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
              <input
                type="text"
                value={doc.signatureDate}
                onChange={(e) => update({ signatureDate: e.target.value })}
                placeholder="DD.MM.RRRR"
                className={`${inputClass} font-mono-tabular`}
              />
            </Field>
          </div>
        </div>
      </section>
    </div>
  );
};

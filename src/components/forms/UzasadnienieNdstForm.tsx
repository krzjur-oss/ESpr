import React from 'react';
import {
  NDST_NEXT_SEMESTER_OPTIONS,
  NDST_OBSERVATION_OPTIONS,
  NDST_TEACHER_ACTION_OPTIONS,
} from '../../data/ndstOptions';
import {
  ClassificationPeriod,
  NdstNextSemesterActionKey,
  NdstObservationKey,
  NdstTeacherActionKey,
  TeacherProfile,
  UzasadnienieNdstDoc,
} from '../../types/reports';
import {
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
  getProfileSchoolOptions,
  getProfileSubjectOptions,
  getProfileTeacherOptions,
  getProfileYearOptions,
} from './ProfileComboInput';

interface Props {
  doc: UzasadnienieNdstDoc;
  profile: TeacherProfile;
  availableYears?: string[];
  onChange: (updated: UzasadnienieNdstDoc) => void;
  onToggleLock?: () => void;
  onRequestReset: () => void;
}

export const UzasadnienieNdstForm: React.FC<Props> = ({
  doc,
  profile,
  availableYears = [],
  onChange,
  onToggleLock,
  onRequestReset,
}) => {
  const update = (patch: Partial<UzasadnienieNdstDoc>) => {
    if (doc.isLocked) return;
    const next: UzasadnienieNdstDoc = {
      ...doc,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    if (
      'studentName' in patch ||
      'subject' in patch ||
      'className' in patch ||
      'classificationPeriod' in patch
    ) {
      const periodLabel =
        next.classificationPeriod === 'roczne' ? 'roczna' : 'I półrocze';
      const student = next.studentName.trim();
      const subj = next.subject.trim();
      const cls = next.className.trim();
      const detail = student
        ? `${student}${cls ? ` (${cls})` : ''}`
        : [subj || 'Przedmiot', cls ? `kl. ${cls}` : ''].filter(Boolean).join(' · ');
      next.title = `Uzasadnienie NDST (${periodLabel}) · ${detail}`;
    }
    onChange(next);
  };

  const toggleObservation = (key: NdstObservationKey) => {
    const exists = doc.observations.includes(key);
    update({
      observations: exists
        ? doc.observations.filter((k) => k !== key)
        : [...doc.observations, key],
    });
  };

  const toggleTeacherAction = (key: NdstTeacherActionKey) => {
    const exists = doc.teacherActions.includes(key);
    update({
      teacherActions: exists
        ? doc.teacherActions.filter((k) => k !== key)
        : [...doc.teacherActions, key],
    });
  };

  const toggleNextSemesterAction = (key: NdstNextSemesterActionKey) => {
    const exists = doc.nextSemesterActions.includes(key);
    update({
      nextSemesterActions: exists
        ? doc.nextSemesterActions.filter((k) => k !== key)
        : [...doc.nextSemesterActions, key],
    });
  };

  const isAnnual = doc.classificationPeriod === 'roczne';

  return (
    <div className="space-y-8">
      <FormTopBar
        docTitle={doc.title || 'Uzasadnienie oceny niedostatecznej'}
        metaText={`Załącznik NDST · ${isAnnual ? 'Klasyfikacja roczna' : 'Za I półrocze'} · Rok szkolny ${doc.schoolYear || '—'}`}
        updatedAt={doc.updatedAt}
        isLocked={Boolean(doc.isLocked)}
        onToggleLock={onToggleLock}
        onResetDoc={onRequestReset}
      />

      <fieldset
        disabled={Boolean(doc.isLocked)}
        className="space-y-8 min-w-0 border-0 p-0 m-0 [&:disabled_button]:cursor-not-allowed [&:disabled_button]:opacity-60 [&:disabled_label]:cursor-not-allowed [&:disabled_select]:cursor-not-allowed [&:disabled_select]:bg-slate-50"
      >
      {/* 01. Dane ucznia i załącznika */}
      <section>
        <SectionHeader
          index="01"
          title="Dane identyfikacyjne ucznia i załącznika"
          subtitle="Informacje nagłówkowe zgodne ze wzorem uzasadnienia oceny niedostatecznej"
        />

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Okres klasyfikacji">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                {(
                  [
                    { id: 'srodroczne', label: 'Za I półrocze' },
                    { id: 'roczne', label: 'Roczna (rok szkolny)' },
                  ] as { id: ClassificationPeriod; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => update({ classificationPeriod: item.id })}
                    className={`rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      doc.classificationPeriod === item.id
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nr załącznika">
                <input
                  type="text"
                  value={doc.attachmentNumber}
                  onChange={(e) => update({ attachmentNumber: e.target.value })}
                  placeholder="np. 1"
                  className={`${inputClass} font-mono-tabular`}
                />
              </Field>
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nazwisko i imię ucznia">
              <input
                type="text"
                value={doc.studentName}
                onChange={(e) => update({ studentName: e.target.value })}
                placeholder="np. Nowak Anna"
                className={inputClass}
              />
            </Field>

            <Field label="Klasa">
              <ProfileComboInput
                value={doc.className}
                onChange={(val) => update({ className: val })}
                options={getProfileClassOptions(profile)}
                placeholder="np. 6A"
                dropdownHeader="Klasy zapisane w Profilu"
              />
            </Field>

            <Field label="Przedmiot">
              <ProfileComboInput
                value={doc.subject}
                onChange={(val) => update({ subject: val })}
                options={getProfileSubjectOptions(profile)}
                placeholder="np. Matematyka"
                dropdownHeader="Przedmioty zapisane w Profilu"
              />
            </Field>

            <Field label="Nauczyciel prowadzący">
              <ProfileComboInput
                value={doc.teacherName}
                onChange={(val) => update({ teacherName: val })}
                options={getProfileTeacherOptions(profile)}
                placeholder="Imię i nazwisko nauczyciela"
                dropdownHeader="Nauczyciel z Profilu"
              />
            </Field>

            <Field label="Etap kształcenia (w treści wstępu)">
              <select
                value={doc.educationStage}
                onChange={(e) => update({ educationStage: e.target.value })}
                className={inputClass}
              >
                <option value="drugiego etapu kształcenia">
                  drugiego etapu kształcenia (klasy IV–VIII)
                </option>
                <option value="pierwszego etapu kształcenia">
                  pierwszego etapu kształcenia (klasy I–III)
                </option>
                <option value="etapu ponadpodstawowego">
                  etapu ponadpodstawowego
                </option>
              </select>
            </Field>

            <Field label="Nazwa szkoły / placówki (opcjonalnie)">
              <ProfileComboInput
                value={doc.schoolName}
                onChange={(val) => update({ schoolName: val })}
                options={getProfileSchoolOptions(profile)}
                placeholder="np. Szkoła Podstawowa nr 1 im. ..."
                dropdownHeader="Szkoła zapisana w Profilu"
              />
            </Field>
          </div>
        </div>
      </section>

      {/* 02. Braki w umiejętnościach i wiedzy ucznia */}
      <section>
        <SectionHeader
          index="02"
          title="1. Braki w umiejętnościach i wiedzy ucznia (z podstawy programowej)"
          subtitle="Wpisz każdy punkt w osobnej linii — na wydruku zostaną wypunktowane"
        />
        <TemplateTextareaField
          label="Braki z podstawy programowej"
          category="podstawa_programowa"
          rows={5}
          value={doc.curriculumGaps}
          onChange={(val) => update({ curriculumGaps: val })}
          placeholder={
            'Np.:\nBrak umiejętności wykonywania podstawowych działań na ułamkach zwykłych i dziesiętnych.\nNieznajomość podstawowych własności figur geometrycznych.\nTrudności z rozwiązywaniem prostych zadań tekstowych z treścią.'
          }
        />
      </section>

      {/* 03. Obserwacja pracy i zaangażowania ucznia */}
      <section>
        <SectionHeader
          index="03"
          title="2. Obserwacja pracy i zaangażowania ucznia w trakcie zajęć"
          subtitle={`Zaznaczono kryteria: ${doc.observations.length} z ${NDST_OBSERVATION_OPTIONS.length}`}
        />
        <div className="space-y-2">
          {NDST_OBSERVATION_OPTIONS.map((opt) => {
            const checked = doc.observations.includes(opt.key);
            return (
              <label
                key={opt.key}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs transition-colors cursor-pointer ${
                  checked
                    ? 'border-blue-900 bg-blue-50/50 text-slate-900 font-medium'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleObservation(opt.key)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 shrink-0"
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* 04. Działania podjęte przez nauczyciela */}
      <section>
        <SectionHeader
          index="04"
          title="3. Działania podjęte przez nauczyciela"
          subtitle={`Zaznaczono działania: ${doc.teacherActions.length} z ${NDST_TEACHER_ACTION_OPTIONS.length}`}
        />
        <div className="space-y-2">
          {NDST_TEACHER_ACTION_OPTIONS.map((opt) => {
            const checked = doc.teacherActions.includes(opt.key);
            return (
              <div
                key={opt.key}
                className={`rounded-lg border transition-colors ${
                  checked
                    ? 'border-blue-900 bg-blue-50/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <label className="flex items-start gap-2.5 px-3 py-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTeacherAction(opt.key)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 shrink-0"
                  />
                  <span className={checked ? 'font-medium text-slate-900' : 'text-slate-700'}>
                    {opt.label}
                  </span>
                </label>

                {/* Inline details for specific actions */}
                {checked && opt.key === 'przedstawienie_harmonogramu_poprawy' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-blue-200/70 bg-white/80 px-3 py-2.5">
                    <Field label="Kiedy przedstawiono?">
                      <input
                        type="text"
                        value={doc.improvementScheduleWhen}
                        onChange={(e) =>
                          update({ improvementScheduleWhen: e.target.value })
                        }
                        placeholder="np. 15.11.2025 r."
                        className={inputClass}
                      />
                    </Field>
                    <Field label="W jakiej formie?">
                      <input
                        type="text"
                        value={doc.improvementScheduleForm}
                        onChange={(e) =>
                          update({ improvementScheduleForm: e.target.value })
                        }
                        placeholder="np. pisemnie / wiadomość w dzienniku"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                )}

                {checked && opt.key === 'dodatkowe_zadania' && (
                  <div className="space-y-2.5 border-t border-blue-200/70 bg-white/80 px-3 py-2.5">
                    <Field label="Przykłady zaproponowanych dodatkowych zadań / poleceń">
                      <input
                        type="text"
                        value={doc.additionalTasksExamples}
                        onChange={(e) =>
                          update({ additionalTasksExamples: e.target.value })
                        }
                        placeholder="np. karty pracy z działu 2, zestaw zadań powtórzeniowych..."
                        className={inputClass}
                      />
                    </Field>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-medium text-slate-700">
                        Czy uczeń wywiązywał się z zadań?
                      </span>
                      {(['TAK', 'NIE'] as const).map((val) => (
                        <label
                          key={val}
                          className="inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`tasks-completed-${doc.id}`}
                            checked={doc.additionalTasksCompleted === val}
                            onChange={() => update({ additionalTasksCompleted: val })}
                            className="text-blue-900"
                          />
                          <span className="font-semibold text-slate-800">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {checked && opt.key === 'skierowanie_na_zajecia_dodatkowe' && (
                  <div className="space-y-2.5 border-t border-blue-200/70 bg-white/80 px-3 py-2.5">
                    <Field label="Na jakie zajęcia skierowano ucznia?">
                      <input
                        type="text"
                        value={doc.remedialClassesWhat}
                        onChange={(e) =>
                          update({ remedialClassesWhat: e.target.value })
                        }
                        placeholder="np. zajęcia dydaktyczno-wyrównawcze z matematyki"
                        className={inputClass}
                      />
                    </Field>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-medium text-slate-700">
                        Czy uczeń uczestniczył w zajęciach?
                      </span>
                      {(['TAK', 'NIE', 'RZADKO'] as const).map((val) => (
                        <label
                          key={val}
                          className="inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`remedial-attended-${doc.id}`}
                            checked={doc.remedialClassesAttended === val}
                            onChange={() => update({ remedialClassesAttended: val })}
                            className="text-blue-900"
                          />
                          <span className="font-semibold text-slate-800">{val}</span>
                        </label>
                      ))}
                    </div>
                    {(doc.remedialClassesAttended === 'NIE' ||
                      doc.remedialClassesAttended === 'RZADKO') && (
                      <Field label="Jeżeli nie (lub rzadko), to dlaczego?">
                        <input
                          type="text"
                          value={doc.remedialClassesNotAttendedReason}
                          onChange={(e) =>
                            update({ remedialClassesNotAttendedReason: e.target.value })
                          }
                          placeholder="np. uczeń nie zostawał po lekcjach mimo informacji do rodziców"
                          className={inputClass}
                        />
                      </Field>
                    )}
                  </div>
                )}

                {checked && opt.key === 'powiadomienie_rodzicow' && (
                  <div className="border-t border-blue-200/70 bg-white/80 px-3 py-2.5">
                    <Field label="Kiedy powiadomiono rodziców / opiekunów? (data)">
                      <input
                        type="text"
                        value={doc.parentsNotifiedDate}
                        onChange={(e) =>
                          update({ parentsNotifiedDate: e.target.value })
                        }
                        placeholder="np. 18.12.2025 r."
                        className={inputClass}
                      />
                    </Field>
                  </div>
                )}

                {checked && opt.key === 'poinstruowanie_rodzicow' && (
                  <div className="border-t border-blue-200/70 bg-white/80 px-3 py-2.5">
                    <Field label="Kiedy poinstruowano rodziców?">
                      <input
                        type="text"
                        value={doc.parentsInstructedDate}
                        onChange={(e) =>
                          update({ parentsInstructedDate: e.target.value })
                        }
                        placeholder="np. 10.12.2025 r. (podczas konsultacji)"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                )}

                {checked && opt.key === 'powiadomienie_pedagoga' && (
                  <div className="border-t border-blue-200/70 bg-white/80 px-3 py-2.5">
                    <Field label="Kiedy powiadomiono pedagoga szkolnego?">
                      <input
                        type="text"
                        value={doc.pedagogueNotifiedDate}
                        onChange={(e) =>
                          update({ pedagogueNotifiedDate: e.target.value })
                        }
                        placeholder="np. 04.12.2025 r."
                        className={inputClass}
                      />
                    </Field>
                  </div>
                )}

                {checked && opt.key === 'inne_dzialania' && (
                  <div className="border-t border-blue-200/70 bg-white/80 px-3 py-2.5">
                    <Field label="Inne podjęte działania">
                      <input
                        type="text"
                        value={doc.otherTeacherActionsText}
                        onChange={(e) =>
                          update({ otherTeacherActionsText: e.target.value })
                        }
                        placeholder="Opisz inne działania podjęte wobec ucznia..."
                        className={inputClass}
                      />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 05. Współpraca z rodzicami */}
      <section>
        <SectionHeader
          index="05"
          title="4. Współpraca z rodzicami / prawnymi opiekunami"
          subtitle="Opis kontaktów z rodzicami, korespondencji w e-dzienniku, zebrań i rozmów indywidualnych"
        />
        <TemplateTextareaField
          label="Przebieg współpracy z rodzicami"
          category="ogolne"
          rows={4}
          value={doc.parentsCooperation}
          onChange={(val) => update({ parentsCooperation: val })}
          placeholder="Opisz terminy powiadomień o zagrożeniu oceną niedostateczną, reakcję rodziców, obecność na zebraniach i ustalenia..."
        />
      </section>

      {/* 06. Działania w następnym semestrze */}
      <section>
        <SectionHeader
          index="06"
          title="5. Działania w następnym semestrze oraz podpis"
          subtitle="Planowane kroki w celu wyeliminowania trudności dydaktycznych ucznia"
        />

        <div className="space-y-4">
          <div className="space-y-2">
            {NDST_NEXT_SEMESTER_OPTIONS.map((opt) => {
              const checked = doc.nextSemesterActions.includes(opt.key);
              return (
                <div
                  key={opt.key}
                  className={`rounded-lg border transition-colors ${
                    checked
                      ? 'border-blue-900 bg-blue-50/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <label className="flex items-start gap-2.5 px-3 py-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleNextSemesterAction(opt.key)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 shrink-0"
                    />
                    <span className={checked ? 'font-medium text-slate-900' : 'text-slate-700'}>
                      {opt.label}
                    </span>
                  </label>
                  {checked && opt.key === 'inne_nastepny_semestr' && (
                    <div className="border-t border-blue-200/70 bg-white/80 px-3 py-2.5">
                      <Field label="Inne planowane działania">
                        <input
                          type="text"
                          value={doc.nextSemesterOtherText}
                          onChange={(e) =>
                            update({ nextSemesterOtherText: e.target.value })
                          }
                          placeholder="Opisz inne planowane działania na kolejny semestr..."
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="max-w-xs pt-2">
            <Field label="Data sporządzenia (opcjonalnie)">
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
      </fieldset>
    </div>
  );
};

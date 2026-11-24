import React from 'react';
import {
  PodsumowanieSpecjalistyDoc,
  SPECIALIST_ROLE_LABELS,
  SpecialistRole,
  TeacherProfile,
} from '../../types/reports';
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
  getProfileSchoolOptions,
  getProfileTeacherOptions,
  getProfileYearOptions,
} from './ProfileComboInput';

interface Props {
  doc: PodsumowanieSpecjalistyDoc;
  profile: TeacherProfile;
  availableYears?: string[];
  onChange: (updated: PodsumowanieSpecjalistyDoc) => void;
  onOpenConclusionsPicker: () => void;
  onRequestReset: () => void;
}

export const PodsumowanieSpecjalistyForm: React.FC<Props> = ({
  doc,
  profile,
  availableYears = [],
  onChange,
  onOpenConclusionsPicker,
  onRequestReset,
}) => {
  const studentClassOptions = getProfileClassOptions(profile).map((opt) => ({
    value: `klasa ${opt.value}`,
    label: `klasa ${opt.value}`,
    subtitle: opt.subtitle ?? 'Oddział zapisany w Profilu',
  }));
  const update = (patch: Partial<PodsumowanieSpecjalistyDoc>) => {
    const next = { ...doc, ...patch, updatedAt: new Date().toISOString() };
    if ('role' in patch || 'studentInfo' in patch) {
      const roleLabel = SPECIALIST_ROLE_LABELS[patch.role ?? doc.role];
      const student = (patch.studentInfo ?? doc.studentInfo).trim();
      next.title = student ? `${roleLabel} · ${student}` : roleLabel;
    }
    onChange(next);
  };

  const showStudentField =
    doc.role === 'wspolorganizujacy_ksztalcenie' ||
    doc.role === 'wspolorganizujacy_indywidualne' ||
    doc.role === 'pedagog_psycholog';

  const showPlannedTasksField =
    doc.role === 'biblioteka' || doc.role === 'logopeda' || doc.role === 'swietlica';

  return (
    <div className="space-y-8">
      <FormTopBar
        docTitle={doc.title}
        metaText={`Podsumowanie efektów pracy · Semestr ${doc.semester} · Rok szkolny ${doc.schoolYear || '—'}`}
        onResetDoc={onRequestReset}
      />

      {/* 01. Rola i dane identyfikacyjne */}
      <section>
        <SectionHeader
          index="01"
          title="Stanowisko / komórka organizacyjna i dane podstawowe"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Field label="Rola / komórka szkoły">
              <select
                value={doc.role}
                onChange={(e) => update({ role: e.target.value as SpecialistRole })}
                className={inputClass}
              >
                {(Object.keys(SPECIALIST_ROLE_LABELS) as SpecialistRole[]).map((r) => (
                  <option key={r} value={r}>
                    {SPECIALIST_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Imię i nazwisko specjalisty / opiekuna">
            <ProfileComboInput
              value={doc.specialistName}
              onChange={(val) => update({ specialistName: val })}
              options={getProfileTeacherOptions(profile)}
              placeholder="Imię i nazwisko"
              dropdownHeader="Dane z Profilu"
            />
          </Field>

          <Field label="Nazwa szkoły / placówki">
            <ProfileComboInput
              value={doc.schoolName}
              onChange={(val) => update({ schoolName: val })}
              options={getProfileSchoolOptions(profile)}
              placeholder="Nazwa szkoły"
              dropdownHeader="Szkoła zapisana w Profilu"
            />
          </Field>

          <Field label="Rok szkolny">
            <ProfileComboInput
              value={doc.schoolYear}
              onChange={(val) => update({ schoolYear: val })}
              options={getProfileYearOptions(profile, availableYears)}
              className={`${inputClass} font-mono-tabular`}
              dropdownHeader="Lata szkolne z Profilu i archiwum"
            />
          </Field>

          <Field label="Okres / Semestr">
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

          {showStudentField && (
            <div className="md:col-span-2">
              <Field
                label={
                  doc.role === 'pedagog_psycholog'
                    ? 'Uczeń / grupa uczniów / zakres wsparcia (opcjonalnie)'
                    : 'Uczeń / klasa (np. inicjały lub imię i nazwisko ucznia, klasa, nr orzeczenia)'
                }
              >
                <ProfileComboInput
                  value={doc.studentInfo}
                  onChange={(val) => update({ studentInfo: val })}
                  options={studentClassOptions}
                  placeholder="Np. Jan K., klasa 4B (lub ogólne podsumowanie oddziałów)"
                  dropdownHeader="Klasy zapisane w Profilu"
                />
              </Field>
            </div>
          )}

          {showPlannedTasksField && (
            <div className="md:col-span-2">
              <TemplateTextareaField
                label="Planowane zadania w danym okresie"
                category="realizacja_zadan_efekty"
                rows={3}
                value={doc.plannedTasks}
                onChange={(val) => update({ plannedTasks: val })}
                placeholder="Główne cele i zadania zaplanowane na bieżący semestr / rok szkolny..."
              />
            </div>
          )}
        </div>
      </section>

      {/* 02. Realizacja zadań, efekty i wnioski */}
      <section>
        <SectionHeader
          index="02"
          title="Realizacja zadań i uzyskane efekty"
          subtitle="Kluczowe filary podsumowania pracy specjalisty lub komórki szkolnej"
        />
        <div className="space-y-4">
          <TemplateTextareaField
            label="Realizacja zadań"
            category="realizacja_zadan_efekty"
            rows={4}
            value={doc.tasksRealization}
            onChange={(val) => update({ tasksRealization: val })}
            placeholder="Szczegółowy opis podjętych działań, zajęć, konsultacji, projektów lub opieki..."
          />

          <TemplateTextareaField
            label="Efekty podjętych działań"
            category="realizacja_zadan_efekty"
            rows={4}
            value={doc.effects}
            onChange={(val) => update({ effects: val })}
            placeholder="Zaobserwowane postępy ucznia/uczniów, osiągnięte cele terapeutyczne, edukacyjne lub czytelnicze..."
          />

          <TemplateTextareaField
            label="Wnioski z bieżącej pracy"
            category="wnioski_ewaluacja"
            rows={3}
            value={doc.conclusions}
            onChange={(val) => update({ conclusions: val })}
            placeholder="Bieżące spostrzeżenia dotyczące skuteczności form wsparcia i organizacji zajęć..."
          />
        </div>
      </section>

      {/* 03. Program Wychowawczo-Profilaktyczny i wnioski do dalszej pracy */}
      <section>
        <SectionHeader
          index="03"
          title="Program Wychowawczo-Profilaktyczny i wnioski do dalszej pracy"
        />
        <div className="space-y-4">
          <TemplateTextareaField
            label="Realizacja Programu Wychowawczo-Profilaktycznego"
            category="program_profilaktyczny"
            rows={3}
            value={doc.preventiveProgram}
            onChange={(val) => update({ preventiveProgram: val })}
            placeholder="Wpisz działania profilaktyczne, warsztaty, rozmowy wspierające oraz inicjatywy wychowawcze..."
          />

          <TemplateTextareaField
            label="Stopień realizacji wniosków z poprzedniego roku szkolnego"
            category="wnioski_ewaluacja"
            rows={3}
            value={doc.previousConclusionsStatus}
            onChange={(val) => update({ previousConclusionsStatus: val })}
            placeholder="Ocena wdrożenia zaleceń z poprzedniego okresu..."
          />

          <ConclusionsField
            label="Wnioski do dalszej pracy"
            value={doc.futureConclusions}
            onChange={(val) => update({ futureConclusions: val })}
            onOpenPicker={onOpenConclusionsPicker}
            placeholder="Wpisz wnioski do dalszej pracy lub wybierz gotowe z bazy dla swojej roli..."
            rows={5}
          />

          <div className="max-w-xs">
            <Field label="Data sporządzenia podsumowania">
              <ProfileComboInput
                value={doc.signatureDate}
                onChange={(val) => update({ signatureDate: val })}
                options={getProfileDateOptions(profile)}
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

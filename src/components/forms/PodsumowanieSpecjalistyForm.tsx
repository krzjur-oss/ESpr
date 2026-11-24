import React from 'react';
import {
  PodsumowanieSpecjalistyDoc,
  SPECIALIST_ROLE_LABELS,
  SpecialistRole,
} from '../../types/reports';
import {
  ConclusionsField,
  Field,
  FormTopBar,
  SectionHeader,
  inputClass,
  textareaClass,
} from './FormPrimitives';

interface Props {
  doc: PodsumowanieSpecjalistyDoc;
  onChange: (updated: PodsumowanieSpecjalistyDoc) => void;
  onOpenConclusionsPicker: () => void;
  onRequestReset: () => void;
}

export const PodsumowanieSpecjalistyForm: React.FC<Props> = ({
  doc,
  onChange,
  onOpenConclusionsPicker,
  onRequestReset,
}) => {
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
            <input
              type="text"
              value={doc.specialistName}
              onChange={(e) => update({ specialistName: e.target.value })}
              placeholder="Imię i nazwisko"
              className={inputClass}
            />
          </Field>

          <Field label="Nazwa szkoły / placówki">
            <input
              type="text"
              value={doc.schoolName}
              onChange={(e) => update({ schoolName: e.target.value })}
              placeholder="Nazwa szkoły"
              className={inputClass}
            />
          </Field>

          <Field label="Rok szkolny">
            <input
              type="text"
              value={doc.schoolYear}
              onChange={(e) => update({ schoolYear: e.target.value })}
              className={`${inputClass} font-mono-tabular`}
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
                <input
                  type="text"
                  value={doc.studentInfo}
                  onChange={(e) => update({ studentInfo: e.target.value })}
                  placeholder="Np. Jan K., klasa 4B (lub ogólne podsumowanie oddziałów)"
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          {showPlannedTasksField && (
            <div className="md:col-span-2">
              <Field label="Planowane zadania w danym okresie">
                <textarea
                  rows={3}
                  value={doc.plannedTasks}
                  onChange={(e) => update({ plannedTasks: e.target.value })}
                  placeholder="Główne cele i zadania zaplanowane na bieżący semestr / rok szkolny..."
                  className={textareaClass}
                />
              </Field>
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
          <Field label="Realizacja zadań">
            <textarea
              rows={4}
              value={doc.tasksRealization}
              onChange={(e) => update({ tasksRealization: e.target.value })}
              placeholder="Szczegółowy opis podjętych działań, zajęć, konsultacji, projektów lub opieki..."
              className={textareaClass}
            />
          </Field>

          <Field label="Efekty podjętych działań">
            <textarea
              rows={4}
              value={doc.effects}
              onChange={(e) => update({ effects: e.target.value })}
              placeholder="Zaobserwowane postępy ucznia/uczniów, osiągnięte cele terapeutyczne, edukacyjne lub czytelnicze..."
              className={textareaClass}
            />
          </Field>

          <Field label="Wnioski z bieżącej pracy">
            <textarea
              rows={3}
              value={doc.conclusions}
              onChange={(e) => update({ conclusions: e.target.value })}
              placeholder="Bieżące spostrzeżenia dotyczące skuteczności form wsparcia i organizacji zajęć..."
              className={textareaClass}
            />
          </Field>
        </div>
      </section>

      {/* 03. Program Wychowawczo-Profilaktyczny i wnioski do dalszej pracy */}
      <section>
        <SectionHeader
          index="03"
          title="Program Wychowawczo-Profilaktyczny i wnioski do dalszej pracy"
        />
        <div className="space-y-4">
          <Field label="Realizacja Programu Wychowawczo-Profilaktycznego">
            <textarea
              rows={3}
              value={doc.preventiveProgram}
              onChange={(e) => update({ preventiveProgram: e.target.value })}
              placeholder="Wpisz działania profilaktyczne, warsztaty, rozmowy wspierające oraz inicjatywy wychowawcze..."
              className={textareaClass}
            />
          </Field>

          <Field label="Stopień realizacji wniosków z poprzedniego roku szkolnego">
            <textarea
              rows={3}
              value={doc.previousConclusionsStatus}
              onChange={(e) => update({ previousConclusionsStatus: e.target.value })}
              placeholder="Ocena wdrożenia zaleceń z poprzedniego okresu..."
              className={textareaClass}
            />
          </Field>

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
              <input
                type="text"
                value={doc.signatureDate}
                onChange={(e) => update({ signatureDate: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </Field>
          </div>
        </div>
      </section>
    </div>
  );
};

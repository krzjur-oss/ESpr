import React from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import {
  CURRICULUM_STATUS_LABELS,
  CurriculumStatus,
  ReportDocument,
  TeacherProfile,
  ZbiorczeEfektyDoc,
  ZbiorczeRow,
} from '../../types/reports';
import {
  aggregateIntoCoordinatorDoc,
  createId,
  getMatchingSubjectCardsForCoordinator,
} from '../../utils/documentFactory';
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
  getProfileSubjectOptions,
  getProfileTeacherOptions,
  getProfileYearOptions,
} from './ProfileComboInput';

interface Props {
  doc: ZbiorczeEfektyDoc;
  allDocuments: ReportDocument[];
  profile: TeacherProfile;
  availableYears?: string[];
  onChange: (updated: ZbiorczeEfektyDoc) => void;
  onOpenConclusionsPicker: () => void;
  onRequestReset: () => void;
}

export const ZbiorczeEfektyForm: React.FC<Props> = ({
  doc,
  allDocuments,
  profile,
  availableYears = [],
  onChange,
  onOpenConclusionsPicker,
  onRequestReset,
}) => {
  const subjectCardsCount = getMatchingSubjectCardsForCoordinator(allDocuments, doc).length;
  const sessionTeacherNames = Array.from(
    new Set(
      allDocuments
        .filter((d) => d.type === 'efekty_nauczania')
        .map((d) => d.teacherName.trim())
        .filter(Boolean)
    )
  );
  const subjectStageOptions = [
    ...getProfileSubjectOptions(profile),
    {
      value: 'Edukacja wczesnoszkolna (klasy I–III)',
      subtitle: 'Wariant edukacji wczesnoszkolnej',
    },
  ];

  const update = (patch: Partial<ZbiorczeEfektyDoc>) => {
    const next = { ...doc, ...patch, updatedAt: new Date().toISOString() };
    if ('mode' in patch || 'subjectOrStage' in patch) {
      const m = patch.mode ?? doc.mode;
      const subj = (patch.subjectOrStage ?? doc.subjectOrStage).trim();
      next.title =
        m === 'wczesnoszkolna'
          ? 'Sprawozdanie zbiorcze · Edukacja wczesnoszkolna'
          : `Sprawozdanie zbiorcze · ${subj || 'Zespół przedmiotowy'}`;
    }
    onChange(next);
  };

  const addRow = () => {
    const newRow: ZbiorczeRow = {
      id: createId(),
      className: '',
      teacherName: '',
      curriculumStatus: 'na_biezaco',
      curriculumDetails: '',
      failingCount: '0',
      excellentCount: '0',
      notes: '',
    };
    update({ rows: [...doc.rows, newRow] });
  };

  const updateRow = (id: string, patch: Partial<ZbiorczeRow>) => {
    update({
      rows: doc.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const removeRow = (id: string) => {
    if (doc.rows.length <= 1) return;
    update({ rows: doc.rows.filter((r) => r.id !== id) });
  };

  const handleAggregateFromCards = () => {
    const aggregated = aggregateIntoCoordinatorDoc(allDocuments, doc);
    onChange(aggregated);
  };

  return (
    <div className="space-y-8">
      <FormTopBar
        docTitle={doc.title}
        metaText={`Sprawozdanie zbiorcze koordynatora · Semestr ${doc.semester} · Rok szkolny ${doc.schoolYear || '—'}`}
        updatedAt={doc.updatedAt}
        onResetDoc={onRequestReset}
      />

      {/* 01. Tryb i dane koordynatora */}
      <section>
        <SectionHeader
          index="01"
          title="Zakres sprawozdania zbiorczego"
          subtitle="Wybierz wariant przedmiotowy lub edukację wczesnoszkolną (klasy I–III)"
        />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => update({ mode: 'przedmiotowy' })}
              className={`rounded-lg border px-4 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                doc.mode === 'przedmiotowy'
                  ? 'border-blue-900 bg-blue-50 text-blue-900 font-semibold'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Koordynator zespołu przedmiotowego (klasy IV–VIII / ponadpodstawowa)
            </button>
            <button
              type="button"
              onClick={() =>
                update({
                  mode: 'wczesnoszkolna',
                  subjectOrStage: doc.subjectOrStage || 'Edukacja wczesnoszkolna (klasy I–III)',
                })
              }
              className={`rounded-lg border px-4 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                doc.mode === 'wczesnoszkolna'
                  ? 'border-blue-900 bg-blue-50 text-blue-900 font-semibold'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Koordynator edukacji wczesnoszkolnej (klasy I–III)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nazwa szkoły / placówki">
              <ProfileComboInput
                value={doc.schoolName}
                onChange={(val) => update({ schoolName: val })}
                options={getProfileSchoolOptions(profile)}
                placeholder="Nazwa szkoły"
                dropdownHeader="Szkoła zapisana w Profilu"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rok szkolny">
                <ProfileComboInput
                  value={doc.schoolYear}
                  onChange={(val) => update({ schoolYear: val })}
                  options={getProfileYearOptions(profile, availableYears)}
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

            <Field label="Przedmiot / etap edukacyjny">
              <ProfileComboInput
                value={doc.subjectOrStage}
                onChange={(val) => update({ subjectOrStage: val })}
                options={subjectStageOptions}
                placeholder="np. Matematyka lub Edukacja wczesnoszkolna (klasy I–III)"
                dropdownHeader="Przedmioty z Profilu i etapy"
              />
            </Field>
            <Field label="Imię i nazwisko koordynatora">
              <ProfileComboInput
                value={doc.coordinatorName}
                onChange={(val) => update({ coordinatorName: val })}
                options={getProfileTeacherOptions(profile, sessionTeacherNames)}
                placeholder="Imię i nazwisko koordynatora"
                dropdownHeader="Dane z Profilu i kart"
              />
            </Field>
          </div>
        </div>
      </section>

      {/* 02. Agregacja danych z klas */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              <span className="font-mono-tabular text-blue-900 mr-2">02.</span>
              Zestawienie klas i realizacji podstawy programowej
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Dodaj wiersze ręcznie lub zaczytaj dane z wypełnionych kart przedmiotowych w tej sesji
            </p>
          </div>
          <div className="flex items-center gap-2">
            {subjectCardsCount > 0 && (
              <button
                type="button"
                onClick={handleAggregateFromCards}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Zaczytaj z kart ({subjectCardsCount})</span>
              </button>
            )}
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj klasę</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {doc.rows.map((row, idx) => (
            <div
              key={row.id}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 font-mono-tabular">
                  Pozycja #{idx + 1}
                </span>
                {doc.rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Usuń</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="Klasa">
                  <ProfileComboInput
                    value={row.className}
                    onChange={(val) => updateRow(row.id, { className: val })}
                    options={getProfileClassOptions(profile)}
                    placeholder="np. 4A"
                    dropdownHeader="Klasy z Profilu"
                  />
                </Field>
                <Field label="Nauczyciel">
                  <ProfileComboInput
                    value={row.teacherName}
                    onChange={(val) => updateRow(row.id, { teacherName: val })}
                    options={getProfileTeacherOptions(profile, sessionTeacherNames)}
                    placeholder="Imię i nazwisko"
                    dropdownHeader="Nauczyciele z Profilu i kart"
                  />
                </Field>
                <Field label="Podstawa programowa">
                  <select
                    value={row.curriculumStatus}
                    onChange={(e) =>
                      updateRow(row.id, {
                        curriculumStatus: e.target.value as CurriculumStatus,
                      })
                    }
                    className={inputClass}
                  >
                    {(Object.keys(CURRICULUM_STATUS_LABELS) as CurriculumStatus[]).map((k) => (
                      <option key={k} value={k}>
                        {CURRICULUM_STATUS_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Oceny ndst">
                    <input
                      type="number"
                      min="0"
                      value={row.failingCount}
                      onChange={(e) => updateRow(row.id, { failingCount: e.target.value })}
                      className={`${inputClass} font-mono-tabular`}
                    />
                  </Field>
                  <Field label="Oceny cel">
                    <input
                      type="number"
                      min="0"
                      value={row.excellentCount}
                      onChange={(e) => updateRow(row.id, { excellentCount: e.target.value })}
                      className={`${inputClass} font-mono-tabular`}
                    />
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Szczegóły realizacji podstawy (jeśli dotyczy)">
                  <input
                    type="text"
                    value={row.curriculumDetails}
                    onChange={(e) => updateRow(row.id, { curriculumDetails: e.target.value })}
                    placeholder="Zakres opóźnienia / wyprzedzenia lub brak uwag"
                    className={inputClass}
                  />
                </Field>
                <Field label="Uwagi szczegółowe">
                  <input
                    type="text"
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, { notes: e.target.value })}
                    placeholder="Dodatkowe spostrzeżenia dla klasy"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        {doc.mode === 'wczesnoszkolna' && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <TemplateTextareaField
              label="Obszary mocne w edukacji wczesnoszkolnej (klasy I–III)"
              category="oceny_wyniki"
              rows={4}
              value={doc.earlyEdStrongAreas}
              onChange={(val) => update({ earlyEdStrongAreas: val })}
              placeholder="Np. technika głośnego czytania, aktywność plastyczna, integracja zespołów klasowych..."
            />
            <TemplateTextareaField
              label="Obszary słabsze / wymagające wsparcia (klasy I–III)"
              category="oceny_wyniki"
              rows={4}
              value={doc.earlyEdWeakAreas}
              onChange={(val) => update({ earlyEdWeakAreas: val })}
              placeholder="Np. czytanie ze zrozumieniem zadań tekstowych, poprawność ortograficzna, grafomotoryka..."
            />
          </div>
        )}
      </section>

      {/* 03. Osiągnięcia, wyjazdy, program wychowawczo-profilaktyczny */}
      <section>
        <SectionHeader
          index="03"
          title="Osiągnięcia, wyjazdy i realizacja programu wychowawczo-profilaktycznego"
        />
        <div className="space-y-4">
          <TemplateTextareaField
            label="Zbiorcze osiągnięcia i udział w konkursach / zawodach"
            category="sciezka_konkursy_wyjazdy"
            rows={3}
            value={doc.achievements}
            onChange={(val) => update({ achievements: val })}
            placeholder="Zestawienie konkursów szkolnych i międzyszkolnych oraz sukcesów uczniów..."
          />
          <TemplateTextareaField
            label="Wyjazdy edukacyjne w ramach realizacji podstawy programowej"
            category="sciezka_konkursy_wyjazdy"
            rows={2}
            value={doc.educationalTrips}
            onChange={(val) => update({ educationalTrips: val })}
            placeholder="Zrealizowane wyjścia, warsztaty wyjazdowe, wycieczki przedmiotowe..."
          />
          <TemplateTextareaField
            label="Realizacja programu wychowawczo-profilaktycznego"
            category="program_profilaktyczny"
            rows={3}
            value={doc.preventiveProgram}
            onChange={(val) => update({ preventiveProgram: val })}
            placeholder="Działania wychowawcze i profilaktyczne zrealizowane przez zespół..."
          />
        </div>
      </section>

      {/* 04. Wnioski i podpis */}
      <section>
        <SectionHeader index="04" title="Wnioski zespołu i podpis koordynatora" />
        <div className="space-y-4">
          <TemplateTextareaField
            label="Stopień realizacji wniosków z poprzedniego roku szkolnego"
            category="wnioski_ewaluacja"
            rows={3}
            value={doc.previousConclusionsStatus}
            onChange={(val) => update({ previousConclusionsStatus: val })}
            placeholder="Podsumowanie wdrożenia wniosków z ubiegłego roku..."
          />

          <ConclusionsField
            label="Wnioski do dalszej pracy"
            value={doc.futureConclusions}
            onChange={(val) => update({ futureConclusions: val })}
            onOpenPicker={onOpenConclusionsPicker}
            placeholder="Wpisz wnioski zespołu lub wstaw z bazy podpowiedzi..."
            rows={5}
          />

          <div className="max-w-xs">
            <Field label="Data sporządzenia sprawozdania">
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

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  AdditionalTaskRow,
  KartaInformacyjnaDoc,
  SubjectHoursRow,
  TeacherProfile,
} from '../../types/reports';
import { createId } from '../../utils/documentFactory';
import {
  Field,
  FormTopBar,
  SectionHeader,
  TemplateTextareaField,
  inputClass,
} from './FormPrimitives';
import {
  ProfileComboInput,
  ProfileComboOption,
  getProfileClassOptions,
  getProfileDateOptions,
  getProfileSchoolOptions,
  getProfileSubjectOptions,
  getProfileTeacherOptions,
} from './ProfileComboInput';

interface Props {
  doc: KartaInformacyjnaDoc;
  profile: TeacherProfile;
  onChange: (updated: KartaInformacyjnaDoc) => void;
  onRequestReset: () => void;
}

export const KartaInformacyjnaForm: React.FC<Props> = ({
  doc,
  profile,
  onChange,
  onRequestReset,
}) => {
  const periodOptions: ProfileComboOption[] = [
    ...(profile.periodText.trim()
      ? [{ value: profile.periodText.trim(), subtitle: 'Domyślny okres z Profilu' }]
      : []),
    { value: '01.09.2025 – 31.01.2026', subtitle: 'I semestr' },
    { value: '01.02.2026 – 26.06.2026', subtitle: 'II semestr' },
  ];

  const homeroomOptions = getProfileClassOptions(profile, [
    { value: 'brak', subtitle: 'Brak wychowawstwa' },
  ]);

  const update = (patch: Partial<KartaInformacyjnaDoc>) => {
    const next = { ...doc, ...patch, updatedAt: new Date().toISOString() };
    if ('period' in patch) {
      next.title = `Karta informacyjna · ${(patch.period ?? doc.period) || 'okres'}`;
    }
    onChange(next);
  };

  const addSubjectHour = () => {
    const row: SubjectHoursRow = { id: createId(), subject: '', hours: '' };
    update({ subjectHours: [...doc.subjectHours, row] });
  };

  const updateSubjectHour = (id: string, patch: Partial<SubjectHoursRow>) => {
    update({
      subjectHours: doc.subjectHours.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const removeSubjectHour = (id: string) => {
    if (doc.subjectHours.length <= 1) return;
    update({ subjectHours: doc.subjectHours.filter((r) => r.id !== id) });
  };

  const addTask = (field: 'directorTasks' | 'teacherInitiativeTasks') => {
    const row: AdditionalTaskRow = { id: createId(), taskType: '', results: '', conclusions: '' };
    update({ [field]: [...doc[field], row] });
  };

  const updateTask = (
    field: 'directorTasks' | 'teacherInitiativeTasks',
    id: string,
    patch: Partial<AdditionalTaskRow>
  ) => {
    update({
      [field]: doc[field].map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const removeTask = (field: 'directorTasks' | 'teacherInitiativeTasks', id: string) => {
    if (doc[field].length <= 1) return;
    update({ [field]: doc[field].filter((r) => r.id !== id) });
  };

  return (
    <div className="space-y-8">
      <FormTopBar
        docTitle={doc.title}
        metaText={`Karta informacyjna nauczyciela · Rok szkolny ${doc.schoolYear || '—'}`}
        updatedAt={doc.updatedAt}
        onResetDoc={onRequestReset}
      />

      {/* 01. Dane ogólne i godziny */}
      <section>
        <SectionHeader
          index="01"
          title="Dane ogólne i wymiar godzin"
          subtitle="Informacje potrzebne do oceny pracy, dodatku motywacyjnego oraz nagród"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Imię i nazwisko nauczyciela">
            <ProfileComboInput
              value={doc.teacherName}
              onChange={(val) => update({ teacherName: val })}
              options={getProfileTeacherOptions(profile)}
              placeholder="Imię i nazwisko"
              dropdownHeader="Nauczyciel z Profilu"
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
          <Field label="Okres rozliczeniowy">
            <div className="space-y-2">
              <ProfileComboInput
                value={doc.period}
                onChange={(val) => update({ period: val })}
                options={periodOptions}
                placeholder="np. 01.09.2025 – 31.01.2026"
                className={`${inputClass} font-mono-tabular`}
                dropdownHeader="Okres z Profilu i semestry"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => update({ period: '01.09.2025 – 31.01.2026' })}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  I semestr (01.09–31.01)
                </button>
                <button
                  type="button"
                  onClick={() => update({ period: '01.02.2026 – 26.06.2026' })}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  II semestr (01.02–26.06)
                </button>
              </div>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Łączna liczba godzin w szkole">
              <input
                type="text"
                value={doc.totalHours}
                onChange={(e) => update({ totalHours: e.target.value })}
                placeholder="np. 22/18"
                className={`${inputClass} font-mono-tabular`}
              />
            </Field>
            <Field label="Wychowawstwo (klasa / brak)">
              <ProfileComboInput
                value={doc.homeroomClass}
                onChange={(val) => update({ homeroomClass: val })}
                options={homeroomOptions}
                placeholder="np. 5B lub brak"
                dropdownHeader="Klasy i wychowawstwo z Profilu"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-700">
              Liczba godzin z poszczególnych przedmiotów / zajęć
            </label>
            <button
              type="button"
              onClick={addSubjectHour}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj przedmiot</span>
            </button>
          </div>
          <div className="space-y-2">
            {doc.subjectHours.map((row) => (
              <div key={row.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <ProfileComboInput
                    value={row.subject}
                    onChange={(val) => updateSubjectHour(row.id, { subject: val })}
                    options={getProfileSubjectOptions(profile)}
                    placeholder="Nazwa przedmiotu lub zajęć"
                    dropdownHeader="Przedmioty zapisane w Profilu"
                  />
                </div>
                <input
                  type="text"
                  value={row.hours}
                  onChange={(e) => updateSubjectHour(row.id, { hours: e.target.value })}
                  placeholder="Liczba godz."
                  className={`${inputClass} w-32 font-mono-tabular`}
                />
                {doc.subjectHours.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubjectHour(row.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                    aria-label="Usuń wiersz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 02. Podnoszenie własnych kwalifikacji */}
      <section>
        <SectionHeader index="02" title="Podnoszenie własnych kwalifikacji" />
        <div className="space-y-4">
          <TemplateTextareaField
            label="Studia i kursy kwalifikacyjne"
            category="kwalifikacje_dzialalnosc"
            rows={2}
            value={doc.qualificationsStudies}
            onChange={(val) => update({ qualificationsStudies: val })}
            placeholder="Nazwa kierunku, uczelni/ośrodka, termin ukończenia lub w trakcie..."
          />
          <TemplateTextareaField
            label="Kursy doskonalące, warsztaty i szkoleniowe Rady Pedagogiczne"
            category="kwalifikacje_dzialalnosc"
            rows={3}
            value={doc.qualificationsWorkshops}
            onChange={(val) => update({ qualificationsWorkshops: val })}
            placeholder="Tematyka szkoleń, webinarów, warsztatów oraz daty odbycia..."
          />
          <TemplateTextareaField
            label="Udział w zebraniach metodycznych i zespołach przedmiotowych"
            category="kwalifikacje_dzialalnosc"
            rows={2}
            value={doc.qualificationsMethodical}
            onChange={(val) => update({ qualificationsMethodical: val })}
            placeholder="Spotkania sieci współpracy, zespołów przedmiotowych lub wychowawczych..."
          />
        </div>
      </section>

      {/* 03. Osiągnięcia, wycieczki, baza, zajęcia statutowe */}
      <section>
        <SectionHeader index="03" title="Działalność dydaktyczna, wychowawcza i organizacyjna" />
        <div className="space-y-4">
          <TemplateTextareaField
            label="Osiągnięcia uczniów (olimpiady, konkursy, zawody)"
            category="sciezka_konkursy_wyjazdy"
            rows={3}
            value={doc.studentAchievements}
            onChange={(val) => update({ studentAchievements: val })}
            placeholder="Przygotowanie uczniów, uzyskane tytuły laureatów, finalistów, wyróżnienia..."
          />
          <TemplateTextareaField
            label="Organizacja wycieczek szkolnych i wyjazdów (w tym funkcja kierownika)"
            category="sciezka_konkursy_wyjazdy"
            rows={2}
            value={doc.tripsOrganization}
            onChange={(val) => update({ tripsOrganization: val })}
            placeholder="Miejsce, termin, pełniona rola (kierownik wycieczki / opiekun)..."
          />
          <TemplateTextareaField
            label="Wzbogacenie bazy dydaktycznej i materiałowej szkoły"
            category="kwalifikacje_dzialalnosc"
            rows={2}
            value={doc.didacticBaseEnrichment}
            onChange={(val) => update({ didacticBaseEnrichment: val })}
            placeholder="Opracowane pomoce dydaktyczne, gazetki, doposażenie pracowni, pozyskane środki..."
          />
          <TemplateTextareaField
            label="Zajęcia statutowe (koła zainteresowań, konsultacje, zajęcia wyrównawcze)"
            category="kwalifikacje_dzialalnosc"
            rows={2}
            value={doc.statutoryActivities}
            onChange={(val) => update({ statutoryActivities: val })}
            placeholder="Rodzaj prowadzonych zajęć statutowych, częstotliwość i liczba uczestników..."
          />
        </div>
      </section>

      {/* 04. Zadania zlecone przez dyrektora */}
      <section>
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
          <h3 className="text-sm font-semibold text-slate-900">
            <span className="font-mono-tabular text-blue-900 mr-2">04.</span>
            Realizacja zadań dodatkowych zleconych przez dyrektora
          </h3>
          <button
            type="button"
            onClick={() => addTask('directorTasks')}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dodaj zadanie</span>
          </button>
        </div>
        <div className="space-y-3">
          {doc.directorTasks.map((t, idx) => (
            <div
              key={t.id}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 font-mono-tabular">
                  Zadanie #{idx + 1}
                </span>
                {doc.directorTasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask('directorTasks', t.id)}
                    className="text-xs text-slate-500 hover:text-red-700 cursor-pointer"
                  >
                    Usuń
                  </button>
                )}
              </div>
              <Field label="Rodzaj zadania">
                <input
                  type="text"
                  value={t.taskType}
                  onChange={(e) =>
                    updateTask('directorTasks', t.id, { taskType: e.target.value })
                  }
                  placeholder="Np. Praca w zespole ds. promocji szkoły / ewaluacji..."
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TemplateTextareaField
                  label="Uzyskane wyniki"
                  category="realizacja_zadan_efekty"
                  rows={2}
                  value={t.results}
                  onChange={(val) =>
                    updateTask('directorTasks', t.id, { results: val })
                  }
                />
                <TemplateTextareaField
                  label="Wnioski"
                  category="wnioski_ewaluacja"
                  rows={2}
                  value={t.conclusions}
                  onChange={(val) =>
                    updateTask('directorTasks', t.id, { conclusions: val })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 05. Zadania podejmowane z inicjatywy nauczyciela */}
      <section>
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
          <h3 className="text-sm font-semibold text-slate-900">
            <span className="font-mono-tabular text-blue-900 mr-2">05.</span>
            Zadania podejmowane z własnej inicjatywy nauczyciela
          </h3>
          <button
            type="button"
            onClick={() => addTask('teacherInitiativeTasks')}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dodaj inicjatywę</span>
          </button>
        </div>
        <div className="space-y-3">
          {doc.teacherInitiativeTasks.map((t, idx) => (
            <div
              key={t.id}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 font-mono-tabular">
                  Inicjatywa #{idx + 1}
                </span>
                {doc.teacherInitiativeTasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask('teacherInitiativeTasks', t.id)}
                    className="text-xs text-slate-500 hover:text-red-700 cursor-pointer"
                  >
                    Usuń
                  </button>
                )}
              </div>
              <Field label="Rodzaj zadania / projektu">
                <input
                  type="text"
                  value={t.taskType}
                  onChange={(e) =>
                    updateTask('teacherInitiativeTasks', t.id, { taskType: e.target.value })
                  }
                  placeholder="Np. Organizacja akcji charytatywnej, konkursu szkolnego, innowacji pedagogicznej..."
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TemplateTextareaField
                  label="Uzyskane wyniki"
                  category="realizacja_zadan_efekty"
                  rows={2}
                  value={t.results}
                  onChange={(val) =>
                    updateTask('teacherInitiativeTasks', t.id, { results: val })
                  }
                />
                <TemplateTextareaField
                  label="Wnioski"
                  category="wnioski_ewaluacja"
                  rows={2}
                  value={t.conclusions}
                  onChange={(val) =>
                    updateTask('teacherInitiativeTasks', t.id, { conclusions: val })
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 max-w-xs">
          <Field label="Data sporządzenia karty">
            <ProfileComboInput
              value={doc.signatureDate}
              onChange={(val) => update({ signatureDate: val })}
              options={getProfileDateOptions(profile)}
              className={`${inputClass} font-mono-tabular`}
              dropdownHeader="Data z Profilu lub bieżąca"
            />
          </Field>
        </div>
      </section>
    </div>
  );
};

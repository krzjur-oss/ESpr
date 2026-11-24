import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  AdditionalTaskRow,
  KartaInformacyjnaDoc,
  SubjectHoursRow,
} from '../../types/reports';
import { createId } from '../../utils/documentFactory';
import {
  Field,
  FormTopBar,
  SectionHeader,
  inputClass,
  textareaClass,
} from './FormPrimitives';

interface Props {
  doc: KartaInformacyjnaDoc;
  onChange: (updated: KartaInformacyjnaDoc) => void;
  onRequestReset: () => void;
}

export const KartaInformacyjnaForm: React.FC<Props> = ({
  doc,
  onChange,
  onRequestReset,
}) => {
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
            <input
              type="text"
              value={doc.teacherName}
              onChange={(e) => update({ teacherName: e.target.value })}
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
          <Field label="Okres rozliczeniowy">
            <div className="space-y-2">
              <input
                type="text"
                value={doc.period}
                onChange={(e) => update({ period: e.target.value })}
                placeholder="np. 01.09.2025 – 31.01.2026"
                className={`${inputClass} font-mono-tabular`}
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
              <input
                type="text"
                value={doc.homeroomClass}
                onChange={(e) => update({ homeroomClass: e.target.value })}
                placeholder="np. 5B lub brak"
                className={inputClass}
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
                <input
                  type="text"
                  value={row.subject}
                  onChange={(e) => updateSubjectHour(row.id, { subject: e.target.value })}
                  placeholder="Nazwa przedmiotu lub zajęć"
                  className={`${inputClass} flex-1`}
                />
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
          <Field label="Studia i kursy kwalifikacyjne">
            <textarea
              rows={2}
              value={doc.qualificationsStudies}
              onChange={(e) => update({ qualificationsStudies: e.target.value })}
              placeholder="Nazwa kierunku, uczelni/ośrodka, termin ukończenia lub w trakcie..."
              className={textareaClass}
            />
          </Field>
          <Field label="Kursy doskonalące, warsztaty i szkoleniowe Rady Pedagogiczne">
            <textarea
              rows={3}
              value={doc.qualificationsWorkshops}
              onChange={(e) => update({ qualificationsWorkshops: e.target.value })}
              placeholder="Tematyka szkoleń, webinarów, warsztatów oraz daty odbycia..."
              className={textareaClass}
            />
          </Field>
          <Field label="Udział w zebraniach metodycznych i zespołach przedmiotowych">
            <textarea
              rows={2}
              value={doc.qualificationsMethodical}
              onChange={(e) => update({ qualificationsMethodical: e.target.value })}
              placeholder="Spotkania sieci współpracy, zespołów przedmiotowych lub wychowawczych..."
              className={textareaClass}
            />
          </Field>
        </div>
      </section>

      {/* 03. Osiągnięcia, wycieczki, baza, zajęcia statutowe */}
      <section>
        <SectionHeader index="03" title="Działalność dydaktyczna, wychowawcza i organizacyjna" />
        <div className="space-y-4">
          <Field label="Osiągnięcia uczniów (olimpiady, konkursy, zawody)">
            <textarea
              rows={3}
              value={doc.studentAchievements}
              onChange={(e) => update({ studentAchievements: e.target.value })}
              placeholder="Przygotowanie uczniów, uzyskane tytuły laureatów, finalistów, wyróżnienia..."
              className={textareaClass}
            />
          </Field>
          <Field label="Organizacja wycieczek szkolnych i wyjazdów (w tym funkcja kierownika)">
            <textarea
              rows={2}
              value={doc.tripsOrganization}
              onChange={(e) => update({ tripsOrganization: e.target.value })}
              placeholder="Miejsce, termin, pełniona rola (kierownik wycieczki / opiekun)..."
              className={textareaClass}
            />
          </Field>
          <Field label="Wzbogacenie bazy dydaktycznej i materiałowej szkoły">
            <textarea
              rows={2}
              value={doc.didacticBaseEnrichment}
              onChange={(e) => update({ didacticBaseEnrichment: e.target.value })}
              placeholder="Opracowane pomoce dydaktyczne, gazetki, doposażenie pracowni, pozyskane środki..."
              className={textareaClass}
            />
          </Field>
          <Field label="Zajęcia statutowe (koła zainteresowań, konsultacje, zajęcia wyrównawcze)">
            <textarea
              rows={2}
              value={doc.statutoryActivities}
              onChange={(e) => update({ statutoryActivities: e.target.value })}
              placeholder="Rodzaj prowadzonych zajęć statutowych, częstotliwość i liczba uczestników..."
              className={textareaClass}
            />
          </Field>
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
                <Field label="Uzyskane wyniki">
                  <textarea
                    rows={2}
                    value={t.results}
                    onChange={(e) =>
                      updateTask('directorTasks', t.id, { results: e.target.value })
                    }
                    className={textareaClass}
                  />
                </Field>
                <Field label="Wnioski">
                  <textarea
                    rows={2}
                    value={t.conclusions}
                    onChange={(e) =>
                      updateTask('directorTasks', t.id, { conclusions: e.target.value })
                    }
                    className={textareaClass}
                  />
                </Field>
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
                <Field label="Uzyskane wyniki">
                  <textarea
                    rows={2}
                    value={t.results}
                    onChange={(e) =>
                      updateTask('teacherInitiativeTasks', t.id, { results: e.target.value })
                    }
                    className={textareaClass}
                  />
                </Field>
                <Field label="Wnioski">
                  <textarea
                    rows={2}
                    value={t.conclusions}
                    onChange={(e) =>
                      updateTask('teacherInitiativeTasks', t.id, { conclusions: e.target.value })
                    }
                    className={textareaClass}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 max-w-xs">
          <Field label="Data sporządzenia karty">
            <input
              type="text"
              value={doc.signatureDate}
              onChange={(e) => update({ signatureDate: e.target.value })}
              className={`${inputClass} font-mono-tabular`}
            />
          </Field>
        </div>
      </section>
    </div>
  );
};

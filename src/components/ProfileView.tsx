import React, { useState } from 'react';
import { Check, Copy, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { SemesterType, SubjectAssignment, TeacherProfile } from '../types/reports';
import { createId } from '../utils/documentFactory';
import { Field, SectionHeader, inputClass } from './forms/FormPrimitives';

interface ProfileViewProps {
  profile: TeacherProfile;
  documentsCount: number;
  onChange: (updated: TeacherProfile) => void;
  onApplyToAllDocuments: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  documentsCount,
  onChange,
  onApplyToAllDocuments,
}) => {
  const [newClassInput, setNewClassInput] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newClassScope, setNewClassScope] = useState('');
  const [newProgramNumber, setNewProgramNumber] = useState('');
  const [newTextbookNumber, setNewTextbookNumber] = useState('');
  const [newTextbookTitle, setNewTextbookTitle] = useState('');
  const [syncConfirmed, setSyncConfirmed] = useState(false);

  const update = (patch: Partial<TeacherProfile>) => {
    onChange({ ...profile, ...patch });
  };

  const updateAssignments = (nextAssignments: SubjectAssignment[]) => {
    const derivedSubjectsList = Array.from(
      new Set(
        nextAssignments
          .map((a) => a.subject.trim())
          .filter((s) => s.length > 0)
      )
    );
    update({
      subjectAssignments: nextAssignments,
      subjectsList: derivedSubjectsList,
    });
  };

  const addClass = () => {
    const val = newClassInput.trim();
    if (!val || profile.classesList.includes(val)) return;
    update({ classesList: [...profile.classesList, val] });
    setNewClassInput('');
  };

  const removeClass = (cls: string) => {
    update({ classesList: profile.classesList.filter((c) => c !== cls) });
  };

  const addAssignment = () => {
    const subj = newSubject.trim();
    if (!subj) return;
    const entry: SubjectAssignment = {
      id: createId(),
      subject: subj,
      classScope: newClassScope.trim(),
      programNumber: newProgramNumber.trim(),
      textbookNumber: newTextbookNumber.trim(),
      textbookTitle: newTextbookTitle.trim(),
    };
    updateAssignments([...profile.subjectAssignments, entry]);
    setNewSubject('');
    setNewClassScope('');
    setNewProgramNumber('');
    setNewTextbookNumber('');
    setNewTextbookTitle('');
  };

  const duplicateAssignment = (source: SubjectAssignment) => {
    const clone: SubjectAssignment = {
      id: createId(),
      subject: source.subject,
      classScope: '',
      programNumber: source.programNumber,
      textbookNumber: '',
      textbookTitle: '',
    };
    const idx = profile.subjectAssignments.findIndex((item) => item.id === source.id);
    const next = [...profile.subjectAssignments];
    next.splice(idx >= 0 ? idx + 1 : next.length, 0, clone);
    updateAssignments(next);
  };

  const updateAssignmentItem = (id: string, patch: Partial<SubjectAssignment>) => {
    updateAssignments(
      profile.subjectAssignments.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeAssignment = (id: string) => {
    updateAssignments(profile.subjectAssignments.filter((item) => item.id !== id));
  };

  const handleSync = () => {
    onApplyToAllDocuments();
    setSyncConfirmed(true);
    setTimeout(() => setSyncConfirmed(false), 2500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8 py-8">
      <div className="border-b border-slate-200 pb-5 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Wspólny profil nauczyciela i specjalisty
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Dane wpisane poniżej oraz przypisane programy i podręczniki podstawiają się automatycznie do nowo tworzonych kart.
          </p>
        </div>

        {documentsCount > 0 && (
          <button
            type="button"
            onClick={handleSync}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-900 bg-white px-4 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Aktualizuje dane nauczyciela, szkoły oraz programy/podręczniki w kartach z bieżącego roku (bez zmiany roku archiwalnych kart)"
          >
            {syncConfirmed ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Zaktualizowano bieżący rok</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Zastosuj do kart z {profile.schoolYear || 'bieżącego roku'}</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 space-y-8">
        <section>
          <SectionHeader
            index="01"
            title="Dane osobowe i szkolne"
            subtitle="Zapisywane wyłącznie lokalnie w pamięci przeglądarki (Local-First)"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Imię i nazwisko nauczyciela / specjalisty">
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
                placeholder="np. mgr Anna Kowalska"
                className={inputClass}
              />
            </Field>

            <Field label="Pełna nazwa szkoły / placówki">
              <input
                type="text"
                value={profile.schoolName}
                onChange={(e) => update({ schoolName: e.target.value })}
                placeholder="np. Szkoła Podstawowa nr 4 im. ..."
                className={inputClass}
              />
            </Field>

            <Field label="Bieżący rok szkolny">
              <input
                type="text"
                value={profile.schoolYear}
                onChange={(e) => update({ schoolYear: e.target.value })}
                placeholder="2025/2026"
                className={`${inputClass} font-mono-tabular`}
              />
            </Field>

            <Field label="Domyślny semestr">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                {(['I', 'II'] as SemesterType[]).map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => update({ defaultSemester: sem })}
                    className={`rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      profile.defaultSemester === sem
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semestr {sem}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Domyślny okres rozliczeniowy (do Karty informacyjnej)">
              <div className="space-y-2">
                <input
                  type="text"
                  value={profile.periodText}
                  onChange={(e) =>
                    update({ periodPreset: 'custom', periodText: e.target.value })
                  }
                  className={`${inputClass} font-mono-tabular`}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        periodPreset: 'sem1',
                        periodText: '01.09.2025 – 31.01.2026',
                        defaultSemester: 'I',
                      })
                    }
                    className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    I okres (01.09 – 31.01)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        periodPreset: 'sem2',
                        periodText: '01.02.2026 – 26.06.2026',
                        defaultSemester: 'II',
                      })
                    }
                    className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    II okres (01.02 – 26.06)
                  </button>
                </div>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Wychowawstwo (jeśli dotyczy)">
                <input
                  type="text"
                  value={profile.homeroomClass}
                  onChange={(e) => update({ homeroomClass: e.target.value })}
                  placeholder="np. 5B lub brak"
                  className={inputClass}
                />
              </Field>
              <Field label="Domyślna data podpisu">
                <input
                  type="text"
                  value={profile.signatureDate}
                  onChange={(e) => update({ signatureDate: e.target.value })}
                  placeholder="DD.MM.RRRR"
                  className={`${inputClass} font-mono-tabular`}
                />
              </Field>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            index="02"
            title="Nauczane klasy"
            subtitle="Podpowiadane podczas tworzenia kart dla poszczególnych oddziałów"
          />
          <div className="space-y-3">
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newClassInput}
                onChange={(e) => setNewClassInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addClass();
                  }
                }}
                placeholder="np. 6A"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addClass}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Dodaj klasę</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.classesList.map((cls) => (
                <span
                  key={cls}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800"
                >
                  <span>{cls}</span>
                  <button
                    type="button"
                    onClick={() => removeClass(cls)}
                    className="text-slate-400 hover:text-red-700 cursor-pointer"
                    aria-label={`Usuń klasę ${cls}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            index="03"
            title="Stałe przypisanie przedmiotów, poziomów, programów i podręczników"
            subtitle="Określ poziom lub klasy (np. 1-4, 5-8, 4, 5A) — po wyborze przedmiotu i klasy w karcie automatycznie podstawi się odpowiedni program, tytuł oraz numer podręcznika"
          />

          {/* Existing subject assignments */}
          <div className="space-y-3 mb-5">
            {profile.subjectAssignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
                Brak przypisanych przedmiotów. Dodaj pierwszy wariant przedmiotu i programu poniżej.
              </div>
            ) : (
              profile.subjectAssignments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-4">
                      <Field label="Przedmiot / zajęcia">
                        <input
                          type="text"
                          value={item.subject}
                          onChange={(e) =>
                            updateAssignmentItem(item.id, { subject: e.target.value })
                          }
                          placeholder="np. Religia, Matematyka"
                          className={inputClass}
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-3">
                      <Field label="Zakres klas">
                        <input
                          type="text"
                          value={item.classScope}
                          onChange={(e) =>
                            updateAssignmentItem(item.id, { classScope: e.target.value })
                          }
                          placeholder="np. 1-4, 5A"
                          className={`${inputClass} font-mono-tabular`}
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-4">
                      <Field label="Numer programu nauczania">
                        <input
                          type="text"
                          value={item.programNumber}
                          onChange={(e) =>
                            updateAssignmentItem(item.id, { programNumber: e.target.value })
                          }
                          placeholder="np. AZ-1-01/18"
                          className={`${inputClass} font-mono-tabular`}
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-1 flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateAssignment(item)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-900 transition-colors cursor-pointer"
                        aria-label={`Powiel wpis ${item.subject} dla kolejnej klasy`}
                        title="Powiel przedmiot i program dla kolejnej klasy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAssignment(item.id)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors cursor-pointer"
                        aria-label={`Usuń przypisanie ${item.subject}`}
                        title="Usuń przypisanie"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                      <Field label="Numer zatwierdzenia podręcznika">
                        <input
                          type="text"
                          value={item.textbookNumber}
                          onChange={(e) =>
                            updateAssignmentItem(item.id, { textbookNumber: e.target.value })
                          }
                          placeholder="np. AZ-11-01/18-20"
                          className={`${inputClass} font-mono-tabular`}
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-8">
                      <Field label="Tytuł i autor podręcznika">
                        <input
                          type="text"
                          value={item.textbookTitle}
                          onChange={(e) =>
                            updateAssignmentItem(item.id, { textbookTitle: e.target.value })
                          }
                          placeholder="np. Poznaję Boży świat, Wydawnictwo Jedność"
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add new assignment row */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700">
                Dodaj nowy wariant przedmiotu, poziomu i podręcznika
              </p>
              <span className="text-[11px] text-slate-500">
                Możesz dodać wiele wierszy dla tego samego przedmiotu (np. kl. 1, 2, 1-4, 5-8).
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <Field label="Przedmiot">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="np. Religia"
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="md:col-span-3">
                <Field label="Zakres klas">
                  <input
                    type="text"
                    value={newClassScope}
                    onChange={(e) => setNewClassScope(e.target.value)}
                    placeholder="np. 1-4, 5A"
                    className={`${inputClass} font-mono-tabular`}
                  />
                </Field>
              </div>
              <div className="md:col-span-4">
                <Field label="Nr programu">
                  <input
                    type="text"
                    value={newProgramNumber}
                    onChange={(e) => setNewProgramNumber(e.target.value)}
                    placeholder="np. AZ-1-01/18"
                    className={`${inputClass} font-mono-tabular`}
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <Field label="Numer zatwierdzenia podręcznika">
                  <input
                    type="text"
                    value={newTextbookNumber}
                    onChange={(e) => setNewTextbookNumber(e.target.value)}
                    placeholder="np. AZ-11-01/18-20"
                    className={`${inputClass} font-mono-tabular`}
                  />
                </Field>
              </div>
              <div className="md:col-span-6">
                <Field label="Tytuł i autor podręcznika">
                  <input
                    type="text"
                    value={newTextbookTitle}
                    onChange={(e) => setNewTextbookTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAssignment();
                      }
                    }}
                    placeholder="Tytuł i wydawnictwo / autor"
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={addAssignment}
                  disabled={!newSubject.trim()}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-900 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dodaj</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Check, Plus, RefreshCw, X } from 'lucide-react';
import { SemesterType, TeacherProfile } from '../types/reports';
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
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [syncConfirmed, setSyncConfirmed] = useState(false);

  const update = (patch: Partial<TeacherProfile>) => {
    onChange({ ...profile, ...patch });
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

  const addSubject = () => {
    const val = newSubjectInput.trim();
    if (!val || profile.subjectsList.includes(val)) return;
    update({ subjectsList: [...profile.subjectsList, val] });
    setNewSubjectInput('');
  };

  const removeSubject = (subj: string) => {
    update({ subjectsList: profile.subjectsList.filter((s) => s !== subj) });
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
            Dane wpisane poniżej podstawiają się automatycznie do każdego nowo tworzonego formularza.
          </p>
        </div>

        {documentsCount > 0 && (
          <button
            type="button"
            onClick={handleSync}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-900 bg-white px-4 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {syncConfirmed ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Zaktualizowano karty ({documentsCount})</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Zastosuj do istniejących kart ({documentsCount})</span>
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

            <Field label="Rok szkolny">
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
            title="Słownik Twoich klas i przedmiotów"
            subtitle="Ułatwia szybkie podpowiadanie podczas tworzenia wielu kart w jednej sesji"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Classes */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-700">
                Nauczane klasy / oddziały
              </label>
              <div className="flex gap-2">
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
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dodaj</span>
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

            {/* Subjects */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-700">
                Prowadzone przedmioty / zajęcia
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSubject();
                    }
                  }}
                  placeholder="np. Informatyka"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addSubject}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dodaj</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.subjectsList.map((subj) => (
                  <span
                    key={subj}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800"
                  >
                    <span>{subj}</span>
                    <button
                      type="button"
                      onClick={() => removeSubject(subj)}
                      className="text-slate-400 hover:text-red-700 cursor-pointer"
                      aria-label={`Usuń przedmiot ${subj}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

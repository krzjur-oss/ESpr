import React from 'react';
import {
  ClassificationPeriod,
  TeacherProfile,
  UzasadnienieNieklasyfikowaniaDoc,
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
  doc: UzasadnienieNieklasyfikowaniaDoc;
  profile: TeacherProfile;
  availableYears?: string[];
  onChange: (updated: UzasadnienieNieklasyfikowaniaDoc) => void;
  onToggleLock?: () => void;
  onRequestReset: () => void;
}

export const UzasadnienieNieklasyfikowaniaForm: React.FC<Props> = ({
  doc,
  profile,
  availableYears = [],
  onChange,
  onToggleLock,
  onRequestReset,
}) => {
  const update = (patch: Partial<UzasadnienieNieklasyfikowaniaDoc>) => {
    if (doc.isLocked) return;
    const next: UzasadnienieNieklasyfikowaniaDoc = {
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
        next.classificationPeriod === 'roczne' ? 'roczne' : 'I półrocze';
      const student = next.studentName.trim();
      const subj = next.subject.trim();
      const cls = next.className.trim();
      const detail = student
        ? `${student}${cls ? ` (${cls})` : ''}`
        : [subj || 'Przedmiot', cls ? `kl. ${cls}` : ''].filter(Boolean).join(' · ');
      next.title = `Uzasadnienie NKL (${periodLabel}) · ${detail}`;
    }
    onChange(next);
  };

  const isAnnual = doc.classificationPeriod === 'roczne';

  return (
    <div className="space-y-8">
      <FormTopBar
        docTitle={doc.title || 'Uzasadnienie nieklasyfikowania ucznia'}
        metaText={`Załącznik NKL · ${isAnnual ? 'Klasyfikacja roczna' : 'Za I półrocze'} · Rok szkolny ${doc.schoolYear || '—'}`}
        updatedAt={doc.updatedAt}
        isLocked={Boolean(doc.isLocked)}
        onToggleLock={onToggleLock}
        onResetDoc={onRequestReset}
      />

      <fieldset
        disabled={Boolean(doc.isLocked)}
        className="space-y-8 min-w-0 border-0 p-0 m-0 [&:disabled_button]:cursor-not-allowed [&:disabled_button]:opacity-60 [&:disabled_label]:cursor-not-allowed [&:disabled_select]:cursor-not-allowed [&:disabled_select]:bg-slate-50"
      >
      {/* 01. Dane podstawowe i okres klasyfikacji */}
      <section>
        <SectionHeader
          index="01"
          title="Dane identyfikacyjne ucznia i załącznika"
          subtitle="Informacje nagłówkowe zgodne z oficjalnym wzorem uzasadnienia nieklasyfikowania"
        />

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Rodzaj klasyfikacji">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                {(
                  [
                    { id: 'srodroczne', label: 'Za I półrocze' },
                    { id: 'roczne', label: 'Roczne (rok szkolny)' },
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
                placeholder="np. Kowalski Jan"
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

            <div className="md:col-span-2">
              <Field label="Nazwa szkoły / placówki (opcjonalnie na potrzeby archiwum)">
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
        </div>
      </section>

      {/* 02. Frekwencja i uzasadnienie */}
      <section>
        <SectionHeader
          index="02"
          title="Podstawa nieklasyfikowania i podpis"
          subtitle="Procent nieobecności ucznia oraz automatycznie sformułowana treść uzasadnienia"
        />

        <div className="space-y-4">
          <div className="max-w-xs">
            <Field
              label="Procent nieobecności ucznia na zajęciach (%)"
              hint="Wpisz wartość liczbową (np. 56 lub 62,5)"
            >
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={doc.absencePercent}
                  onChange={(e) => update({ absencePercent: e.target.value })}
                  placeholder="np. 58"
                  className={`${inputClass} pr-8 font-mono-tabular`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                  %
                </span>
              </div>
            </Field>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs text-slate-700 leading-relaxed">
            <p className="font-semibold text-slate-900">
              Treść oficjalnego uzasadnienia na wydruku:
            </p>
            <p>
              W wyniku klasyfikacji {isAnnual ? 'rocznej' : 'śródrocznej'} uczeń/uczennica nie
              uzyskał/a podstaw do ustalenia {isAnnual ? 'rocznej' : 'śródrocznej'} oceny
              klasyfikacyjnej z powodu{' '}
              <strong className="font-mono-tabular text-slate-900">
                {doc.absencePercent.trim() || '..........'} %
              </strong>{' '}
              nieobecności na zajęciach.
            </p>
            <p>
              Pomimo działań podjętych przez nauczyciela uczeń/uczennica nie opanował podstawowych
              umiejętności i wiadomości, które umożliwiałyby uzyskanie pozytywnej oceny{' '}
              {isAnnual
                ? `w roku szkolnym ${doc.schoolYear || '..........'}.`
                : `w I półroczu roku szkolnego ${doc.schoolYear || '..........'}.`}
            </p>
          </div>

          <TemplateTextareaField
            label="Dodatkowe uwagi / opis podjętych działań nauczyciela (opcjonalnie)"
            category="ogolne"
            rows={3}
            value={doc.additionalJustification}
            onChange={(val) => update({ additionalJustification: val })}
            placeholder="Opcjonalnie dopisz informację o kontakcie z rodzicami, wyznaczonych terminach konsultacji itp. (jeśli pole jest puste, wydruk zachowuje wyłącznie standardowy tekst wzoru)..."
          />

          <div className="max-w-xs">
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

import React from 'react';
import {
  NDST_NEXT_SEMESTER_OPTIONS,
  NDST_OBSERVATION_OPTIONS,
  NDST_TEACHER_ACTION_OPTIONS,
} from '../../data/ndstOptions';
import {
  CURRICULUM_STATUS_LABELS,
  EfektyNauczaniaDoc,
  KartaInformacyjnaDoc,
  PodsumowanieSpecjalistyDoc,
  ReportDocument,
  SPECIALIST_ROLE_LABELS,
  UzasadnienieNdstDoc,
  UzasadnienieNieklasyfikowaniaDoc,
  ZbiorczeEfektyDoc,
} from '../../types/reports';

interface PrintDocumentRendererProps {
  doc: ReportDocument;
  isLast?: boolean;
}

const EmptyLine = () => <span className="text-slate-400 italic">Nie uzupełniono</span>;

const DottedFill: React.FC<{ value?: string; minDots?: string }> = ({
  value,
  minDots = '......................',
}) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return <span className="text-slate-500 tracking-wider">{minDots}</span>;
  }
  return <span className="font-medium text-slate-950">{trimmed}</span>;
};

const PrintCheckbox: React.FC<{
  checked: boolean;
  label: string;
  children?: React.ReactNode;
}> = ({ checked, label, children }) => (
  <div className="print-avoid-break flex items-start gap-2 text-[11px] leading-[1.42] text-slate-900">
    <span
      className={`mt-[2.5px] inline-flex h-[11px] w-[11px] shrink-0 items-center justify-center border ${
        checked
          ? 'border-slate-950 bg-slate-100 text-slate-950'
          : 'border-slate-700 bg-white'
      }`}
      aria-hidden="true"
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-current" strokeWidth={2.2}>
          <polyline points="2 6.5 4.8 9.2 10 3" />
        </svg>
      )}
    </span>
    <div className="min-w-0 flex-1">
      <span className={checked ? 'font-medium text-slate-950' : 'text-slate-800'}>{label}</span>
      {children}
    </div>
  </div>
);

const PrintChoiceBadge: React.FC<{ label: string; selected: boolean }> = ({ label, selected }) => (
  <span
    className={
      selected
        ? 'inline-block border border-slate-900 px-1 py-0 text-[10px] font-bold text-slate-950'
        : 'text-[10.5px] text-slate-500'
    }
  >
    {label}
  </span>
);

const PrintSection: React.FC<{
  number?: string;
  title: string;
  children: React.ReactNode;
}> = ({ number, title, children }) => (
  <div className="print-avoid-break mb-3.5">
    <div className="border-b border-slate-300 pb-1 mb-1.5 flex items-baseline gap-1.5">
      {number && <span className="font-mono-tabular text-[11px] font-semibold text-slate-700">{number}</span>}
      <h4 className="text-[11.5px] font-bold uppercase tracking-wide text-slate-900">{title}</h4>
    </div>
    <div className="text-[11.5px] leading-[1.5] text-slate-900 whitespace-pre-line">{children}</div>
  </div>
);

const SignatureFooter: React.FC<{ roleLabel: string; name: string; date: string }> = ({
  roleLabel,
  name,
  date,
}) => (
  <div className="print-avoid-break mt-8 pt-4 border-t border-slate-200 flex items-end justify-between gap-8 text-[11px] text-slate-800">
    <div>
      <p className="text-slate-500">Data sporządzenia:</p>
      <p className="mt-1 font-mono-tabular font-medium text-slate-900">{date || '......................'}</p>
    </div>
    <div className="text-center min-w-[210px]">
      <div className="h-8 border-b border-dotted border-slate-400 mb-1" />
      <p className="text-[10px] text-slate-600">{roleLabel}</p>
      {name && <p className="text-[10.5px] font-medium text-slate-800 mt-0.5">{name}</p>}
    </div>
  </div>
);

const EfektyNauczaniaPrint: React.FC<{ doc: EfektyNauczaniaDoc }> = ({ doc }) => (
  <article className="a4-sheet">
    <header className="border-b-2 border-slate-900 pb-3 mb-4">
      <div className="flex items-start justify-between gap-4 text-[10.5px] text-slate-600 mb-1.5">
        <span>{doc.schoolName || 'Nazwa szkoły / placówki'}</span>
        <span className="font-mono-tabular shrink-0">
          Rok szkolny {doc.schoolYear || '—'} · Semestr {doc.semester}
        </span>
      </div>
      <h1 className="font-serif-doc text-lg font-bold text-slate-950 tracking-tight">
        Karta sprawozdania z efektów nauczania
      </h1>
    </header>

    <table className="w-full border border-slate-300 text-[11px] mb-4 print-avoid-break">
      <tbody>
        <tr className="border-b border-slate-300">
          <th className="w-1/4 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300">
            Przedmiot / zajęcia
          </th>
          <td className="w-1/4 px-2.5 py-1.5 border-r border-slate-300 font-medium">
            {doc.subject || '—'}
          </td>
          <th className="w-1/5 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300">
            Klasa
          </th>
          <td className="px-2.5 py-1.5 font-medium">{doc.className || '—'}</td>
        </tr>
        <tr className="border-b border-slate-300">
          <th className="bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300">
            Nauczyciel
          </th>
          <td className="px-2.5 py-1.5 border-r border-slate-300">{doc.teacherName || '—'}</td>
          <th className="bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300">
            Nr programu
          </th>
          <td className="px-2.5 py-1.5 font-mono-tabular">{doc.programNumber || '—'}</td>
        </tr>
        <tr>
          <th className="bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300">
            Podręcznik
          </th>
          <td className="px-2.5 py-1.5 border-r border-slate-300">
            {doc.textbookTitle || '—'}
          </td>
          <th className="bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300">
            Nr podręcznika
          </th>
          <td className="px-2.5 py-1.5 font-mono-tabular">
            {doc.textbookNumber || '—'}
          </td>
        </tr>
      </tbody>
    </table>

    <PrintSection number="1." title="Stopień realizacji podstawy programowej">
      <p className="font-semibold text-slate-900">
        Stan realizacji: {CURRICULUM_STATUS_LABELS[doc.curriculumStatus]}
      </p>
      {doc.curriculumStatus !== 'na_biezaco' && doc.curriculumScope && (
        <p className="mt-1">
          <span className="font-medium">Zakres:</span> {doc.curriculumScope}
        </p>
      )}
      {doc.curriculumNotes && (
        <p className="mt-1">
          <span className="font-medium">Uwagi:</span> {doc.curriculumNotes}
        </p>
      )}
    </PrintSection>

    <PrintSection number="2." title="Analiza wyników klasyfikacji (oceny niedostateczne i celujące)">
      <div className="grid grid-cols-2 gap-4 border border-slate-300 bg-slate-50/50 px-3 py-2 mb-1.5">
        <div>
          Liczba ocen niedostatecznych:{' '}
          <strong className="font-mono-tabular">{doc.failingGradesCount || '0'}</strong>
        </div>
        <div>
          Liczba ocen celujących:{' '}
          <strong className="font-mono-tabular">{doc.excellentGradesCount || '0'}</strong>
        </div>
      </div>
      {doc.gradesNotes ? <p>{doc.gradesNotes}</p> : null}
    </PrintSection>

    <PrintSection number="3." title="Podsumowanie efektów zindywidualizowanej ścieżki kształcenia">
      {doc.individualPathNotApplicable ? (
        <p>Nie dotyczy.</p>
      ) : doc.individualPathSummary ? (
        doc.individualPathSummary
      ) : (
        <EmptyLine />
      )}
    </PrintSection>

    <PrintSection number="4." title="Udział w konkursach, zawodach międzyszkolnych i sukcesy">
      {doc.competitionsNone ? (
        <p>Brak udziału w konkursach w bieżącym okresie.</p>
      ) : doc.competitionsDetails ? (
        doc.competitionsDetails
      ) : (
        <EmptyLine />
      )}
    </PrintSection>

    <PrintSection number="5." title="Wyjazdy edukacyjne w ramach realizacji podstawy programowej">
      {doc.educationalTrips ? doc.educationalTrips : <EmptyLine />}
    </PrintSection>

    <PrintSection number="6." title="Realizacja programu wychowawczo-profilaktycznego">
      {doc.preventiveProgram ? doc.preventiveProgram : <EmptyLine />}
    </PrintSection>

    <PrintSection number="7." title="Stopień realizacji wniosków z poprzedniego roku szkolnego">
      {doc.previousConclusionsStatus ? doc.previousConclusionsStatus : <EmptyLine />}
    </PrintSection>

    <PrintSection number="8." title="Wnioski do dalszej pracy">
      {doc.futureConclusions ? doc.futureConclusions : <EmptyLine />}
    </PrintSection>

    <SignatureFooter
      roleLabel="Podpis nauczyciela"
      name={doc.teacherName}
      date={doc.signatureDate}
    />
  </article>
);

const ZbiorczeEfektyPrint: React.FC<{ doc: ZbiorczeEfektyDoc }> = ({ doc }) => (
  <article className="a4-sheet">
    <header className="border-b-2 border-slate-900 pb-3 mb-4">
      <div className="flex items-start justify-between gap-4 text-[10.5px] text-slate-600 mb-1.5">
        <span>{doc.schoolName || 'Nazwa szkoły / placówki'}</span>
        <span className="font-mono-tabular shrink-0">
          Rok szkolny {doc.schoolYear || '—'} · Semestr {doc.semester}
        </span>
      </div>
      <h1 className="font-serif-doc text-lg font-bold text-slate-950 tracking-tight">
        Karta zbiorczego sprawozdania z efektów nauczania
      </h1>
      <p className="mt-1 text-[11px] text-slate-700">
        {doc.mode === 'wczesnoszkolna'
          ? 'Zespół edukacji wczesnoszkolnej (klasy I–III)'
          : `Zespół przedmiotowy: ${doc.subjectOrStage || '—'}`}{' '}
        · Koordynator: <strong className="text-slate-900">{doc.coordinatorName || '—'}</strong>
      </p>
    </header>

    <div className="mb-4 print-avoid-break">
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-900 mb-1.5">
        1. Zestawienie klas i realizacji podstawy programowej
      </h4>
      <table className="w-full border border-slate-300 text-[10.5px]">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300 text-left">
            <th className="px-2 py-1.5 border-r border-slate-300">Klasa</th>
            <th className="px-2 py-1.5 border-r border-slate-300">Nauczyciel</th>
            <th className="px-2 py-1.5 border-r border-slate-300">Podstawa programowa</th>
            <th className="px-2 py-1.5 border-r border-slate-300 text-center">Ndst</th>
            <th className="px-2 py-1.5 border-r border-slate-300 text-center">Cel</th>
            <th className="px-2 py-1.5">Uwagi</th>
          </tr>
        </thead>
        <tbody>
          {doc.rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-200 align-top">
              <td className="px-2 py-1.5 border-r border-slate-300 font-semibold">{r.className || '—'}</td>
              <td className="px-2 py-1.5 border-r border-slate-300">{r.teacherName || '—'}</td>
              <td className="px-2 py-1.5 border-r border-slate-300">
                {CURRICULUM_STATUS_LABELS[r.curriculumStatus]}
                {r.curriculumDetails ? ` (${r.curriculumDetails})` : ''}
              </td>
              <td className="px-2 py-1.5 border-r border-slate-300 text-center font-mono-tabular">
                {r.failingCount || '0'}
              </td>
              <td className="px-2 py-1.5 border-r border-slate-300 text-center font-mono-tabular">
                {r.excellentCount || '0'}
              </td>
              <td className="px-2 py-1.5">{r.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {doc.mode === 'wczesnoszkolna' && (
      <div className="grid grid-cols-2 gap-4 mb-3.5 print-avoid-break">
        <div className="border border-slate-300 p-2.5">
          <h4 className="text-[10.5px] font-bold uppercase text-slate-900 mb-1">
            Obszary mocne (klasy I–III)
          </h4>
          <p className="text-[11px] whitespace-pre-line">
            {doc.earlyEdStrongAreas || 'Nie uzupełniono'}
          </p>
        </div>
        <div className="border border-slate-300 p-2.5">
          <h4 className="text-[10.5px] font-bold uppercase text-slate-900 mb-1">
            Obszary słabsze / wymagające wsparcia
          </h4>
          <p className="text-[11px] whitespace-pre-line">
            {doc.earlyEdWeakAreas || 'Nie uzupełniono'}
          </p>
        </div>
      </div>
    )}

    <PrintSection number="2." title="Osiągnięcia i udział w konkursach">
      {doc.achievements ? doc.achievements : <EmptyLine />}
    </PrintSection>

    <PrintSection number="3." title="Wyjazdy edukacyjne w ramach realizacji podstawy programowej">
      {doc.educationalTrips ? doc.educationalTrips : <EmptyLine />}
    </PrintSection>

    <PrintSection number="4." title="Realizacja programu wychowawczo-profilaktycznego">
      {doc.preventiveProgram ? doc.preventiveProgram : <EmptyLine />}
    </PrintSection>

    <PrintSection number="5." title="Stopień realizacji wniosków z poprzedniego roku szkolnego">
      {doc.previousConclusionsStatus ? doc.previousConclusionsStatus : <EmptyLine />}
    </PrintSection>

    <PrintSection number="6." title="Wnioski do dalszej pracy">
      {doc.futureConclusions ? doc.futureConclusions : <EmptyLine />}
    </PrintSection>

    <SignatureFooter
      roleLabel="Podpis koordynatora zespołu"
      name={doc.coordinatorName}
      date={doc.signatureDate}
    />
  </article>
);

const KartaInformacyjnaPrint: React.FC<{ doc: KartaInformacyjnaDoc }> = ({ doc }) => (
  <article className="a4-sheet">
    <header className="border-b-2 border-slate-900 pb-3 mb-4">
      <div className="flex items-start justify-between gap-4 text-[10.5px] text-slate-600 mb-1.5">
        <span>{doc.schoolName || 'Nazwa szkoły / placówki'}</span>
        <span className="font-mono-tabular shrink-0">Rok szkolny {doc.schoolYear || '—'}</span>
      </div>
      <h1 className="font-serif-doc text-lg font-bold text-slate-950 tracking-tight">
        Karta informacyjna nauczyciela
      </h1>
      <p className="mt-0.5 text-[11px] text-slate-700">
        Za okres rozliczeniowy:{' '}
        <strong className="font-mono-tabular text-slate-900">{doc.period || '—'}</strong>
      </p>
    </header>

    <table className="w-full border border-slate-300 text-[11px] mb-4 print-avoid-break">
      <tbody>
        <tr className="border-b border-slate-300">
          <th className="w-1/3 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300">
            Imię i nazwisko nauczyciela
          </th>
          <td className="px-2.5 py-1.5 font-medium">{doc.teacherName || '—'}</td>
        </tr>
        <tr className="border-b border-slate-300">
          <th className="bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300">
            Łączna liczba godzin w szkole
          </th>
          <td className="px-2.5 py-1.5 font-mono-tabular">{doc.totalHours || '—'}</td>
        </tr>
        <tr className="border-b border-slate-300">
          <th className="bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300">
            Wychowawstwo klasy
          </th>
          <td className="px-2.5 py-1.5">{doc.homeroomClass || 'Brak'}</td>
        </tr>
        <tr>
          <th className="bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300 align-top">
            Wymiar godzin z przedmiotów / zajęć
          </th>
          <td className="px-2.5 py-1.5">
            {doc.subjectHours.some((s) => s.subject.trim()) ? (
              <ul className="space-y-0.5">
                {doc.subjectHours
                  .filter((s) => s.subject.trim())
                  .map((s) => (
                    <li key={s.id} className="flex justify-between gap-4">
                      <span>{s.subject}</span>
                      <span className="font-mono-tabular font-medium">{s.hours || '—'} godz.</span>
                    </li>
                  ))}
              </ul>
            ) : (
              '—'
            )}
          </td>
        </tr>
      </tbody>
    </table>

    <PrintSection number="1." title="Podnoszenie własnych kwalifikacji">
      <div className="space-y-1.5">
        <p>
          <strong>Studia / kursy kwalifikacyjne:</strong>{' '}
          {doc.qualificationsStudies || 'Brak w okresie rozliczeniowym'}
        </p>
        <p>
          <strong>Kursy doskonalące, warsztaty, szkoleniowe RP:</strong>{' '}
          {doc.qualificationsWorkshops || 'Brak w okresie rozliczeniowym'}
        </p>
        <p>
          <strong>Zebrania metodyczne i zespoły przedmiotowe:</strong>{' '}
          {doc.qualificationsMethodical || '—'}
        </p>
      </div>
    </PrintSection>

    <PrintSection number="2." title="Osiągnięcia uczniów (olimpiady, konkursy, zawody)">
      {doc.studentAchievements ? doc.studentAchievements : <EmptyLine />}
    </PrintSection>

    <PrintSection number="3." title="Organizacja wycieczek szkolnych i wyjazdów (funkcja kierownika)">
      {doc.tripsOrganization ? doc.tripsOrganization : <EmptyLine />}
    </PrintSection>

    <PrintSection number="4." title="Wzbogacenie bazy dydaktycznej i materiałowej szkoły">
      {doc.didacticBaseEnrichment ? doc.didacticBaseEnrichment : <EmptyLine />}
    </PrintSection>

    <PrintSection number="5." title="Zajęcia statutowe">
      {doc.statutoryActivities ? doc.statutoryActivities : <EmptyLine />}
    </PrintSection>

    <div className="print-avoid-break mb-3.5">
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1 mb-1.5">
        6. Realizacja zadań dodatkowych zleconych przez dyrektora
      </h4>
      <table className="w-full border border-slate-300 text-[10.5px]">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300 text-left">
            <th className="w-1/3 px-2 py-1 border-r border-slate-300">Rodzaj zadania</th>
            <th className="w-1/3 px-2 py-1 border-r border-slate-300">Wyniki</th>
            <th className="w-1/3 px-2 py-1">Wnioski</th>
          </tr>
        </thead>
        <tbody>
          {doc.directorTasks.map((t) => (
            <tr key={t.id} className="border-b border-slate-200 align-top">
              <td className="px-2 py-1.5 border-r border-slate-300">{t.taskType || '—'}</td>
              <td className="px-2 py-1.5 border-r border-slate-300 whitespace-pre-line">
                {t.results || '—'}
              </td>
              <td className="px-2 py-1.5 whitespace-pre-line">{t.conclusions || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="print-avoid-break mb-3.5">
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1 mb-1.5">
        7. Zadania podejmowane z inicjatywy nauczyciela
      </h4>
      <table className="w-full border border-slate-300 text-[10.5px]">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300 text-left">
            <th className="w-1/3 px-2 py-1 border-r border-slate-300">Rodzaj zadania</th>
            <th className="w-1/3 px-2 py-1 border-r border-slate-300">Wyniki</th>
            <th className="w-1/3 px-2 py-1">Wnioski</th>
          </tr>
        </thead>
        <tbody>
          {doc.teacherInitiativeTasks.map((t) => (
            <tr key={t.id} className="border-b border-slate-200 align-top">
              <td className="px-2 py-1.5 border-r border-slate-300">{t.taskType || '—'}</td>
              <td className="px-2 py-1.5 border-r border-slate-300 whitespace-pre-line">
                {t.results || '—'}
              </td>
              <td className="px-2 py-1.5 whitespace-pre-line">{t.conclusions || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <SignatureFooter
      roleLabel="Podpis nauczyciela"
      name={doc.teacherName}
      date={doc.signatureDate}
    />
  </article>
);

const PodsumowanieSpecjalistyPrint: React.FC<{ doc: PodsumowanieSpecjalistyDoc }> = ({ doc }) => (
  <article className="a4-sheet">
    <header className="border-b-2 border-slate-900 pb-3 mb-4">
      <div className="flex items-start justify-between gap-4 text-[10.5px] text-slate-600 mb-1.5">
        <span>{doc.schoolName || 'Nazwa szkoły / placówki'}</span>
        <span className="font-mono-tabular shrink-0">
          Rok szkolny {doc.schoolYear || '—'} · Semestr {doc.semester}
        </span>
      </div>
      <h1 className="font-serif-doc text-lg font-bold text-slate-950 tracking-tight">
        Podsumowanie efektów pracy
      </h1>
      <p className="mt-1 text-[11.5px] font-semibold text-slate-800">
        {SPECIALIST_ROLE_LABELS[doc.role]}
      </p>
    </header>

    <table className="w-full border border-slate-300 text-[11px] mb-4 print-avoid-break">
      <tbody>
        <tr className="border-b border-slate-300">
          <th className="w-1/3 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300">
            Imię i nazwisko specjalisty / osoby
          </th>
          <td className="px-2.5 py-1.5 font-medium">{doc.specialistName || '—'}</td>
        </tr>
        {doc.studentInfo && (
          <tr className="border-b border-slate-300">
            <th className="bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300">
              Uczeń / klasa / zakres
            </th>
            <td className="px-2.5 py-1.5">{doc.studentInfo}</td>
          </tr>
        )}
        {doc.plannedTasks && (
          <tr>
            <th className="bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 border-r border-slate-300 align-top">
              Planowane zadania
            </th>
            <td className="px-2.5 py-1.5 whitespace-pre-line">{doc.plannedTasks}</td>
          </tr>
        )}
      </tbody>
    </table>

    <PrintSection number="1." title="Realizacja zadań">
      {doc.tasksRealization ? doc.tasksRealization : <EmptyLine />}
    </PrintSection>

    <PrintSection number="2." title="Efekty podjętych działań">
      {doc.effects ? doc.effects : <EmptyLine />}
    </PrintSection>

    <PrintSection number="3." title="Wnioski">
      {doc.conclusions ? doc.conclusions : <EmptyLine />}
    </PrintSection>

    <PrintSection number="4." title="Realizacja Programu Wychowawczo-Profilaktycznego">
      {doc.preventiveProgram ? doc.preventiveProgram : <EmptyLine />}
    </PrintSection>

    <PrintSection number="5." title="Stopień realizacji wniosków z poprzedniego roku szkolnego">
      {doc.previousConclusionsStatus ? doc.previousConclusionsStatus : <EmptyLine />}
    </PrintSection>

    <PrintSection number="6." title="Wnioski do dalszej pracy">
      {doc.futureConclusions ? doc.futureConclusions : <EmptyLine />}
    </PrintSection>

    <SignatureFooter
      roleLabel="Podpis specjalisty / koordynatora"
      name={doc.specialistName}
      date={doc.signatureDate}
    />
  </article>
);

const UzasadnienieNieklasyfikowaniaPrint: React.FC<{ doc: UzasadnienieNieklasyfikowaniaDoc }> = ({
  doc,
}) => {
  const isAnnual = doc.classificationPeriod === 'roczne';
  const schoolYearText = doc.schoolYear.trim() || '..../....';
  const attachmentText = doc.attachmentNumber.trim() || '....';

  return (
    <article className="a4-sheet font-serif-doc text-slate-950">
      <div className="flex items-start justify-between gap-4 text-[11px] mb-5">
        <span className="text-slate-600 text-[10.5px] font-sans">
          {doc.schoolName?.trim() || ''}
        </span>
        <span className="font-mono-tabular shrink-0 text-[11.5px]">
          Załącznik nr {attachmentText}/{schoolYearText}
        </span>
      </div>

      <header className="text-center mb-8">
        <h1 className="text-[15.5px] font-bold uppercase tracking-wide leading-[1.45] text-slate-950">
          UZASADNIENIE
          <br />
          {isAnnual
            ? `NIEKLASYFIKOWANIA UCZNIA ZA ROK SZKOLNY ${schoolYearText}`
            : 'NIEKLASYFIKOWANIA UCZNIA ZA I PÓŁROCZE'}
          <br />Z PRZEDMIOTU
        </h1>
      </header>

      <div className="space-y-2.5 text-[12px] leading-[1.6] mb-9">
        <p>
          <strong>Nazwisko i imię ucznia:</strong>{' '}
          <DottedFill
            value={doc.studentName}
            minDots="............................................................................."
          />
        </p>
        <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <span>
            <strong>Klasa:</strong>{' '}
            <DottedFill value={doc.className} minDots="............" />
          </span>
          <span>
            <strong>rok szkolny:</strong>{' '}
            <span className="font-mono-tabular">{schoolYearText}</span>
          </span>
          <span className="flex-1 min-w-[180px]">
            <strong>Przedmiot:</strong>{' '}
            <DottedFill value={doc.subject} minDots="........................................" />
          </span>
        </p>
        <p>
          <strong>Nauczyciel prowadzący:</strong>{' '}
          <DottedFill
            value={doc.teacherName}
            minDots="............................................................................."
          />
        </p>
      </div>

      <div className="space-y-4 text-[12px] leading-[1.7] text-justify">
        <p className="indent-7">
          W wyniku klasyfikacji {isAnnual ? 'rocznej' : 'śródrocznej'} uczeń/uczennica nie uzyskał/a
          podstaw do ustalenia {isAnnual ? 'rocznej' : 'śródrocznej'} oceny klasyfikacyjnej z powodu{' '}
          <span className="font-mono-tabular font-semibold">
            {doc.absencePercent.trim() || '..........'}
          </span>{' '}
          % nieobecności na zajęciach.
        </p>
        <p className="indent-7">
          Pomimo działań podjętych przez nauczyciela uczeń/uczennica nie opanował podstawowych
          umiejętności i wiadomości, które umożliwiałyby uzyskanie pozytywnej oceny{' '}
          {isAnnual
            ? `w roku szkolnym ${schoolYearText}.`
            : `w I półroczu roku szkolnego ${schoolYearText}.`}
        </p>
        {doc.additionalJustification.trim() && (
          <p className="indent-7 whitespace-pre-line">{doc.additionalJustification.trim()}</p>
        )}
      </div>

      <div className="print-avoid-break mt-16 flex items-end justify-between gap-8 text-[11px]">
        <div className="text-slate-600">
          {doc.signatureDate.trim() && (
            <p className="font-mono-tabular text-[10.5px] text-slate-800">
              Data: {doc.signatureDate.trim()}
            </p>
          )}
        </div>
        <div className="text-center min-w-[270px]">
          <div className="h-7 border-b border-dotted border-slate-500 mb-1" />
          <p className="text-[10.5px] font-semibold text-slate-900">
            Podpis nauczyciela prowadzącego zajęcia edukacyjne
          </p>
          {doc.teacherName.trim() && (
            <p className="text-[10px] text-slate-600 mt-0.5">{doc.teacherName.trim()}</p>
          )}
        </div>
      </div>
    </article>
  );
};

const UzasadnienieNdstPrint: React.FC<{ doc: UzasadnienieNdstDoc }> = ({ doc }) => {
  const isAnnual = doc.classificationPeriod === 'roczne';
  const schoolYearText = doc.schoolYear.trim() || '..../....';
  const attachmentText = doc.attachmentNumber.trim() || '....';
  const gapLines = doc.curriculumGaps
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const cooperationLines = doc.parentsCooperation
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <article className="a4-sheet font-serif-doc text-slate-950">
      <div className="flex items-start justify-between gap-4 text-[11px] mb-3">
        <span className="text-slate-600 text-[10.5px] font-sans">
          {doc.schoolName?.trim() || ''}
        </span>
        <span className="font-mono-tabular shrink-0 text-[11px]">
          Załącznik nr {attachmentText}/{schoolYearText}
        </span>
      </div>

      <header className="text-center mb-4">
        <h1 className="text-[15px] font-bold uppercase tracking-wide leading-[1.4] text-slate-950">
          UZASADNIENIE
          <br />
          {isAnnual
            ? `OCENY NIEDOSTATECZNEJ ZA ROK SZKOLNY ${schoolYearText}`
            : 'OCENY NIEDOSTATECZNEJ ZA I PÓŁROCZE'}
          <br />Z PRZEDMIOTU
        </h1>
      </header>

      <div className="space-y-1.5 text-[11.5px] leading-[1.5] mb-3.5 print-avoid-break">
        <p>
          <strong>Nazwisko i imię ucznia:</strong>{' '}
          <DottedFill
            value={doc.studentName}
            minDots="............................................................................."
          />
        </p>
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
          <span>
            <strong>Klasa:</strong>{' '}
            <DottedFill value={doc.className} minDots="............" />
          </span>
          <span>
            <strong>rok szkolny:</strong>{' '}
            <span className="font-mono-tabular">{schoolYearText}</span>
          </span>
          <span className="flex-1 min-w-[170px]">
            <strong>Przedmiot:</strong>{' '}
            <DottedFill value={doc.subject} minDots="...................................." />
          </span>
        </p>
        <p>
          <strong>Nauczyciel prowadzący:</strong>{' '}
          <DottedFill
            value={doc.teacherName}
            minDots="............................................................................."
          />
        </p>
      </div>

      <p className="indent-7 text-[11.5px] leading-[1.55] text-justify mb-4 print-avoid-break">
        Uczeń w wyniku klasyfikacji {isAnnual ? 'rocznej' : 'śródrocznej'} uzyskał ocenę
        niedostateczną z zajęć edukacyjnych, ponieważ nie nabył podstawowych wiadomości i
        umiejętności przewidzianych w wymaganiach edukacyjnych na ocenę co najmniej dopuszczającą
        dla klasy <DottedFill value={doc.className} minDots="...................." />,{' '}
        {doc.educationStage || 'drugiego etapu kształcenia'}.
      </p>

      {/* Section 1 */}
      <div className="mb-3.5 print-avoid-break">
        <h2 className="text-[11.5px] font-bold text-slate-950 mb-1.5">
          1. Braki w umiejętnościach i wiedzy ucznia <em className="font-semibold">(z podstawy programowej)</em>:
        </h2>
        {gapLines.length > 0 ? (
          <ul className="list-disc pl-6 space-y-1 text-[11px] leading-[1.45]">
            {gapLines.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        ) : (
          <ul className="list-disc pl-6 space-y-1 text-[11px] text-slate-500">
            {Array.from({ length: 5 }).map((_, idx) => (
              <li key={idx} className="tracking-wider">
                ................................................................................................................
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Section 2 */}
      <div className="mb-3.5">
        <h2 className="text-[11.5px] font-bold text-slate-950 mb-1.5 print-avoid-break">
          2. Obserwacja pracy i zaangażowania ucznia w trakcie zajęć <em className="font-semibold">(do wyboru)</em>:
        </h2>
        <div className="space-y-1 pl-1">
          {NDST_OBSERVATION_OPTIONS.map((opt) => (
            <PrintCheckbox
              key={opt.key}
              checked={doc.observations.includes(opt.key)}
              label={opt.label}
            />
          ))}
        </div>
      </div>

      {/* Section 3 */}
      <div className="mb-3.5">
        <h2 className="text-[11.5px] font-bold text-slate-950 mb-1.5 print-avoid-break">
          3. Działania podjęte przez nauczyciela <em className="font-semibold">(do wyboru)</em>:
        </h2>
        <div className="space-y-1.5 pl-1">
          {NDST_TEACHER_ACTION_OPTIONS.map((opt) => {
            const checked = doc.teacherActions.includes(opt.key);
            if (opt.key === 'przedstawienie_harmonogramu_poprawy') {
              return (
                <PrintCheckbox
                  key={opt.key}
                  checked={checked}
                  label={`${opt.label}, kiedy? `}
                >
                  <DottedFill value={doc.improvementScheduleWhen} minDots="....................." />
                  {', w jakiej formie? '}
                  <DottedFill value={doc.improvementScheduleForm} minDots="................................." />
                </PrintCheckbox>
              );
            }
            if (opt.key === 'dodatkowe_zadania') {
              return (
                <PrintCheckbox
                  key={opt.key}
                  checked={checked}
                  label={`${opt.label}, proszę podać przykłady: `}
                >
                  <DottedFill value={doc.additionalTasksExamples} minDots="........................................" />
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10.5px]">
                    <span>czy uczeń wywiązywał się z zadań?</span>
                    <PrintChoiceBadge label="TAK" selected={doc.additionalTasksCompleted === 'TAK'} />
                    <span>/</span>
                    <PrintChoiceBadge label="NIE" selected={doc.additionalTasksCompleted === 'NIE'} />
                  </div>
                </PrintCheckbox>
              );
            }
            if (opt.key === 'skierowanie_na_zajecia_dodatkowe') {
              return (
                <PrintCheckbox key={opt.key} checked={checked} label={opt.label}>
                  <div className="mt-0.5 space-y-0.5 text-[10.5px]">
                    <div>
                      pozalekcyjne, jakie?{' '}
                      <DottedFill value={doc.remedialClassesWhat} minDots="..........................................." />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span>czy uczeń uczestniczył w zajęciach?</span>
                      <PrintChoiceBadge label="TAK" selected={doc.remedialClassesAttended === 'TAK'} />
                      <span>,</span>
                      <PrintChoiceBadge label="NIE" selected={doc.remedialClassesAttended === 'NIE'} />
                      <span>,</span>
                      <PrintChoiceBadge label="RZADKO" selected={doc.remedialClassesAttended === 'RZADKO'} />
                    </div>
                    <div>
                      jeżeli nie, to dlaczego:{' '}
                      <DottedFill
                        value={doc.remedialClassesNotAttendedReason}
                        minDots="..............................................."
                      />
                    </div>
                  </div>
                </PrintCheckbox>
              );
            }
            if (opt.key === 'powiadomienie_rodzicow') {
              return (
                <PrintCheckbox key={opt.key} checked={checked} label={`${opt.label}, kiedy? `}>
                  <DottedFill value={doc.parentsNotifiedDate} minDots="..............." /> (data)
                </PrintCheckbox>
              );
            }
            if (opt.key === 'poinstruowanie_rodzicow') {
              return (
                <PrintCheckbox key={opt.key} checked={checked} label={`${opt.label}, kiedy? `}>
                  <DottedFill value={doc.parentsInstructedDate} minDots="..............." />
                </PrintCheckbox>
              );
            }
            if (opt.key === 'powiadomienie_pedagoga') {
              return (
                <PrintCheckbox key={opt.key} checked={checked} label={`${opt.label}, kiedy? `}>
                  <DottedFill value={doc.pedagogueNotifiedDate} minDots="................................." />
                </PrintCheckbox>
              );
            }
            if (opt.key === 'inne_dzialania') {
              return (
                <PrintCheckbox key={opt.key} checked={checked} label={`${opt.label}: `}>
                  <DottedFill
                    value={doc.otherTeacherActionsText}
                    minDots="....................................................................................."
                  />
                </PrintCheckbox>
              );
            }
            return <PrintCheckbox key={opt.key} checked={checked} label={opt.label} />;
          })}
        </div>
      </div>

      {/* Section 4 */}
      <div className="mb-3.5 print-avoid-break">
        <h2 className="text-[11.5px] font-bold text-slate-950 mb-1.5">
          4. Współpraca z rodzicami/prawnymi opiekunami:
        </h2>
        {cooperationLines.length > 0 ? (
          <div className="text-[11px] leading-[1.5] whitespace-pre-line pl-1">
            {doc.parentsCooperation.trim()}
          </div>
        ) : (
          <div className="space-y-1.5 text-[11px] text-slate-500 pl-1">
            {Array.from({ length: 4 }).map((_, idx) => (
              <p key={idx} className="tracking-wider">
                ....................................................................................................................
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Section 5 */}
      <div className="mb-4 print-avoid-break">
        <h2 className="text-[11.5px] font-bold text-slate-950 mb-1.5">
          5. Działania, które zostaną podjęte przez nauczyciela wobec ucznia w następnym semestrze celem wyeliminowania trudności dydaktycznych ucznia <em className="font-semibold">(do wyboru)</em>:
        </h2>
        <div className="space-y-1 pl-1">
          {NDST_NEXT_SEMESTER_OPTIONS.map((opt) => {
            const checked = doc.nextSemesterActions.includes(opt.key);
            if (opt.key === 'inne_nastepny_semestr') {
              return (
                <PrintCheckbox key={opt.key} checked={checked} label={`${opt.label}: `}>
                  <DottedFill
                    value={doc.nextSemesterOtherText}
                    minDots="....................................................................................."
                  />
                </PrintCheckbox>
              );
            }
            return <PrintCheckbox key={opt.key} checked={checked} label={opt.label} />;
          })}
        </div>
      </div>

      <p className="indent-7 text-[11.5px] leading-[1.55] text-justify print-avoid-break">
        Pomimo działań podjętych przez nauczyciela uczeń nie opanował podstawowych umiejętności i
        wiadomości, które umożliwiałyby uzyskanie pozytywnej oceny{' '}
        {isAnnual
          ? `w roku szkolnym ${schoolYearText}.`
          : `w I półroczu roku szkolnego ${schoolYearText}.`}
      </p>

      <div className="print-avoid-break mt-10 flex items-end justify-between gap-8 text-[11px]">
        <div className="text-slate-600">
          {doc.signatureDate.trim() && (
            <p className="font-mono-tabular text-[10.5px] text-slate-800">
              Data: {doc.signatureDate.trim()}
            </p>
          )}
        </div>
        <div className="text-center min-w-[270px]">
          <div className="h-7 border-b border-dotted border-slate-500 mb-1" />
          <p className="text-[10.5px] font-semibold text-slate-900">
            Podpis nauczyciela prowadzącego zajęcia edukacyjne
          </p>
          {doc.teacherName.trim() && (
            <p className="text-[10px] text-slate-600 mt-0.5">{doc.teacherName.trim()}</p>
          )}
        </div>
      </div>
    </article>
  );
};

export const PrintDocumentRenderer: React.FC<PrintDocumentRendererProps> = ({
  doc,
  isLast = true,
}) => {
  return (
    <div className={isLast ? '' : 'print-page-break mb-8 print:mb-0'}>
      {doc.type === 'efekty_nauczania' && <EfektyNauczaniaPrint doc={doc} />}
      {doc.type === 'zbiorcze_efekty' && <ZbiorczeEfektyPrint doc={doc} />}
      {doc.type === 'karta_informacyjna' && <KartaInformacyjnaPrint doc={doc} />}
      {doc.type === 'podsumowanie_specjalisty' && <PodsumowanieSpecjalistyPrint doc={doc} />}
      {doc.type === 'uzasadnienie_nieklasyfikowania' && (
        <UzasadnienieNieklasyfikowaniaPrint doc={doc} />
      )}
      {doc.type === 'uzasadnienie_ndst' && <UzasadnienieNdstPrint doc={doc} />}
    </div>
  );
};

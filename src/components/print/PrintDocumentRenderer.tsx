import React from 'react';
import {
  CURRICULUM_STATUS_LABELS,
  EfektyNauczaniaDoc,
  KartaInformacyjnaDoc,
  PodsumowanieSpecjalistyDoc,
  ReportDocument,
  SPECIALIST_ROLE_LABELS,
  ZbiorczeEfektyDoc,
} from '../../types/reports';

interface PrintDocumentRendererProps {
  doc: ReportDocument;
  isLast?: boolean;
}

const EmptyLine = () => <span className="text-slate-400 italic">Nie uzupełniono</span>;

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
          <td colSpan={3} className="px-2.5 py-1.5">
            {doc.textbookTitle || '—'}
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
    </div>
  );
};

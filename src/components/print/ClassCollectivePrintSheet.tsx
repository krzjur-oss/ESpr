import React from 'react';
import { CURRICULUM_STATUS_LABELS } from '../../types/reports';
import { ClassCollectiveReport } from '../../utils/supervision';

interface ClassCollectivePrintSheetProps {
  report: ClassCollectiveReport;
  isLast?: boolean;
}

export const ClassCollectivePrintSheet: React.FC<ClassCollectivePrintSheetProps> = ({
  report,
  isLast = true,
}) => {
  const semesterLabel =
    report.semesterFilter === 'all'
      ? 'Cały rok (Semestr I i II)'
      : `Semestr ${report.semesterFilter}`;

  const individualPaths = report.subjectRows
    .filter((r) => r.individualPathSummary)
    .map((r) => `${r.subject} (${r.teacherName}): ${r.individualPathSummary}`);

  const competitions = report.subjectRows
    .filter((r) => r.competitionsDetails)
    .map((r) => `${r.subject} (${r.teacherName}): ${r.competitionsDetails}`);

  const trips = report.subjectRows
    .filter((r) => r.educationalTrips)
    .map((r) => `${r.subject} (${r.teacherName}): ${r.educationalTrips}`);

  const preventivePrograms = report.subjectRows
    .filter((r) => r.preventiveProgram)
    .map((r) => `${r.subject} (${r.teacherName}): ${r.preventiveProgram}`);

  const teacherConclusions = report.subjectRows
    .filter((r) => r.futureConclusions)
    .map((r) => ({
      subject: r.subject,
      teacherName: r.teacherName,
      semester: r.semester,
      text: r.futureConclusions,
    }));

  const homeroomTeachers = report.contributingTeachers
    .filter((t) => t.isHomeroom)
    .map((t) => t.teacherName);

  const todayFormatted = new Date().toLocaleDateString('pl-PL');

  return (
    <div className={isLast ? '' : 'print-page-break mb-8 print:mb-0'}>
      <article className="a4-sheet">
        <header className="border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-start justify-between gap-4 text-[10.5px] text-slate-600 mb-1.5">
            <span>{report.schoolName || 'Nazwa szkoły / placówki'}</span>
            <span className="font-mono-tabular shrink-0">
              Rok szkolny {report.schoolYear || 'wszystkie lata'} · {semesterLabel}
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            ZBIORCZE SPRAWOZDANIE KLASY — NADZÓR DYREKTORA
          </p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="font-serif-doc text-xl font-bold text-slate-950 tracking-tight">
              Klasa {report.className}
            </h1>
            <p className="text-[10.5px] text-slate-700">
              Wychowawca:{' '}
              <strong className="text-slate-950">
                {homeroomTeachers.length > 0 ? homeroomTeachers.join(', ') : 'Brak karty wychowawcy'}
              </strong>
            </p>
          </div>
        </header>

        {/* Summary metrics table */}
        <table className="w-full border border-slate-300 text-[10.5px] mb-4 print-avoid-break">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-center text-slate-700">
              <th className="px-2 py-1 border-r border-slate-300">Karty przedmiotów</th>
              <th className="px-2 py-1 border-r border-slate-300">Nauczyciele</th>
              <th className="px-2 py-1 border-r border-slate-300">Oceny ndst</th>
              <th className="px-2 py-1 border-r border-slate-300">Oceny cel.</th>
              <th className="px-2 py-1 border-r border-slate-300">Opóźnienia podstawy</th>
              <th className="px-2 py-1">Wnioski NKL / NDST</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center font-mono-tabular font-bold text-[12px] text-slate-950">
              <td className="px-2 py-1.5 border-r border-slate-300">
                {report.totals.subjectsCount}
              </td>
              <td className="px-2 py-1.5 border-r border-slate-300">
                {report.totals.teachersCount}
              </td>
              <td className="px-2 py-1.5 border-r border-slate-300">
                {report.totals.totalFailingGrades}
              </td>
              <td className="px-2 py-1.5 border-r border-slate-300">
                {report.totals.totalExcellentGrades}
              </td>
              <td className="px-2 py-1.5 border-r border-slate-300">
                {report.totals.delayedSubjectsCount}
              </td>
              <td className="px-2 py-1.5">
                {report.totals.nklCount} / {report.totals.ndstCount}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 1: Subjects table */}
        <div className="mb-4">
          <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1 mb-1.5 print-avoid-break">
            1. Zestawienie przedmiotów i realizacji podstawy programowej
          </h4>
          {report.subjectRows.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">
              Brak zaimportowanych kart efektów nauczania dla tej klasy.
            </p>
          ) : (
            <table className="w-full border border-slate-300 text-[10px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-left">
                  <th className="px-2 py-1 border-r border-slate-300">Przedmiot</th>
                  <th className="px-2 py-1 border-r border-slate-300">Nauczyciel</th>
                  <th className="px-2 py-1 border-r border-slate-300">Program i podręcznik</th>
                  <th className="px-2 py-1 border-r border-slate-300">Realizacja podstawy</th>
                  <th className="px-1.5 py-1 border-r border-slate-300 text-center">Ndst</th>
                  <th className="px-1.5 py-1 text-center">Cel</th>
                </tr>
              </thead>
              <tbody>
                {report.subjectRows.map((row) => (
                  <tr key={row.docId} className="border-b border-slate-200 align-top">
                    <td className="px-2 py-1.5 border-r border-slate-300 font-semibold">
                      {row.subject}
                      <div className="text-[9.5px] font-normal text-slate-500">
                        Sem. {row.semester}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-300">{row.teacherName}</td>
                    <td className="px-2 py-1.5 border-r border-slate-300">
                      {row.programNumber && (
                        <div className="font-mono-tabular">Prog.: {row.programNumber}</div>
                      )}
                      {row.textbookTitle && <div>{row.textbookTitle}</div>}
                      {row.textbookNumber && (
                        <div className="font-mono-tabular text-slate-600">
                          Nr dop.: {row.textbookNumber}
                        </div>
                      )}
                      {!row.programNumber && !row.textbookTitle && !row.textbookNumber && '—'}
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-300">
                      <span className="font-medium">
                        {CURRICULUM_STATUS_LABELS[row.curriculumStatus]}
                      </span>
                      {row.curriculumStatus !== 'na_biezaco' && row.curriculumScope && (
                        <div className="text-slate-700 mt-0.5">Zakres: {row.curriculumScope}</div>
                      )}
                      {row.curriculumNotes && (
                        <div className="text-slate-600 mt-0.5">{row.curriculumNotes}</div>
                      )}
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-slate-300 text-center font-mono-tabular font-semibold">
                      {row.failingGradesCount}
                    </td>
                    <td className="px-1.5 py-1.5 text-center font-mono-tabular font-semibold">
                      {row.excellentGradesCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 2: NKL & NDST */}
        {(report.nklEntries.length > 0 || report.ndstEntries.length > 0) && (
          <div className="mb-4 print-avoid-break">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1 mb-1.5">
              2. Powiązane uzasadnienia nieklasyfikowania (NKL) i ocen niedostatecznych (NDST)
            </h4>
            <table className="w-full border border-slate-300 text-[10px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-left">
                  <th className="px-2 py-1 border-r border-slate-300 w-16">Typ</th>
                  <th className="px-2 py-1 border-r border-slate-300">Uczeń</th>
                  <th className="px-2 py-1 border-r border-slate-300">Przedmiot / nauczyciel</th>
                  <th className="px-2 py-1">Szczegóły i załącznik</th>
                </tr>
              </thead>
              <tbody>
                {report.nklEntries.map((entry) => (
                  <tr key={entry.docId} className="border-b border-slate-200 align-top">
                    <td className="px-2 py-1.5 border-r border-slate-300 font-bold">
                      NKL
                      <div className="font-normal text-[9px] text-slate-600">
                        {entry.classificationPeriod === 'roczne' ? 'Roczne' : 'Śródr.'}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-300 font-medium">
                      {entry.studentName}
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-300">
                      <div>{entry.subject}</div>
                      <div className="text-slate-600">{entry.teacherName}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div>
                        Nieobecność:{' '}
                        <strong className="font-mono-tabular">
                          {entry.absencePercent || '—'}%
                        </strong>
                        {entry.attachmentNumber ? ` · Zał. nr ${entry.attachmentNumber}` : ''}
                      </div>
                      {entry.additionalJustification && (
                        <div className="text-slate-700 mt-0.5">{entry.additionalJustification}</div>
                      )}
                    </td>
                  </tr>
                ))}
                {report.ndstEntries.map((entry) => (
                  <tr key={entry.docId} className="border-b border-slate-200 align-top">
                    <td className="px-2 py-1.5 border-r border-slate-300 font-bold">
                      NDST
                      <div className="font-normal text-[9px] text-slate-600">
                        {entry.classificationPeriod === 'roczne' ? 'Roczne' : 'Śródr.'}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-300 font-medium">
                      {entry.studentName}
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-300">
                      <div>{entry.subject}</div>
                      <div className="text-slate-600">{entry.teacherName}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div>
                        Obserwacje: {entry.observationsCount} · Działania: {entry.teacherActionsCount}
                        {entry.attachmentNumber ? ` · Zał. nr ${entry.attachmentNumber}` : ''}
                      </div>
                      {entry.curriculumGaps && (
                        <div className="text-slate-700 mt-0.5">Braki: {entry.curriculumGaps}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 3: Homeroom & class-level activities */}
        <div className="mb-4 print-avoid-break">
          <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1 mb-1.5">
            3. Wychowawstwo klasy, konkursy, wycieczki i ścieżki indywidualne
          </h4>

          {report.homeroomEntries.length > 0 ? (
            <div className="space-y-2 mb-2.5 text-[10.5px]">
              {report.homeroomEntries.map((h) => (
                <div key={h.docId} className="border border-slate-300 bg-slate-50/50 p-2.5 space-y-1">
                  <p className="font-semibold text-slate-900">
                    Karta informacyjna wychowawcy: {h.teacherName}
                    {h.period ? ` (${h.period})` : ''}
                  </p>
                  {h.studentAchievements && (
                    <p>
                      <strong>Osiągnięcia uczniów:</strong> {h.studentAchievements}
                    </p>
                  )}
                  {h.tripsOrganization && (
                    <p>
                      <strong>Organizacja wycieczek:</strong> {h.tripsOrganization}
                    </p>
                  )}
                  {h.statutoryActivities && (
                    <p>
                      <strong>Zajęcia statutowe:</strong> {h.statutoryActivities}
                    </p>
                  )}
                  {h.directorTasksSummary.length > 0 && (
                    <p>
                      <strong>Zadania zlecone przez dyrektora:</strong>{' '}
                      {h.directorTasksSummary.join('; ')}
                    </p>
                  )}
                  {h.teacherInitiativeSummary.length > 0 && (
                    <p>
                      <strong>Inicjatywy własne:</strong> {h.teacherInitiativeSummary.join('; ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10.5px] text-slate-500 italic mb-2">
              Brak karty informacyjnej z przypisanym wychowawstwem klasy {report.className}.
            </p>
          )}

          <div className="space-y-1.5 text-[10.5px] leading-[1.45]">
            {individualPaths.length > 0 && (
              <div>
                <strong>Zindywidualizowane ścieżki kształcenia:</strong>
                <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                  {individualPaths.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {competitions.length > 0 && (
              <div>
                <strong>Udział w konkursach i sukcesy:</strong>
                <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                  {competitions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {trips.length > 0 && (
              <div>
                <strong>Wyjazdy edukacyjne z przedmiotów:</strong>
                <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                  {trips.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {preventivePrograms.length > 0 && (
              <div>
                <strong>Program wychowawczo-profilaktyczny:</strong>
                <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                  {preventivePrograms.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Conclusions & Director notes */}
        <div className="mb-4 print-avoid-break">
          <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1 mb-1.5">
            4. Zbiorcze wnioski nauczycieli oraz uwagi pokontrolne dyrektora
          </h4>

          {teacherConclusions.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1 text-[10.5px] leading-[1.45] mb-3">
              {teacherConclusions.map((c, idx) => (
                <li key={idx}>
                  <strong>
                    {c.subject} ({c.teacherName}, Sem. {c.semester}):
                  </strong>{' '}
                  {c.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[10.5px] text-slate-500 italic mb-3">
              Nauczyciele nie wpisali wniosków do dalszej pracy w kartach tej klasy.
            </p>
          )}

          <div className="border border-slate-300 bg-slate-50/40 p-2.5 text-[10.5px]">
            <p className="font-bold text-slate-900 mb-1">Uwagi i zalecenia dyrektora:</p>
            {report.directorNotes.trim() ? (
              <p className="whitespace-pre-line text-slate-900">{report.directorNotes.trim()}</p>
            ) : (
              <p className="text-slate-400 italic">Brak dodatkowych uwag dyrektora.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="print-avoid-break mt-6 pt-3 border-t border-slate-200 flex items-end justify-between gap-8 text-[10.5px] text-slate-800">
          <div>
            <p className="text-slate-500">Data zestawienia:</p>
            <p className="mt-1 font-mono-tabular font-medium text-slate-900">{todayFormatted}</p>
            <p className="mt-1 text-[9.5px] text-slate-500">
              Źródła danych: {report.contributingTeachers.length}{' '}
              {report.contributingTeachers.length === 1 ? 'nauczyciel' : 'nauczycieli'}
            </p>
          </div>
          <div className="text-center min-w-[230px]">
            <div className="h-7 border-b border-dotted border-slate-400 mb-1" />
            <p className="text-[10px] text-slate-600">
              Podpis dyrektora / osoby prowadzącej nadzór
            </p>
          </div>
        </div>
      </article>
    </div>
  );
};

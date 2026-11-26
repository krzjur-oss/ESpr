import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClassCollectivePrintSheet } from '../../components/print/ClassCollectivePrintSheet';
import { PrintDocumentRenderer } from '../../components/print/PrintDocumentRenderer';
import { DocumentType } from '../../types/reports';
import {
  aggregateIntoCoordinatorDoc,
  cloneDocumentsForNewSchoolYear,
  createDefaultProfile,
  createDocumentByType,
  duplicateDocument,
  findSubjectAssignment,
  getDefaultSchoolYearInfo,
  getSemesterPeriodTexts,
} from '../documentFactory';
import { triggerJsonDownload } from '../download';
import { validateAndParseSupervisionPackageJson } from '../storage';
import {
  aggregateClassCollectiveReports,
  applySupervisionDiffDecisions,
  buildClassNotesKey,
  buildSupervisionPackagePayload,
  diffSupervisionPackage,
  exportSupervisionPackageAsJson,
} from '../supervision';

const ALL_DOC_TYPES: DocumentType[] = [
  'efekty_nauczania',
  'zbiorcze_efekty',
  'karta_informacyjna',
  'podsumowanie_specjalisty',
  'uzasadnienie_nieklasyfikowania',
  'uzasadnienie_ndst',
];

describe('Group E: Regresja funkcjonalna, pobieranie i wydruki A4', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('wylicza poprawnie rok szkolny i półrocze na granicach miesięcy', () => {
    const aug31 = getDefaultSchoolYearInfo(new Date(2026, 7, 31)); // sierpień
    expect(aug31.schoolYear).toBe('2025/2026');
    expect(aug31.defaultSemester).toBe('II');

    const sep01 = getDefaultSchoolYearInfo(new Date(2026, 8, 1)); // wrzesień
    expect(sep01.schoolYear).toBe('2026/2027');
    expect(sep01.defaultSemester).toBe('I');

    const jan15 = getDefaultSchoolYearInfo(new Date(2027, 0, 15)); // styczeń
    expect(jan15.schoolYear).toBe('2026/2027');
    expect(jan15.defaultSemester).toBe('I');

    const feb02 = getDefaultSchoolYearInfo(new Date(2027, 1, 2)); // luty
    expect(feb02.schoolYear).toBe('2026/2027');
    expect(feb02.defaultSemester).toBe('II');

    const derived = getSemesterPeriodTexts(' 2027 / 2028 ');
    expect(derived.schoolYear).toBe('2027/2028');
    expect(derived.sem1).toBe('01.09.2027 – 31.01.2028');
    expect(derived.sem2).toBe('01.02.2028 – 30.06.2028');

    const fallback = getSemesterPeriodTexts('', new Date(2026, 8, 1));
    expect(fallback.schoolYear).toBe('2026/2027');
    expect(fallback.sem2).toBe('01.02.2027 – 30.06.2027');
  });

  it('tworzy wszystkie typy dokumentów, dopasowuje program i podręcznik do klasy oraz duplikuje niezależnie', () => {
    const profile = createDefaultProfile();
    profile.fullName = 'Katarzyna Zielińska';
    profile.schoolName = 'SP nr 3 w Krakowie';
    profile.classesList = ['4A', '7B'];
    profile.subjectAssignments = [
      {
        id: 'a1',
        subject: 'Matematyka',
        classScope: '4-6',
        programNumber: 'PROG-4-6',
        textbookNumber: '111/2023',
        textbookTitle: 'Matematyka kl. 4-6',
      },
      {
        id: 'a2',
        subject: 'Matematyka',
        classScope: '7B',
        programNumber: 'PROG-7B',
        textbookNumber: '222/2024',
        textbookTitle: 'Matematyka kl. 7B',
      },
    ];

    expect(findSubjectAssignment(profile, 'Matematyka', '5A')?.programNumber).toBe('PROG-4-6');
    expect(findSubjectAssignment(profile, 'Matematyka', '7B')?.programNumber).toBe('PROG-7B');

    const created = ALL_DOC_TYPES.map((type) => createDocumentByType(type, profile));
    expect(created).toHaveLength(6);

    const source = created[0]!;
    const copy = duplicateDocument(source);
    expect(copy.id).not.toBe(source.id);
    expect(copy.title).toContain('(kopia)');
    if (copy.type === 'efekty_nauczania' && source.type === 'efekty_nauczania') {
      copy.className = '8C';
      expect(source.className).toBe('4A');
    }
  });

  it('agreguje karty przedmiotowe do sprawozdania koordynatora i przenosi karty na kolejny rok szkolny', () => {
    const profile = createDefaultProfile();
    profile.fullName = 'Tomasz Wójcik';
    profile.schoolYear = '2026/2027';

    const e1 = createDocumentByType('efekty_nauczania', profile);
    if (e1.type === 'efekty_nauczania') {
      e1.className = '5A';
      e1.failingGradesCount = '2';
      e1.excellentGradesCount = '5';
      e1.futureConclusions = 'Więcej ćwiczeń rachunkowych.';
    }
    const coord = createDocumentByType('zbiorcze_efekty', profile);
    if (coord.type === 'zbiorcze_efekty') {
      const aggregated = aggregateIntoCoordinatorDoc([e1, coord], coord);
      expect(aggregated.rows).toHaveLength(1);
      expect(aggregated.rows[0]?.className).toBe('5A');
      expect(aggregated.rows[0]?.failingCount).toBe('2');
    }

    const rolled = cloneDocumentsForNewSchoolYear(
      [e1],
      {
        targetYear: '2027/2028',
        targetSemester: 'I',
        mode: 'clean_base',
        carryOverConclusions: true,
      },
      profile
    );
    expect(rolled).toHaveLength(1);
    const nextDoc = rolled[0];
    expect(nextDoc?.schoolYear).toBe('2027/2028');
    if (nextDoc?.type === 'efekty_nauczania') {
      expect(nextDoc.failingGradesCount).toBe('0');
      expect(nextDoc.previousConclusionsStatus).toBe('Więcej ćwiczeń rachunkowych.');
      expect(nextDoc.futureConclusions).toBe('');
    }

    const karta = createDocumentByType('karta_informacyjna', profile);
    const rolledKarta = cloneDocumentsForNewSchoolYear(
      [karta],
      {
        targetYear: '2027/2028',
        targetSemester: 'II',
        mode: 'clean_base',
        carryOverConclusions: false,
      },
      profile
    );
    expect(rolledKarta).toHaveLength(1);
    const nextKarta = rolledKarta[0];
    if (nextKarta?.type === 'karta_informacyjna') {
      expect(nextKarta.period).toBe('01.02.2028 – 30.06.2028');
      expect(nextKarta.title).toBe('Karta informacyjna · 01.02.2028 – 30.06.2028');
    }
  });

  it('tworzy paczkę nadzoru, wykrywa różnice wersji i agreguje zbiorcze sprawozdanie klasy', () => {
    const p1 = createDefaultProfile();
    p1.senderId = 'teacher-1';
    p1.fullName = 'Jan Kowalski';
    p1.schoolName = 'SP nr 2';
    p1.homeroomClass = '5A';
    p1.schoolYear = '2026/2027';

    const d1 = createDocumentByType('efekty_nauczania', p1);
    if (d1.type === 'efekty_nauczania') {
      d1.subject = 'Matematyka';
      d1.className = '5A';
      d1.failingGradesCount = '1';
      d1.excellentGradesCount = '4';
    }
    const homeroom = createDocumentByType('karta_informacyjna', p1);
    if (homeroom.type === 'karta_informacyjna') {
      homeroom.homeroomClass = '5A';
      homeroom.studentAchievements = 'Laureat konkursu.';
    }
    const nkl = createDocumentByType('uzasadnienie_nieklasyfikowania', p1);
    if (nkl.type === 'uzasadnienie_nieklasyfikowania') {
      nkl.className = '5A';
      nkl.studentName = 'Uczeń Testowy';
      nkl.subject = 'Matematyka';
      nkl.absencePercent = '58%';
    }

    const payloadV1 = buildSupervisionPackagePayload(p1, [d1, homeroom, nkl], {
      schoolYearFilter: '2026/2027',
      semesterFilter: 'all',
    });
    const parsedV1 = validateAndParseSupervisionPackageJson(JSON.stringify(payloadV1));
    expect(parsedV1.ok).toBe(true);
    if (!parsedV1.ok) return;

    // Druga wersja paczki z poprawioną liczbą ocen celujących
    const d1Updated = { ...d1 };
    if (d1Updated.type === 'efekty_nauczania') {
      d1Updated.excellentGradesCount = '6';
    }
    const payloadV2 = buildSupervisionPackagePayload(p1, [d1Updated, homeroom, nkl], {
      schoolYearFilter: '2026/2027',
      semesterFilter: 'all',
    });
    const parsedV2 = validateAndParseSupervisionPackageJson(JSON.stringify(payloadV2));
    expect(parsedV2.ok).toBe(true);
    if (!parsedV2.ok) return;

    const diff = diffSupervisionPackage(parsedV1.pkg, parsedV2.pkg);
    expect(diff.hasAnyChanges).toBe(true);
    expect(diff.counts.modified).toBe(1);

    const decisions: Record<string, 'incoming' | 'existing'> = {};
    for (const d of diff.documentDiffs) {
      if (d.status !== 'unchanged') decisions[d.key] = 'incoming';
    }
    const mergedPkg = applySupervisionDiffDecisions(diff, decisions);

    const notesKey = buildClassNotesKey('2026/2027', 'all', '5A');
    const collective = aggregateClassCollectiveReports(
      [mergedPkg],
      { [notesKey]: 'Uwagi dyrektora po radzie.' },
      { schoolYear: '2026/2027', semester: 'all' }
    );
    expect(collective).toHaveLength(1);
    const report5A = collective[0]!;
    expect(report5A.className).toBe('5A');
    expect(report5A.totals.totalExcellentGrades).toBe(6);
    expect(report5A.totals.nklCount).toBe(1);
    expect(report5A.homeroomEntries).toHaveLength(1);
    expect(report5A.directorNotes).toBe('Uwagi dyrektora po radzie.');

    // Fallback nazwy szkoły z paczki nauczyciela dla NKL/Karty z pustym polem schoolName
    const pFallback = createDefaultProfile();
    pFallback.senderId = 'teacher-fallback';
    pFallback.fullName = 'Maria Nowak';
    pFallback.schoolName = 'SP nr 7 w Poznaniu';
    pFallback.schoolYear = '2026/2027';

    const nklNoSchool = createDocumentByType('uzasadnienie_nieklasyfikowania', pFallback);
    nklNoSchool.schoolName = '';
    if (nklNoSchool.type === 'uzasadnienie_nieklasyfikowania') {
      nklNoSchool.className = '6B';
      nklNoSchool.studentName = 'Jan B.';
      nklNoSchool.subject = 'Fizyka';
    }
    const pkgFallback = buildSupervisionPackagePayload(pFallback, [nklNoSchool], {
      schoolYearFilter: '2026/2027',
      semesterFilter: 'all',
    });
    const parsedFallback = validateAndParseSupervisionPackageJson(JSON.stringify(pkgFallback));
    expect(parsedFallback.ok).toBe(true);
    if (parsedFallback.ok) {
      const fallbackReports = aggregateClassCollectiveReports([parsedFallback.pkg], {}, {
        schoolYear: '2026/2027',
        semester: 'all',
      });
      expect(fallbackReports).toHaveLength(1);
      expect(fallbackReports[0]?.schoolName).toBe('SP nr 7 w Poznaniu');
    }
  });

  it('opóźnia revokeObjectURL przy bezpiecznym pobieraniu JSON i sprząta element DOM', () => {
    vi.useFakeTimers();

    const origUrl = globalThis.URL;
    const origDocument = globalThis.document;
    const revokeSpy = vi.fn();
    const clickSpy = vi.fn();
    const removeChildSpy = vi.fn();
    const appendSpy = vi.fn();

    Object.defineProperty(globalThis, 'URL', {
      value: {
        createObjectURL: vi.fn(() => 'blob:mock-json'),
        revokeObjectURL: revokeSpy,
      },
      configurable: true,
      writable: true,
    });
    const mockParent = { removeChild: removeChildSpy };
    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: () => ({
          href: '',
          download: '',
          rel: '',
          style: {},
          parentNode: mockParent,
          click: clickSpy,
          remove: vi.fn(),
        }),
        body: { appendChild: appendSpy },
      },
      configurable: true,
      writable: true,
    });

    const ok = triggerJsonDownload({ hello: 'świat' }, 'test.json');
    expect(ok).toBe(true);
    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);
    // Nie wolno zwalniać URL synchronicznie zaraz po kliknięciu
    expect(revokeSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(10_000);
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-json');

    // Eksport paczki nadzoru również zwraca payload przy sukcesie
    const prof = createDefaultProfile();
    const doc = createDocumentByType('efekty_nauczania', prof);
    const exportedPkg = exportSupervisionPackageAsJson(prof, [doc], {
      schoolYearFilter: 'all',
      semesterFilter: 'all',
    });
    expect(exportedPkg).not.toBeNull();

    Object.defineProperty(globalThis, 'URL', {
      value: origUrl,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'document', {
      value: origDocument,
      configurable: true,
      writable: true,
    });
  });

  it('renderuje wydruki A4 wszystkich dokumentów i arkusza zbiorczego z polskimi znakami oraz bezpiecznym escapowaniem HTML', () => {
    const profile = createDefaultProfile();
    profile.fullName = 'Zażółć Gęślą Jaźń <script>alert(1)</script>';
    profile.schoolName = 'Szkoła Podstawowa nr 1 w Łodzi';

    for (const type of ALL_DOC_TYPES) {
      const doc = createDocumentByType(type, profile);
      const html = renderToStaticMarkup(
        React.createElement(PrintDocumentRenderer, { doc, isLast: true })
      );
      expect(html).toContain('Szkoła Podstawowa nr 1 w Łodzi');
      expect(html).toContain('Zażółć Gęślą Jaźń');
      // Skrypty muszą zostać bezpiecznie wyescapowane przez Reacta
      expect(html).not.toContain('<script>alert(1)</script>');
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    }

    const pkg = buildSupervisionPackagePayload(
      profile,
      [createDocumentByType('efekty_nauczania', profile)],
      { schoolYearFilter: 'all', semesterFilter: 'all' }
    );
    const parsedPkg = validateAndParseSupervisionPackageJson(JSON.stringify(pkg));
    expect(parsedPkg.ok).toBe(true);
    if (parsedPkg.ok) {
      const reports = aggregateClassCollectiveReports([parsedPkg.pkg], {}, {
        schoolYear: 'all',
        semester: 'all',
      });
      if (reports[0]) {
        const collectiveHtml = renderToStaticMarkup(
          React.createElement(ClassCollectivePrintSheet, {
            report: reports[0],
            isLast: true,
          })
        );
        expect(collectiveHtml).toContain('ZBIORCZE SPRAWOZDANIE');
        expect(collectiveHtml).toContain('Szkoła Podstawowa nr 1 w Łodzi');
        expect(collectiveHtml).not.toContain('<script>alert(1)</script>');
      }
    }
  });
});

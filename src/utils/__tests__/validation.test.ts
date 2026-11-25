import { describe, expect, it } from 'vitest';
import { DocumentType } from '../../types/reports';
import { createDefaultProfile, createDocumentByType } from '../documentFactory';
import {
  isValidReportDocument,
  sanitizeCustomTemplates,
  sanitizeCustomWnioski,
  sanitizeDocuments,
  sanitizeProfile,
  sanitizeSupervisionClassNotes,
  sanitizeSupervisionPackages,
  validateAndParseImportedJson,
  validateAndParseSharedPhrasesJson,
  validateAndParseSupervisionPackageJson,
} from '../storage';

const ALL_DOC_TYPES: DocumentType[] = [
  'efekty_nauczania',
  'zbiorcze_efekty',
  'karta_informacyjna',
  'podsumowanie_specjalisty',
  'uzasadnienie_nieklasyfikowania',
  'uzasadnienie_ndst',
];

describe('Group A: Walidacja i sanitizacja', () => {
  it('akceptuje poprawne dokumenty wszystkich 6 typów', () => {
    const profile = createDefaultProfile();
    profile.fullName = 'Anna Nowak';
    profile.schoolName = 'SP nr 1';

    const docs = ALL_DOC_TYPES.map((type) => createDocumentByType(type, profile));
    for (const doc of docs) {
      expect(isValidReportDocument(doc)).toBe(true);
    }

    const sanitized = sanitizeDocuments(docs, profile);
    expect(sanitized).toHaveLength(6);
    expect(sanitized.map((d) => d.type)).toEqual(ALL_DOC_TYPES);
    expect(new Set(sanitized.map((d) => d.id)).size).toBe(6);
  });

  it('uzupełnia brakujące pola w niekompletnym dokumencie bez wyjątku', () => {
    const profile = createDefaultProfile();
    const sanitized = sanitizeDocuments(
      [
        {
          type: 'efekty_nauczania',
          subject: 'Biologia',
          className: '6A',
        },
      ],
      profile
    );

    expect(sanitized).toHaveLength(1);
    const doc = sanitized[0];
    expect(doc?.type).toBe('efekty_nauczania');
    if (doc?.type === 'efekty_nauczania') {
      expect(doc.id.length).toBeGreaterThan(0);
      expect(doc.subject).toBe('Biologia');
      expect(doc.className).toBe('6A');
      expect(doc.semester).toBe(profile.defaultSemester);
      expect(doc.curriculumStatus).toBe('na_biezaco');
      expect(doc.failingGradesCount).toBe('0');
    }
  });

  it('odrzuca lub koryguje niepoprawne typy pól i nieznane typy dokumentów', () => {
    expect(isValidReportDocument(null)).toBe(false);
    expect(isValidReportDocument([])).toBe(false);
    expect(isValidReportDocument('tekst')).toBe(false);
    expect(isValidReportDocument({ type: 'nieznany_typ', id: 'x' })).toBe(false);

    const profile = createDefaultProfile();
    const sanitized = sanitizeDocuments(
      [
        { type: 'nieznany_typ', id: 'bad-1' },
        {
          type: 'efekty_nauczania',
          id: 12345,
          subject: 999,
          semester: 'III',
          curriculumStatus: 'zly_status',
          individualPathNotApplicable: 'tak',
          createdAt: 'nieprawidlowa-data',
          updatedAt: '',
        },
      ],
      profile
    );

    expect(sanitized).toHaveLength(1);
    const doc = sanitized[0];
    expect(doc?.type).toBe('efekty_nauczania');
    if (doc?.type === 'efekty_nauczania') {
      expect(typeof doc.id).toBe('string');
      expect(doc.subject).toBe('Matematyka'); // fallback z profilu zamiast liczby 999
      expect(doc.semester).toBe(profile.defaultSemester);
      expect(doc.curriculumStatus).toBe('na_biezaco');
      expect(doc.individualPathNotApplicable).toBe(true);
      expect(Number.isFinite(Date.parse(doc.createdAt))).toBe(true);
      expect(Number.isFinite(Date.parse(doc.updatedAt))).toBe(true);
    }
  });

  it('nadaje unikalne ID przy brakujących lub zduplikowanych ID w funkcjach sanitizujących', () => {
    const profile = createDefaultProfile();
    const docs = sanitizeDocuments(
      [
        { type: 'efekty_nauczania', id: 'dup-1', subject: 'Historia' },
        { type: 'efekty_nauczania', id: 'dup-1', subject: 'Geografia' },
        { type: 'efekty_nauczania', subject: 'Fizyka' },
      ],
      profile
    );
    expect(docs).toHaveLength(3);
    expect(new Set(docs.map((d) => d.id)).size).toBe(3);

    const wnioski = sanitizeCustomWnioski([
      { id: 'w1', categoryId: 'matematyka', text: 'Pierwszy wniosek' },
      { id: 'w1', categoryId: 'zla_kat', text: 'Drugi wniosek' },
      { categoryId: 'wlasne_ogolne', text: '   ' }, // pusty tekst odfiltrowany
      { text: 'Trzeci bez ID' },
    ]);
    expect(wnioski).toHaveLength(3);
    expect(new Set(wnioski.map((w) => w.id)).size).toBe(3);
    expect(wnioski[1]?.categoryId).toBe('wlasne_ogolne');

    const templates = sanitizeCustomTemplates([
      { id: 't1', title: 'Szablon 1', category: 'ogolne', content: 'Treść 1' },
      { id: 't1', title: '', category: 'nieistniejaca', content: 'Treść 2' },
      { title: 'Pusty', content: '  ' },
    ]);
    expect(templates).toHaveLength(2);
    expect(new Set(templates.map((t) => t.id)).size).toBe(2);
    expect(templates[1]?.category).toBe('ogolne');
    expect(templates[1]?.title).toBe('Szablon własny');
  });

  it('odrzuca zduplikowane jawne ID oraz zagnieżdżone duplikaty przy imporcie pełnej kopii', () => {
    const profile = createDefaultProfile();
    const d1 = createDocumentByType('efekty_nauczania', profile);
    const d2 = createDocumentByType('efekty_nauczania', profile);
    d2.id = d1.id;

    const dupTopRes = validateAndParseImportedJson(
      JSON.stringify({
        app: 'E-Sprawozdania',
        version: 1,
        profile,
        documents: [d1, d2],
      })
    );
    expect(dupTopRes.ok).toBe(false);

    const z1 = createDocumentByType('zbiorcze_efekty', profile);
    if (z1.type === 'zbiorcze_efekty') {
      const firstRow = z1.rows[0]!;
      z1.rows.push({ ...firstRow });
    }
    const dupNestedRes = validateAndParseImportedJson(
      JSON.stringify({
        app: 'E-Sprawozdania',
        version: 1,
        profile,
        documents: [z1],
      })
    );
    expect(dupNestedRes.ok).toBe(false);
  });

  it('odrzuca błędne pakiety nadzoru, notatki z kluczami prototypu i błędne pola app/kind/version', () => {
    const emptyPkg = sanitizeSupervisionPackages([
      null,
      { id: 'p1', documents: [{ type: 'nieznany' }] },
      { id: 'p2', documents: [] },
    ]);
    expect(emptyPkg).toEqual([]);

    const notes = sanitizeSupervisionClassNotes({
      '2026/2027|all|4A': 'Wzorowa klasa',
      empty: '   ',
      __proto__: 'zlosliwy',
      constructor: 'zlosliwy',
      numericVal: 123,
    });
    expect(Object.keys(notes)).toEqual(['2026/2027|all|4A']);

    const badApp = validateAndParseImportedJson(
      JSON.stringify({ app: 'InnaAplikacja', profile: {}, documents: [] })
    );
    expect(badApp.ok).toBe(false);

    const badKind = validateAndParseImportedJson(
      JSON.stringify({ app: 'E-Sprawozdania', kind: 'nieznany_kind', profile: {}, documents: [] })
    );
    expect(badKind.ok).toBe(false);

    const badVersion = validateAndParseImportedJson(
      JSON.stringify({ app: 'E-Sprawozdania', version: -2, profile: {}, documents: [] })
    );
    expect(badVersion.ok).toBe(false);

    const wrongKindForSupervision = validateAndParseSupervisionPackageJson(
      JSON.stringify({ app: 'E-Sprawozdania', kind: 'phrases_bundle', customWnioski: [] })
    );
    expect(wrongKindForSupervision.ok).toBe(false);

    const wrongKindForPhrases = validateAndParseSharedPhrasesJson(
      JSON.stringify({
        app: 'E-Sprawozdania',
        kind: 'supervision_package',
        customWnioski: [],
      })
    );
    expect(wrongKindForPhrases.ok).toBe(false);
  });

  it('sanitizuje profil z brakującymi polami i zachowuje spójność subjectAssignments', () => {
    const profile = sanitizeProfile({
      fullName: 'Jan Kowalski',
      subjectsList: ['Fizyka', 'Chemia'],
    });
    expect(profile.fullName).toBe('Jan Kowalski');
    expect(profile.subjectsList).toEqual(['Fizyka', 'Chemia']);
    expect(profile.subjectAssignments).toHaveLength(2);
    expect(profile.subjectAssignments[0]?.subject).toBe('Fizyka');
  });
});

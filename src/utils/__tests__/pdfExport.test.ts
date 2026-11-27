import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exportElementsToPdf,
  findSafeSliceHeightPx,
  sanitizePdfFilename,
} from '../pdfExport';

const addPageSpy = vi.fn();
const addImageSpy = vi.fn();
const outputSpy = vi.fn(() => new Blob(['%PDF-1.4 mock'], { type: 'application/pdf' }));
const jsPdfConstructorSpy = vi.fn(function MockJsPdf() {
  return {
    addPage: addPageSpy,
    addImage: addImageSpy,
    output: outputSpy,
  };
});
const html2CanvasSpy = vi.fn();

vi.mock('jspdf', () => ({
  jsPDF: jsPdfConstructorSpy,
}));

vi.mock('html2canvas-pro', () => ({
  default: html2CanvasSpy,
}));

interface FakeElementStub {
  tagName: string;
  href: string;
  download: string;
  style: Record<string, string>;
  width: number;
  height: number;
  scrollWidth: number;
  offsetWidth: number;
  scrollHeight: number;
  offsetHeight: number;
  children: FakeElementStub[];
  parentNode: { removeChild: (child: FakeElementStub) => void } | null;
  classList: { remove: (...names: string[]) => void };
  setAttribute: (name: string, value: string) => void;
  appendChild: (child: FakeElementStub) => FakeElementStub;
  cloneNode: (deep?: boolean) => FakeElementStub;
  click: () => void;
  remove: () => void;
  getContext: (type: string, opts?: unknown) => unknown;
  toDataURL: (mime?: string) => string;
}

function createFakeElement(tag: string): FakeElementStub {
  const el: FakeElementStub = {
    tagName: tag.toUpperCase(),
    href: '',
    download: '',
    style: {},
    width: 0,
    height: 0,
    scrollWidth: 794,
    offsetWidth: 794,
    scrollHeight: 1123,
    offsetHeight: 1123,
    children: [],
    parentNode: null,
    classList: {
      remove: vi.fn(),
    },
    setAttribute: vi.fn(),
    appendChild: (child: FakeElementStub) => {
      child.parentNode = {
        removeChild: (node: FakeElementStub) => {
          el.children = el.children.filter((c) => c !== node);
          node.parentNode = null;
        },
      };
      el.children.push(child);
      return child;
    },
    cloneNode: () => {
      const cloned = createFakeElement(tag);
      cloned.scrollWidth = el.scrollWidth;
      cloned.offsetWidth = el.offsetWidth;
      cloned.scrollHeight = el.scrollHeight;
      cloned.offsetHeight = el.offsetHeight;
      return cloned;
    },
    click: vi.fn(),
    remove: () => {
      el.parentNode?.removeChild(el);
    },
    getContext: () => ({
      fillStyle: '#ffffff',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: (_sx: number, _sy: number, sw: number, sh: number) => ({
        data: new Uint8ClampedArray(sw * sh * 4).fill(255),
      }),
    }),
    toDataURL: () => 'data:image/png;base64,ZmFrZQ==',
  };
  return el;
}

function createFakeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = createFakeElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas as unknown as HTMLCanvasElement;
}

describe('Direct PDF export (jsPDF + html2canvas-pro)', () => {
  const origDoc = globalThis.document;
  const origUrl = globalThis.URL;
  let bodyChildren: FakeElementStub[] = [];
  let lastDownloadedFilename = '';

  beforeEach(() => {
    vi.clearAllMocks();
    bodyChildren = [];
    lastDownloadedFilename = '';

    const fakeBody = {
      appendChild: (child: FakeElementStub) => {
        child.parentNode = {
          removeChild: (node: FakeElementStub) => {
            bodyChildren = bodyChildren.filter((c) => c !== node);
            node.parentNode = null;
          },
        };
        bodyChildren.push(child);
        return child;
      },
    };

    Object.defineProperty(globalThis, 'document', {
      value: {
        body: fakeBody,
        fonts: { ready: Promise.resolve() },
        createElement: (tag: string) => {
          const el = createFakeElement(tag);
          if (tag.toLowerCase() === 'a') {
            el.click = () => {
              lastDownloadedFilename = el.download;
            };
          }
          return el;
        },
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, 'URL', {
      value: {
        createObjectURL: () => 'blob:mock-pdf',
        revokeObjectURL: () => {},
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'document', {
      value: origDoc,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'URL', {
      value: origUrl,
      configurable: true,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it('normalizuje nazwy plików PDF i zamienia ukośniki roku szkolnego na myślniki', () => {
    expect(sanitizePdfFilename('Komplet sprawozdań (2026/2027) - 3 dok.')).toBe(
      'Komplet sprawozdań (2026-2027) - 3 dok.pdf'
    );
    expect(sanitizePdfFilename('Zbiorcze sprawozdanie <4A>: Semestr I.pdf')).toBe(
      'Zbiorcze sprawozdanie 4A Semestr I.pdf'
    );
    expect(sanitizePdfFilename('   ///   ')).toBe('sprawozdanie-szkolne.pdf');
  });

  it('zwraca czytelny błąd przy pustej liście arkuszy do eksportu', async () => {
    const res = await exportElementsToPdf([], 'pusty-raport');
    expect(res).toEqual({
      ok: false,
      error: 'Brak dokumentów do wygenerowania w pliku PDF.',
    });
    expect(jsPdfConstructorSpy).not.toHaveBeenCalled();
  });

  it('generuje wielostronicowy PDF A4 z wielu arkuszy .a4-sheet i wyzwala pobieranie', async () => {
    const sheet1 = createFakeElement('article') as unknown as HTMLElement;
    const sheet2 = createFakeElement('article') as unknown as HTMLElement;

    // 1588px width => single A4 height = floor(1588 * 297 / 210) = 2245px
    const singlePageCanvas = createFakeCanvas(1588, 2245);
    const multiPageCanvas = createFakeCanvas(1588, 3600);

    html2CanvasSpy
      .mockResolvedValueOnce(singlePageCanvas)
      .mockResolvedValueOnce(multiPageCanvas);

    const progressEvents: number[] = [];
    const phases: string[] = [];

    const res = await exportElementsToPdf(
      [sheet1, sheet2],
      'Zbiorcze sprawozdania klas - Rok 2026/2027 (2)',
      {
        onProgress: (p) => {
          progressEvents.push(p.percent);
          phases.push(p.phase);
        },
      }
    );

    expect(res).toEqual({
      ok: true,
      filename: 'Zbiorcze sprawozdania klas - Rok 2026-2027 (2).pdf',
      pageCount: 3,
    });
    expect(lastDownloadedFilename).toBe('Zbiorcze sprawozdania klas - Rok 2026-2027 (2).pdf');
    expect(phases[0]).toBe('preparing');
    expect(phases).toContain('rendering');
    expect(phases[phases.length - 1]).toBe('finalizing');
    expect(progressEvents[0]).toBe(5);
    expect(progressEvents[progressEvents.length - 1]).toBe(100);
    for (let i = 1; i < progressEvents.length; i += 1) {
      expect(progressEvents[i]!).toBeGreaterThanOrEqual(progressEvents[i - 1]!);
    }
    expect(jsPdfConstructorSpy).toHaveBeenCalledWith({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    expect(html2CanvasSpy).toHaveBeenCalledTimes(2);
    expect(addPageSpy).toHaveBeenCalledTimes(2);
    expect(addImageSpy).toHaveBeenCalledTimes(3);
    expect(outputSpy).toHaveBeenCalledWith('blob');
    expect(bodyChildren).toHaveLength(0);
  });

  it('bezpiecznie wylicza wysokość cięcia wielostronicowego arkusza', () => {
    const canvas = createFakeCanvas(800, 2400);
    const slice = findSafeSliceHeightPx(canvas, 0, 1131);
    expect(slice).toBeGreaterThanOrEqual(735);
    expect(slice).toBeLessThanOrEqual(1131);
  });

  it('rejestruje pominięte puste płótno (0x0) w zestawie mieszanym oraz zwraca błąd, gdy pominięto wszystkie arkusze', async () => {
    const validSheet = createFakeElement('article') as unknown as HTMLElement;
    const emptySheet = createFakeElement('article') as unknown as HTMLElement;

    html2CanvasSpy
      .mockResolvedValueOnce(createFakeCanvas(1588, 2245))
      .mockResolvedValueOnce(createFakeCanvas(0, 0));

    const mixedRes = await exportElementsToPdf([validSheet, emptySheet], 'mieszany-komplet');
    expect(mixedRes.ok).toBe(true);
    if (mixedRes.ok) {
      expect(mixedRes.pageCount).toBe(1);
      expect(mixedRes.skipped).toEqual([{ index: 2, title: 'Karta #2' }]);
    }

    html2CanvasSpy
      .mockResolvedValueOnce(createFakeCanvas(0, 0))
      .mockResolvedValueOnce(createFakeCanvas(0, 0));

    const allEmptyRes = await exportElementsToPdf([validSheet, emptySheet], 'same-puste');
    expect(allEmptyRes.ok).toBe(false);
    if (!allEmptyRes.ok) {
      expect(allEmptyRes.error).toContain('wszystkie arkusze');
      expect(allEmptyRes.skipped).toHaveLength(2);
    }
  });

  it('obniża skalę renderowania bardzo wysokiego arkusza przed wywołaniem html2canvas', async () => {
    const tallSheet = createFakeElement('article');
    tallSheet.scrollWidth = 794;
    tallSheet.scrollHeight = 12_000;

    html2CanvasSpy.mockResolvedValueOnce(createFakeCanvas(794, 12_000));

    const res = await exportElementsToPdf(
      [tallSheet as unknown as HTMLElement],
      'dluga-karta'
    );
    expect(res.ok).toBe(true);
    const passedOptions = html2CanvasSpy.mock.calls[0]?.[1] as { scale?: number } | undefined;
    expect(passedOptions?.scale).toBeDefined();
    expect(passedOptions?.scale).toBeGreaterThanOrEqual(1);
    expect(passedOptions?.scale).toBeLessThan(2);
  });
});

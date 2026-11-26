import { triggerBlobDownload } from './download';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const CONTINUATION_VERTICAL_MARGIN_MM = 10;
const SINGLE_PAGE_ROUNDING_TOLERANCE_PX = 8;

export type PdfExportPhase = 'preparing' | 'rendering' | 'finalizing';

export interface PdfExportProgress {
  phase: PdfExportPhase;
  currentDocument: number;
  totalDocuments: number;
  pagesGenerated: number;
  percent: number;
}

export interface ExportElementsToPdfOptions {
  onProgress?: (progress: PdfExportProgress) => void;
}

export type PdfExportResult =
  | {
      ok: true;
      filename: string;
      pageCount: number;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Normalizes a document title into a safe `.pdf` filename, preserving readable
 * characters while replacing slashes (e.g. "2026/2027") and illegal path symbols.
 */
export function sanitizePdfFilename(rawTitle: string): string {
  const cleaned = rawTitle
    .replace(/[/\\]+/g, '-')
    .replace(/[<>:"|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\s-]+|[.\s-]+$/g, '');

  if (!cleaned) {
    return 'sprawozdanie-szkolne.pdf';
  }

  if (/\.pdf$/i.test(cleaned)) {
    const stem = cleaned.slice(0, -4).trim();
    return stem ? `${stem}.pdf` : 'sprawozdanie-szkolne.pdf';
  }

  return `${cleaned}.pdf`;
}

/**
 * Scans upward from an ideal vertical break point for a mostly-white horizontal
 * band so text lines and table rows are not sliced mid-character across A4 pages.
 */
export function findSafeSliceHeightPx(
  canvas: HTMLCanvasElement,
  startY: number,
  idealSliceHeightPx: number
): number {
  const remaining = canvas.height - startY;
  if (remaining <= idealSliceHeightPx) {
    return remaining;
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || canvas.width <= 0) {
    return idealSliceHeightPx;
  }

  const minSliceHeight = Math.max(120, Math.floor(idealSliceHeightPx * 0.65));
  const searchStartY = startY + idealSliceHeightPx;
  const searchTopY = startY + minSliceHeight;
  const bandHeight = Math.max(1, searchStartY - searchTopY);

  try {
    const imageData = ctx.getImageData(0, searchTopY, canvas.width, bandHeight);
    const data = imageData.data;
    const width = canvas.width;
    const stepX = Math.max(2, Math.floor(width / 160));

    for (let rowOffset = bandHeight - 1; rowOffset >= 0; rowOffset -= 1) {
      const rowBase = rowOffset * width * 4;
      let isWhiteRow = true;

      for (let x = 0; x < width; x += stepX) {
        const idx = rowBase + x * 4;
        const r = data[idx] ?? 255;
        const g = data[idx + 1] ?? 255;
        const b = data[idx + 2] ?? 255;
        const a = data[idx + 3] ?? 255;

        if (a > 12 && (r < 245 || g < 245 || b < 245)) {
          isWhiteRow = false;
          break;
        }
      }

      if (isWhiteRow) {
        const candidateHeight = searchTopY + rowOffset - startY;
        if (candidateHeight >= minSliceHeight) {
          return candidateHeight;
        }
      }
    }
  } catch {
    // Fallback cleanly to exact proportional height if pixel read fails
  }

  return idealSliceHeightPx;
}

function yieldForUiPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      globalThis.setTimeout(resolve, 0);
      return;
    }
    window.requestAnimationFrame(() => {
      resolve();
    });
  });
}

function waitForNextFrames(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      globalThis.setTimeout(resolve, 16);
      return;
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

function createOffscreenHost(sheetElements: HTMLElement[]): {
  host: HTMLDivElement;
  clones: HTMLElement[];
} {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.position = 'fixed';
  host.style.left = '-100000px';
  host.style.top = '0';
  host.style.width = `${A4_WIDTH_MM}mm`;
  host.style.background = '#ffffff';
  host.style.color = '#0f172a';
  host.style.opacity = '1';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-1';
  host.style.margin = '0';
  host.style.padding = '0';

  const clones = sheetElements.map((el) => {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.classList.remove('print-page-break', 'mb-8');
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.margin = '0';
    clone.style.background = '#ffffff';
    host.appendChild(clone);
    return clone;
  });

  document.body.appendChild(host);
  return { host, clones };
}

/**
 * Renders one or more `.a4-sheet` DOM nodes directly into a multi-page A4 PDF
 * using html2canvas-pro + jsPDF and triggers an immediate file download.
 */
export async function exportElementsToPdf(
  sheetElements: HTMLElement[],
  filename: string,
  options?: ExportElementsToPdfOptions
): Promise<PdfExportResult> {
  if (typeof document === 'undefined' || !document.body) {
    return {
      ok: false,
      error: 'Generowanie PDF jest dostępne wyłącznie w oknie przeglądarki.',
    };
  }

  if (sheetElements.length === 0) {
    return {
      ok: false,
      error: 'Brak dokumentów do wygenerowania w pliku PDF.',
    };
  }

  const totalDocuments = sheetElements.length;
  const emitProgress = (
    phase: PdfExportPhase,
    currentDocument: number,
    pagesGenerated: number,
    percent: number
  ) => {
    options?.onProgress?.({
      phase,
      currentDocument,
      totalDocuments,
      pagesGenerated,
      percent: Math.max(0, Math.min(100, Math.round(percent))),
    });
  };

  const safeFilename = sanitizePdfFilename(filename);
  const { host, clones } = createOffscreenHost(sheetElements);

  try {
    emitProgress('preparing', 0, 0, 5);

    if (document.fonts && 'ready' in document.fonts) {
      await document.fonts.ready;
    }
    await waitForNextFrames();

    const [{ jsPDF }, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas-pro'),
    ]);
    const html2canvas = html2canvasModule.default;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    let pageCount = 0;

    for (let sheetIndex = 0; sheetIndex < clones.length; sheetIndex += 1) {
      const clone = clones[sheetIndex];
      if (!clone) continue;

      const docNumber = sheetIndex + 1;
      const startPercent = 10 + (sheetIndex / totalDocuments) * 82;
      emitProgress('rendering', docNumber, pageCount, startPercent);
      await yieldForUiPaint();

      const renderWidth = clone.scrollWidth || clone.offsetWidth || 794;
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: renderWidth,
      });

      const capturedPercent = 10 + ((sheetIndex + 0.75) / totalDocuments) * 82;
      emitProgress('rendering', docNumber, pageCount, capturedPercent);

      if (canvas.width === 0 || canvas.height === 0) {
        continue;
      }

      const fullPageHeightPx = Math.floor((canvas.width * A4_HEIGHT_MM) / A4_WIDTH_MM);

      if (canvas.height <= fullPageHeightPx + SINGLE_PAGE_ROUNDING_TOLERANCE_PX) {
        if (pageCount > 0) {
          pdf.addPage('a4', 'portrait');
        }
        const imgData = canvas.toDataURL('image/png');
        const imgHeightMm = Math.min(
          A4_HEIGHT_MM,
          (canvas.height * A4_WIDTH_MM) / canvas.width
        );
        pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_MM, imgHeightMm, undefined, 'FAST');
        pageCount += 1;
        const doneSheetPercent = 10 + ((sheetIndex + 1) / totalDocuments) * 82;
        emitProgress('rendering', docNumber, pageCount, doneSheetPercent);
        continue;
      }

      const continuationHeightMm = A4_HEIGHT_MM - CONTINUATION_VERTICAL_MARGIN_MM * 2;
      const continuationMaxPx = Math.floor(
        (canvas.width * continuationHeightMm) / A4_WIDTH_MM
      );

      let offsetY = 0;
      let isFirstSliceOfSheet = true;

      while (offsetY < canvas.height) {
        const remaining = canvas.height - offsetY;
        const maxSlicePx = isFirstSliceOfSheet ? fullPageHeightPx : continuationMaxPx;
        const sliceHeightPx =
          remaining <= maxSlicePx + (isFirstSliceOfSheet ? SINGLE_PAGE_ROUNDING_TOLERANCE_PX : 0)
            ? remaining
            : findSafeSliceHeightPx(canvas, offsetY, maxSlicePx);

        if (sliceHeightPx <= 0) {
          break;
        }

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;
        const sliceCtx = sliceCanvas.getContext('2d');
        if (!sliceCtx) {
          throw new Error('Brak kontekstu Canvas 2D do podziału strony PDF.');
        }

        sliceCtx.fillStyle = '#ffffff';
        sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        sliceCtx.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );

        if (pageCount > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const sliceImg = sliceCanvas.toDataURL('image/png');
        const sliceHeightMm = (sliceHeightPx * A4_WIDTH_MM) / canvas.width;
        const yMm = isFirstSliceOfSheet ? 0 : CONTINUATION_VERTICAL_MARGIN_MM;
        const maxAllowedMm = isFirstSliceOfSheet
          ? A4_HEIGHT_MM
          : A4_HEIGHT_MM - CONTINUATION_VERTICAL_MARGIN_MM;
        const fittedHeightMm = Math.min(maxAllowedMm, sliceHeightMm);

        pdf.addImage(sliceImg, 'PNG', 0, yMm, A4_WIDTH_MM, fittedHeightMm, undefined, 'FAST');
        pageCount += 1;
        offsetY += sliceHeightPx;
        isFirstSliceOfSheet = false;
      }

      const doneSheetPercent = 10 + ((sheetIndex + 1) / totalDocuments) * 82;
      emitProgress('rendering', docNumber, pageCount, doneSheetPercent);
    }

    if (pageCount === 0) {
      return {
        ok: false,
        error: 'Nie udało się wyrenderować stron dokumentu do pliku PDF.',
      };
    }

    emitProgress('finalizing', totalDocuments, pageCount, 96);
    await yieldForUiPaint();

    const blob = pdf.output('blob');
    const downloaded = triggerBlobDownload(blob, safeFilename);
    if (!downloaded) {
      return {
        ok: false,
        error: 'Przeglądarka zablokowała pobieranie wygenerowanego pliku PDF.',
      };
    }

    emitProgress('finalizing', totalDocuments, pageCount, 100);

    return {
      ok: true,
      filename: safeFilename,
      pageCount,
    };
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : 'Nieoczekiwany błąd podczas generowania pliku PDF.';
    return {
      ok: false,
      error: `Nie udało się wygenerować pliku PDF (${message}). Możesz skorzystać z przycisku „Drukuj”.`,
    };
  } finally {
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    } else if (typeof host.remove === 'function') {
      host.remove();
    }
  }
}

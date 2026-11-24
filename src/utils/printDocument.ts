/**
 * Isolated print helper that prints only the provided document markup inside a
 * hidden same-origin iframe, keeping the interactive application UI completely
 * separated from the printed output and setting a clean PDF title.
 */
export function printElementIsolated(
  sourceElement: HTMLElement | null,
  documentTitle: string
): void {
  if (!sourceElement) {
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  const iframeWin = iframe.contentWindow;

  if (!iframeDoc || !iframeWin) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  // Gather active stylesheets and inline styles from the main document
  const headNodes = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((node) => node.outerHTML)
    .join('\n');

  const safeTitle = documentTitle
    .replace(/[<>&"']/g, '')
    .trim() || 'Sprawozdanie szkolne';

  iframeDoc.open();
  iframeDoc.write(`<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <title>${safeTitle}</title>
    ${headNodes}
    <style>
      @page {
        size: A4 portrait;
        margin: 13mm 14mm;
      }
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
      }
      .a4-sheet {
        width: 100% !important;
        min-height: auto !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    </style>
  </head>
  <body>
    <div class="print-isolated-container">
      ${sourceElement.innerHTML}
    </div>
  </body>
</html>`);
  iframeDoc.close();

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  iframeWin.addEventListener('afterprint', cleanup, { once: true });

  const triggerPrint = () => {
    try {
      iframeWin.focus();
      iframeWin.print();
    } catch {
      window.print();
    }
    // Fallback cleanup in case afterprint does not fire in certain browsers
    window.setTimeout(cleanup, 2000);
  };

  // Allow cloned styles and fonts a tick to finish layout before printing
  if (iframeDoc.readyState === 'complete') {
    window.setTimeout(triggerPrint, 120);
  } else {
    iframe.onload = () => window.setTimeout(triggerPrint, 120);
  }
}

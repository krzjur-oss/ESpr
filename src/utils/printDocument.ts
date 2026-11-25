/**
 * Triggers native browser printing on the active document (which uses the
 * already-loaded Tailwind CSS, custom print styles, and fonts inside #print-area),
 * while temporarily setting a clean PDF/print document title.
 */
export function triggerWindowPrint(
  documentTitle: string,
  onAfterPrint?: () => void
): void {
  const previousTitle = document.title;
  const safeTitle =
    documentTitle.replace(/[<>&"']/g, '').trim() || 'Sprawozdanie szkolne';

  document.title = safeTitle;

  let titleRestored = false;
  let fullyCleaned = false;

  const restoreTitle = () => {
    if (titleRestored) return;
    titleRestored = true;
    document.title = previousTitle;
  };

  const cleanup = () => {
    restoreTitle();
    if (fullyCleaned) return;
    fullyCleaned = true;
    window.removeEventListener('afterprint', cleanup);
    window.removeEventListener('focus', handleWindowFocus);
    onAfterPrint?.();
  };

  const handleWindowFocus = () => {
    window.setTimeout(cleanup, 300);
  };

  window.addEventListener('afterprint', cleanup, { once: true });

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.print();
      // Register focus listener after print dialog opens/returns
      window.setTimeout(() => {
        window.addEventListener('focus', handleWindowFocus, { once: true });
      }, 200);
      // Restore title quickly even if afterprint is suppressed in an embedded frame
      window.setTimeout(restoreTitle, 3000);
      // Ultimate safety cleanup
      window.setTimeout(cleanup, 60000);
    });
  });
}

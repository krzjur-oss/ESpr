/**
 * Safely triggers a browser file download for JSON data using a Blob URL,
 * revoking the object URL only after a delay so mobile/Safari browsers have
 * time to initiate the download.
 */
export function triggerJsonDownload(payload: unknown, filename: string): boolean {
  if (
    typeof document === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return false;
  }

  let url: string | null = null;
  let anchor: HTMLAnchorElement | null = null;

  try {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    url = URL.createObjectURL(blob);

    anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();

    return true;
  } catch {
    return false;
  } finally {
    if (anchor) {
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      } else if (typeof anchor.remove === 'function') {
        anchor.remove();
      }
    }
    if (url) {
      const targetUrl = url;
      globalThis.setTimeout(() => {
        try {
          URL.revokeObjectURL(targetUrl);
        } catch {
          // Ignore revocation errors
        }
      }, 10_000);
    }
  }
}

/**
 * Copies text and reports whether it worked. Uses the Clipboard API and falls back to a hidden
 * textarea when clipboard permissions are missing (plain http:// links or in-app browsers).
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Refused: fall back to textarea selection.
  }
  return copyWithTextArea(text);
}

function copyWithTextArea(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.className = 'fixed top-0 left-0 opacity-0';
  document.body.append(area);
  const active = document.activeElement;
  area.select();
  area.setSelectionRange(0, text.length);
  let ok: boolean;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  if (active instanceof HTMLElement) active.focus({ preventScroll: true });
  return ok;
}

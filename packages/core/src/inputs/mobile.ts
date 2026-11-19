const PH_MOBILE_DIGITS_RE = /^(?:0?9\d{9}|639\d{9})$/;

/**
 * Normalizes a Philippine mobile number (also used for GCash and Maya accounts).
 * Accepts `0917…`, `917…`, `+63917…`, `63917…` with spaces, dashes, dots, or parentheses.
 * Returns `+639XXXXXXXXX` or `null` if invalid.
 */
export function normalizePhMobile(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  // Reject any unexpected characters (letters, extra symbols).
  if (/[^0-9+\s\-().]/.test(trimmed)) return null;

  const hasLeadingPlus = trimmed.startsWith('+');
  // Reject '+' appearing anywhere other than the start.
  if (trimmed.indexOf('+', 1) !== -1) return null;

  const digits = trimmed.replace(/\D/g, '');
  if (hasLeadingPlus && !digits.startsWith('639')) return null;
  if (!PH_MOBILE_DIGITS_RE.test(digits)) return null;

  if (digits.startsWith('639')) {
    return `+${digits}`;
  }
  if (digits.startsWith('09')) {
    return `+63${digits.slice(1)}`;
  }
  return `+63${digits}`;
}

export function isValidPhMobile(raw: string): boolean {
  return normalizePhMobile(raw) !== null;
}

/**
 * Formats a Philippine mobile number as `0917 123 4567`.
 * Returns trimmed input unchanged if it cannot be normalized.
 */
export function formatPhMobile(raw: string): string {
  const normalized = normalizePhMobile(raw);
  if (normalized === null) return raw.trim();
  const local = `0${normalized.slice(3)}`; // 09XXXXXXXXX (11 digits)
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7, 11)}`;
}

export const normalizeWalletMobile = normalizePhMobile;
export const isValidWalletMobile = isValidPhMobile;
export const formatWalletMobile = formatPhMobile;

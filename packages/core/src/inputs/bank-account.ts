const BANK_DIGITS_RE = /^\d{8,20}$/;

/**
 * Normalizes a Philippine bank account number by removing spaces and dashes.
 * Accepts 8–20 digits only. Returns digits-only string or `null` if invalid.
 */
export function normalizeBankAccount(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (/[^0-9\s-]/.test(trimmed)) return null;

  const digits = trimmed.replace(/[\s-]/g, '');
  if (!BANK_DIGITS_RE.test(digits)) return null;
  return digits;
}

export function isValidBankAccount(raw: string): boolean {
  return normalizeBankAccount(raw) !== null;
}

/**
 * Formats a bank account number in groups of 4 digits (e.g. `1234 5678 9012`).
 * Returns trimmed input unchanged if invalid.
 */
export function formatBankAccount(raw: string): string {
  const digits = normalizeBankAccount(raw);
  if (digits === null) return raw.trim();
  return digits.replace(/(.{4})(?=.)/g, '$1 ');
}

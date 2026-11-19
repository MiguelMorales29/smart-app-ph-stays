import { centavos } from '../money/index.js';
import type { Centavos } from '../money/index.js';

const PLAIN_PESO_RE = /^\d+(?:\.\d{1,2})?$/;
const K_PESO_RE = /^(\d+(?:\.\d+)?)[kK]$/;

/**
 * Parses owner-typed peso text (`1,500`, `1500`, `₱1500`, `₱ 1,500.50`, `1.5k`)
 * into whole centavos. Refuses negatives and more than 2 decimal places.
 */
export function parsePesosToCentavos(raw: string): Centavos | null {
  const stripped = raw.trim().replace(/^₱\s*/, '').replace(/,/g, '').trim();
  if (stripped.length === 0) return null;
  if (stripped.startsWith('-')) return null;

  const kMatch = K_PESO_RE.exec(stripped);
  if (kMatch) {
    const numStr = kMatch[1];
    if (numStr === undefined) return null;
    const parts = numStr.split('.');
    const intPart = parts[0] ?? '0';
    const fracPart = parts[1] ?? '';
    // Multiplying by 1,000 pesos = 100,000 centavos allows up to 5 decimal digits on the k-value.
    if (fracPart.length > 5) return null;
    const padded = fracPart.padEnd(5, '0');
    const total = Number(intPart) * 100_000 + Number(padded);
    if (!Number.isSafeInteger(total) || total < 0) return null;
    return centavos(total);
  }

  if (!PLAIN_PESO_RE.test(stripped)) return null;

  const [intPart, fracPart = ''] = stripped.split('.');
  const total = Number(intPart) * 100 + Number(fracPart.padEnd(2, '0'));
  if (!Number.isSafeInteger(total) || total < 0) return null;
  return centavos(total);
}

/**
 * Formats centavos as pesos (`₱1,500`, or `₱1,500.50` when centavos are non-zero).
 */
export function formatPesos(amountCentavos: number): string {
  if (!Number.isSafeInteger(amountCentavos)) {
    throw new RangeError(`Expected safe integer centavos, received ${String(amountCentavos)}.`);
  }
  const negative = amountCentavos < 0;
  const abs = Math.abs(amountCentavos);
  const wholePesos = Math.floor(abs / 100);
  const rem = abs % 100;
  const formattedWhole = wholePesos.toLocaleString('en-PH');
  const sign = negative ? '-' : '';
  if (rem === 0) {
    return `${sign}₱${formattedWhole}`;
  }
  return `${sign}₱${formattedWhole}.${String(rem).padStart(2, '0')}`;
}

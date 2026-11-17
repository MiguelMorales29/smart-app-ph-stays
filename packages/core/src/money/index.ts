import { z } from 'zod';

export const centavosSchema = z.int().min(0).brand<'Centavos'>();

export type Centavos = z.infer<typeof centavosSchema>;

export const signedCentavosSchema = z.int().brand<'SignedCentavos'>();

export type SignedCentavos = z.infer<typeof signedCentavosSchema>;

const pesoNumberFormat = new Intl.NumberFormat('en-PH', {
  maximumFractionDigits: 0,
});

export function centavos(value: number): Centavos {
  return centavosSchema.parse(value);
}

export function signedCentavos(value: number): SignedCentavos {
  return signedCentavosSchema.parse(value);
}

export function pesos(amount: number): Centavos {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError('Peso amount must be a finite number of 0 or more.');
  }

  const scaled = amount * 100;
  const rounded = Math.round(scaled);

  if (Math.abs(scaled - rounded) > 1e-6) {
    throw new RangeError('Peso amount may have at most two decimal places.');
  }

  return centavosSchema.parse(rounded);
}

export function formatPeso(amount: Centavos | SignedCentavos | number): string {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError('Centavos amount must be a safe integer.');
  }

  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const whole = Math.floor(abs / 100);
  const remainder = abs % 100;
  const formattedWhole = pesoNumberFormat.format(whole);

  if (remainder === 0) {
    return `${sign}₱${formattedWhole}`;
  }

  return `${sign}₱${formattedWhole}.${String(remainder).padStart(2, '0')}`;
}

export function sum(amounts: readonly Centavos[]): Centavos {
  let total = 0;

  for (const amount of amounts) {
    total += amount;
  }

  return centavosSchema.parse(total);
}

/**
 * Computes `percent`% of a non-negative `Centavos` amount, rounded half-up
 * to the nearest whole centavo (0.5 centavos rounds up to 1 centavo).
 *
 * Uses exact integer arithmetic (`Math.floor((amount * percent + 50) / 100)`)
 * when `percent` is an integer, avoiding floating-point drift.
 */
export function percentOf(amount: Centavos, percent: number): Centavos {
  if (!Number.isFinite(percent) || percent < 0) {
    throw new RangeError('Percent must be a finite number of 0 or more.');
  }

  const validatedAmount = centavosSchema.parse(amount);

  if (Number.isInteger(percent)) {
    const numerator = validatedAmount * percent + 50;
    if (!Number.isSafeInteger(numerator)) {
      throw new RangeError('Percent calculation exceeded safe integer range.');
    }
    return centavosSchema.parse(Math.floor(numerator / 100));
  }

  return centavosSchema.parse(Math.round((validatedAmount * percent) / 100));
}

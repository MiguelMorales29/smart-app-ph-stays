import type { CancellationPreset } from '../lists/index.js';

/**
 * What a guest gets back under each cancellation preset (Database blueprint, "Cancellation
 * presets"). The real rule runs in the database later; this pure version powers the owner's
 * worked examples in onboarding and settings, and the guest's preview in Phase 7.
 */
export interface CancellationOutcome {
  /** Whole centavos the guest gets back. */
  readonly refundCentavos: number;
  /** For dp_rebook: the guest may move the dates once instead. */
  readonly canRebook: boolean;
}

export function cancellationRefund(
  preset: Exclude<CancellationPreset, 'custom'>,
  input: {
    readonly paidCentavos: number;
    readonly downPaymentCentavos: number;
    /** Whole days between the cancellation and check-in (0 = check-in day). */
    readonly daysBeforeCheckIn: number;
  },
): CancellationOutcome {
  const { paidCentavos, downPaymentCentavos, daysBeforeCheckIn } = input;
  const half = Math.floor(paidCentavos / 2);
  switch (preset) {
    case 'flexible':
      return { refundCentavos: daysBeforeCheckIn >= 1 ? paidCentavos : 0, canRebook: false };
    case 'moderate':
      return { refundCentavos: daysBeforeCheckIn >= 5 ? paidCentavos : half, canRebook: false };
    case 'firm':
      if (daysBeforeCheckIn >= 30) return { refundCentavos: paidCentavos, canRebook: false };
      if (daysBeforeCheckIn >= 7) return { refundCentavos: half, canRebook: false };
      return { refundCentavos: 0, canRebook: false };
    case 'dp_rebook':
      return {
        refundCentavos: Math.max(0, paidCentavos - downPaymentCentavos),
        canRebook: true,
      };
    case 'non_refundable':
      return { refundCentavos: 0, canRebook: false };
  }
}

/** Owner-facing names and one-line summaries for each preset. */
export const CANCELLATION_PRESET_COPY: Readonly<
  Record<CancellationPreset, { readonly label: string; readonly summary: string }>
> = {
  dp_rebook: {
    label: 'Down payment kept, one date change',
    summary: 'The down payment stays with you; the guest may move the dates once.',
  },
  flexible: {
    label: 'Flexible',
    summary: 'Full refund up to 1 day before check-in.',
  },
  moderate: {
    label: 'Moderate',
    summary: 'Full refund up to 5 days before; half after that.',
  },
  firm: {
    label: 'Firm',
    summary: 'Full refund up to 30 days before; half until 7 days before; nothing after.',
  },
  non_refundable: {
    label: 'Non-refundable',
    summary: 'No refund after booking.',
  },
  custom: {
    label: 'My own rules',
    summary: 'Write your policy in your own words. Guests see it as you wrote it.',
  },
};

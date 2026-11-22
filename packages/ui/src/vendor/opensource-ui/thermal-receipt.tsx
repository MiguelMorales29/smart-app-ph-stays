// Source: https://opensourceui.in/components/thermal-receipt · copied 2026-10-25 · MIT, Opensource UI by Bidyut Kundu
// Adapted for Smart App PH Stays & Rentals: our cn, paper colour and torn edges as tokens/utilities
// (no inline style), type sizes on our scale, stays wording (property/booking/payment receipts),
// sample data and labels removed (all from props; optional fee/balance rows only show when given).
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from 'cn';
import { QrCode } from 'lucide-react';

export type ThermalReceiptItem = Readonly<{
  key: string;
  name: string;
  price: string;
}>;

export type ThermalReceiptCardProps = Readonly<
  {
    propertyName: string;
    propertyAddress?: string | undefined;
    bookingRef: string;
    date: string;
    items: readonly ThermalReceiptItem[];
    subtotalLabel: string;
    subtotal: string;
    feesLabel?: string | undefined;
    fees?: string | undefined;
    totalLabel: string;
    total: string;
    footer?: string | undefined;
    /** Replaces the decorative QR icon (for example a real booking or payment QR code). */
    code?: ReactNode | undefined;
  } & ComponentPropsWithoutRef<'div'>
>;

/** Thermal Receipt — paper slip with torn top and bottom edges for booking and payment receipts. */
export const ThermalReceiptCard = forwardRef<HTMLDivElement, ThermalReceiptCardProps>(
  (
    {
      className,
      propertyName,
      propertyAddress,
      bookingRef,
      date,
      items,
      subtotalLabel,
      subtotal,
      feesLabel,
      fees,
      totalLabel,
      total,
      footer,
      code,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      data-slot="thermal-receipt-card"
      className={cn('w-full font-mono', className)}
      {...props}
    >
      <div className="relative bg-paper px-4 py-5 text-paper-foreground shadow-md">
        <div className="pointer-events-none absolute -top-2 right-0 left-0 h-2 receipt-edge-top" />

        <div data-slot="thermal-receipt-card-header" className="text-center">
          <p className="text-sm font-bold tracking-widest">{propertyName}</p>
          {propertyAddress ? (
            <p className="mt-1 text-xs leading-snug text-paper-foreground/70">{propertyAddress}</p>
          ) : null}
          <p className="mt-2 text-xs text-paper-foreground/70">
            {bookingRef} · {date}
          </p>
        </div>

        <div
          data-slot="thermal-receipt-card-divider"
          className="my-3 border-t border-dashed border-paper-foreground/30"
        />

        <div data-slot="thermal-receipt-card-items" className="space-y-1.5">
          {items.map((item) => (
            <div key={item.key} className="flex justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">{item.name}</span>
              <span className="shrink-0 tabular-nums">{item.price}</span>
            </div>
          ))}
        </div>

        <div className="my-3 border-t border-dashed border-paper-foreground/30" />

        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between text-paper-foreground/75">
            <span>{subtotalLabel}</span>
            <span className="tabular-nums">{subtotal}</span>
          </div>
          {feesLabel && fees ? (
            <div className="flex justify-between text-paper-foreground/75">
              <span>{feesLabel}</span>
              <span className="tabular-nums">{fees}</span>
            </div>
          ) : null}
          <div className="flex justify-between pt-1 text-sm font-bold">
            <span>{totalLabel}</span>
            <span className="tabular-nums">{total}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          {code ?? <QrCode size={36} className="text-paper-foreground" aria-hidden="true" />}
          {footer ? (
            <p className="text-center text-xs leading-snug text-paper-foreground/70">{footer}</p>
          ) : null}
        </div>

        <div className="pointer-events-none absolute right-0 -bottom-2 left-0 h-2 receipt-edge-bottom" />
      </div>
    </div>
  ),
);

ThermalReceiptCard.displayName = 'ThermalReceiptCard';

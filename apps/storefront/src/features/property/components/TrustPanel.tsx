'use client';

import type { PublicTrustView } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { AlertTriangleIcon, FlagIcon, ShieldCheckIcon } from 'lucide-react';
import { useState } from 'react';

import { ReportPageSheet } from './ReportPageSheet';

export interface TrustPanelProps {
  readonly propertyId: string;
  readonly propertyName: string;
  readonly trust: PublicTrustView;
}

/**
 * Trust panel (PA-10 & PA-11): safe-payment guidance, 7-day payment account change warning, and
 * "Report this page" trigger opening `ReportPageSheet`.
 */
export function TrustPanel({ propertyId, propertyName, trust }: TrustPanelProps) {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <section
      aria-labelledby="trust-heading"
      data-slot="trust-panel"
      className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-info-tint text-info">
          <ShieldCheckIcon aria-hidden="true" className="size-5" />
        </span>
        <div className="space-y-1">
          <h2 id="trust-heading" className="font-heading text-base font-semibold">
            Pay safely
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pay only to the accounts shown in your booking conversation. We never ask you to pay
            anywhere else.
          </p>
        </div>
      </div>

      {trust.payment_accounts_changed_recently ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning-tint px-3.5 py-3 text-sm text-foreground"
        >
          <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            A payment account on this page changed in the last 7 days. Confirm the account name and
            number inside your booking conversation before sending money.
          </p>
        </div>
      ) : null}

      <div className="border-t border-border pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setReportOpen(true)}
          className="min-h-11 gap-2 px-2 text-muted-foreground hover:text-foreground"
        >
          <FlagIcon aria-hidden="true" className="size-4" />
          Report this page
        </Button>
      </div>

      <ReportPageSheet
        open={reportOpen}
        onOpenChange={setReportOpen}
        propertyId={propertyId}
        propertyName={propertyName}
      />
    </section>
  );
}

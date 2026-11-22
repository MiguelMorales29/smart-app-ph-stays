'use client';

import type { PublicTrustView } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import {
  AlertTriangleIcon,
  BadgeCheckIcon,
  FlagIcon,
  GlobeIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useState } from 'react';

import { officialPropertyAddress } from '../property-rules';
import { ReportPageSheet } from './ReportPageSheet';
import { VerifiedOwnerSheet } from './VerifiedOwnerSheet';

export interface TrustPanelProps {
  readonly slug: string;
  readonly propertyId: string;
  readonly propertyName: string;
  readonly trust: PublicTrustView;
}

/**
 * Trust panel (PA-10, PA-11, D77):
 * - Official web address (`smartapp.webserbisyo.com/<slug>`) + official page statement.
 * - Safe-payment warning against personal GCash or bank accounts sent in chat or by text.
 * - Tappable "Verified owner" trigger explaining what Smart App PH checked.
 * - 7-day payment account change warning when active.
 * - "Report this page" opening `ReportPageSheet`.
 */
export function TrustPanel({ slug, propertyId, propertyName, trust }: TrustPanelProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [verifiedOpen, setVerifiedOpen] = useState(false);
  const officialUrl = officialPropertyAddress(slug);

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
        <div className="min-w-0 space-y-1.5">
          <h2 id="trust-heading" className="font-heading text-base font-semibold">
            This is the official page for {propertyName}
          </h2>
          <p className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            <GlobeIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{officialUrl}</span>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pay only to the accounts shown in your booking conversation. We never ask you to pay a
            personal GCash or bank account in chat or by text.
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

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {trust.is_verified ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVerifiedOpen(true)}
            className="min-h-11 gap-2 rounded-full border-success/30 bg-success-tint px-3.5 text-foreground hover:bg-success-tint/80"
          >
            <BadgeCheckIcon aria-hidden="true" className="size-4 text-success" />
            Verified owner · What we checked
          </Button>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setReportOpen(true)}
          className="min-h-11 gap-2 px-2.5 text-muted-foreground hover:text-foreground"
        >
          <FlagIcon aria-hidden="true" className="size-4" />
          Report this page
        </Button>
      </div>

      <VerifiedOwnerSheet
        open={verifiedOpen}
        onOpenChange={setVerifiedOpen}
        propertyName={propertyName}
      />

      <ReportPageSheet
        open={reportOpen}
        onOpenChange={setReportOpen}
        propertyId={propertyId}
        propertyName={propertyName}
      />
    </section>
  );
}

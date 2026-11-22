'use client';

import { Button } from '@smartapp/ui/components/button';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { BadgeCheckIcon, Building2Icon, CreditCardIcon, IdCardIcon } from 'lucide-react';

export interface VerifiedOwnerSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly propertyName: string;
}

const CHECKED_ITEMS = [
  {
    icon: IdCardIcon,
    title: 'Government-issued ID',
    detail: 'The host submitted a valid Philippine government ID matching their owner profile.',
  },
  {
    icon: Building2Icon,
    title: 'Property proof',
    detail: 'Smart App PH reviewed proof that the host owns or manages this place.',
  },
  {
    icon: CreditCardIcon,
    title: 'Matched payout account',
    detail: 'Official payment accounts shown in your booking conversation are linked to this host.',
  },
] as const;

/** Explains what Smart App PH checked when awarding the Verified owner badge (D77). */
export function VerifiedOwnerSheet({ open, onOpenChange, propertyName }: VerifiedOwnerSheetProps) {
  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Verified owner"
      description={`What Smart App PH checked for ${propertyName}.`}
      height="half"
      size="sm"
      footer={
        <Button type="button" onClick={() => onOpenChange(false)} className="min-h-12">
          Got it
        </Button>
      }
    >
      <div className="space-y-4 py-1">
        <div className="flex items-start gap-3 rounded-xl border border-success/25 bg-success-tint px-3.5 py-3 text-sm text-foreground">
          <BadgeCheckIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
          <p>
            <strong>{propertyName}</strong> passed Smart App PH owner verification before going
            live.
          </p>
        </div>

        <ul className="space-y-3">
          {CHECKED_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="space-y-0.5 text-sm">
                  <p className="font-semibold text-card-foreground">{item.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Always double-check that you are on the official link and pay only to the accounts shown
          in your booking conversation.
        </p>
      </div>
    </AppSheet>
  );
}

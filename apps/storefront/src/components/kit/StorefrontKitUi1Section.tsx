'use client';

import { Button } from '@smartapp/ui/components/button';
import { BrandLockup } from '@smartapp/ui/compositions/brand-lockup';
import { HeartToggle } from '@smartapp/ui/compositions/heart-toggle';
import { MessengerIcon } from '@smartapp/ui/compositions/messenger-icon';
import { StatusLogo } from '@smartapp/ui/compositions/status-logo';
import { confettiBurst, confettiSideCannons } from '@smartapp/ui/lib/celebration';
import { PartyPopperIcon, SparklesIcon } from 'lucide-react';
import { useState } from 'react';

export interface StorefrontKitUi1SectionProps {
  readonly propertyName: string;
  readonly logoSrc?: string | null | undefined;
}

/** Guest-facing UI-1 pieces shown inside the storefront `/kit` under the active PropertyTheme. */
export function StorefrontKitUi1Section({
  propertyName,
  logoSrc = null,
}: StorefrontKitUi1SectionProps) {
  const [savedGlass, setSavedGlass] = useState(false);
  const [savedCard, setSavedCard] = useState(true);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            HeartToggle (glass &amp; card)
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-property-10-soft px-3 py-2">
              <HeartToggle
                pressed={savedGlass}
                onPressedChange={setSavedGlass}
                label={`Save ${propertyName}`}
                pressedLabel={`Remove ${propertyName} from saved stays`}
                variant="glass"
                size="sm"
              />
              <span className="text-xs font-medium text-property-10-soft-foreground">
                {savedGlass ? 'Saved' : 'Tap to save'}
              </span>
            </div>
            <HeartToggle
              pressed={savedCard}
              onPressedChange={setSavedCard}
              label={`Save ${propertyName}`}
              pressedLabel={`Remove ${propertyName} from saved stays`}
              variant="card"
              size="md"
            />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            StatusLogo (open, busy, paused)
          </p>
          <div className="flex flex-wrap items-center gap-6 py-1">
            <StatusLogo name={propertyName} src={logoSrc} state="open" logoShape="circle" />
            <StatusLogo
              name={propertyName}
              src={logoSrc}
              state="busy"
              stateLabel="Busy"
              logoShape="rounded"
            />
            <StatusLogo
              name={propertyName}
              src={logoSrc}
              state="paused"
              stateLabel="Paused"
              logoShape="circle"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            BrandLockup (light &amp; dark)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-center rounded-lg border border-border bg-background p-4">
              <BrandLockup name="Smart App PH" size="sm" />
            </div>
            <div className="dark flex items-center justify-center rounded-lg border border-border bg-background p-4 text-foreground">
              <BrandLockup name="Smart App PH" size="sm" />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            MessengerIcon &amp; celebration effects
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="min-h-11 gap-2">
              <MessengerIcon className="size-4" />
              Message on Messenger
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 gap-2"
              onClick={() => void confettiBurst()}
            >
              <SparklesIcon className="size-4" aria-hidden="true" />
              Confetti burst
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 gap-2"
              onClick={() => void confettiSideCannons()}
            >
              <PartyPopperIcon className="size-4" aria-hidden="true" />
              Side cannons
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { AnimatedList } from '@smartapp/ui/components/animated-list';
import { AnimatedShinyText } from '@smartapp/ui/components/animated-shiny-text';
import { BlurFade } from '@smartapp/ui/components/blur-fade';
import { BorderBeam } from '@smartapp/ui/components/border-beam';
import { GridPattern } from '@smartapp/ui/components/grid-pattern';
import { NumberTicker } from '@smartapp/ui/components/number-ticker';
import { ProgressiveBlur } from '@smartapp/ui/components/progressive-blur';
import { PulsatingButton } from '@smartapp/ui/components/pulsating-button';
import { ShineBorder } from '@smartapp/ui/components/shine-border';
import { WordRotate } from '@smartapp/ui/components/word-rotate';
import { RocketIcon } from 'lucide-react';

import { DualSurfaceShowcase } from './kit-base-tab';

/*
 * Magic UI effects (MIT). Five of them use the `motion` package, so they only load inside the lazy
 * kit sections and never with an app's first page (check-budget.ts fails the build otherwise, O15).
 * Each one answers an action or marks one moment; none decorates a whole page.
 */

const ARRIVALS = [
  'Miguel Santos paid ₱5,200 for Studio Fog',
  'Ana Reyes sent payment proof for Loft 2B',
  'Paolo Cruz booked 3 nights at Pine Room',
];

function ShowcaseCard({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4">
      {children}
    </div>
  );
}

function NumbersDemo() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Paid this month</p>
      <p className="font-heading text-3xl font-semibold tabular">
        ₱<NumberTicker value={248600} />
      </p>
      <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-foreground">
        <span>Your page is ready for</span>
        <WordRotate
          className="text-sm font-semibold text-primary-hover"
          words={['staycations', 'monthly rentals', 'bedspaces']}
        />
      </div>
    </div>
  );
}

function ArrivalsDemo() {
  return (
    <AnimatedList delay={1400} className="gap-2">
      {ARRIVALS.map((line) => (
        <div
          key={line}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {line}
        </div>
      ))}
    </AnimatedList>
  );
}

function BordersDemo() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ShowcaseCard>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <RocketIcon className="size-4" aria-hidden="true" />
          Smart App
        </p>
        <p className="text-xs text-muted-foreground">BorderBeam · the planned sidebar launcher</p>
        <BorderBeam size={60} duration={8} />
      </ShowcaseCard>
      <ShowcaseCard>
        <p className="text-sm font-semibold text-foreground">Free night unlocked</p>
        <p className="text-xs text-muted-foreground">
          ShineBorder · a reward the guest just earned
        </p>
        <ShineBorder shineColor={['var(--primary)', 'var(--brand-accent)']} />
      </ShowcaseCard>
    </div>
  );
}

function SurfacesDemo() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
        <GridPattern
          width={24}
          height={24}
          className="mask-[radial-gradient(circle,white,transparent_75%)]"
        />
        <AnimatedShinyText className="relative text-sm font-medium">
          New: monthly rentals
        </AnimatedShinyText>
      </div>
      <div className="relative h-32 overflow-hidden rounded-xl border border-border bg-card">
        <ul className="space-y-1 p-3 text-sm text-foreground">
          {['Studio Fog', 'Loft 2B', 'Pine Room', 'Garden Suite', 'Bedspace A3'].map((unit) => (
            <li key={unit}>{unit}</li>
          ))}
        </ul>
        <ProgressiveBlur position="bottom" height="45%" />
      </div>
    </div>
  );
}

function EntranceDemo() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <BlurFade delay={0.1} inView>
        <p className="rounded-lg bg-success-tint px-3 py-2 text-sm text-foreground">
          Booking confirmed
        </p>
      </BlurFade>
      <PulsatingButton className="h-11 px-5 text-sm">Approve payment</PulsatingButton>
    </div>
  );
}

/** UI-5 Magic UI effects, each with the one place it is allowed. */
export function KitBaseUi5Effects() {
  return (
    <>
      <DualSurfaceShowcase
        title="NumberTicker · WordRotate"
        source="Magic UI (MIT) · motion · lazy (UI-5)"
        useFor="A ₱ total counting up once on Home; one rotating word in an onboarding headline."
        dont="Animate numbers in tables or anywhere a person needs to read the value quickly."
        render={() => <NumbersDemo />}
      />
      <DualSurfaceShowcase
        title="AnimatedList"
        source="Magic UI (MIT) · motion · lazy (UI-5)"
        useFor="New activity arriving on Home (paid, proof sent, booked)."
        dont="Use it for lists people scroll or act on; items keep moving."
        render={() => <ArrivalsDemo />}
      />
      <DualSurfaceShowcase
        title="BorderBeam · ShineBorder"
        source="Magic UI (MIT) · BorderBeam uses motion · lazy (UI-5)"
        useFor="The Smart App launcher in the sidebar (brand colours) and a reward the guest just earned."
        dont="Put a moving border on more than one thing per screen."
        render={() => <BordersDemo />}
      />
      <DualSurfaceShowcase
        title="GridPattern · AnimatedShinyText · ProgressiveBlur"
        source="Magic UI (MIT) · CSS only (UI-5)"
        useFor="A quiet backdrop for an empty or announcement card; a fade where a list is cut off."
        dont="Put body text on top of the grid or hide content people need behind the blur."
        render={() => <SurfacesDemo />}
      />
      <DualSurfaceShowcase
        title="BlurFade · PulsatingButton"
        source="Magic UI (MIT) · BlurFade uses motion · lazy (UI-5)"
        useFor="One confirmation appearing after an action; one button that needs attention (a waiting payment)."
        dont="Fade in every section on page load or pulse more than one button."
        render={() => <EntranceDemo />}
      />
    </>
  );
}

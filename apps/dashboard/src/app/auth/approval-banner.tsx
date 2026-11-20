import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { BadgeCheckIcon, HourglassIcon, ShieldAlertIcon } from 'lucide-react';
import {
  Banner,
  BannerContent,
  BannerDescription,
  BannerIcon,
  BannerTitle,
} from '@smartapp/ui/components/banner';
import { Button } from '@smartapp/ui/components/button';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { useMyAccountQuery } from '@/data/auth/reads';

/**
 * Where the owner's application stands (OW-01, D47): pending owners can set up everything while
 * we check them; approval only unlocks publishing. Shown on /home and /onboarding.
 */
export function ApprovalBanner({ onboarding = false }: { readonly onboarding?: boolean }) {
  const account = useMyAccountQuery();
  const [checksOpen, setChecksOpen] = useState(false);
  const status = account.data?.account.status;
  if (!status || status === 'closed') return null;

  if (status === 'suspended') {
    return (
      <Banner
        variant="destructive"
        data-slot="approval-banner"
        dismissible={false}
        className="rounded-lg"
      >
        <BannerContent className="flex-row">
          <BannerIcon>
            <ShieldAlertIcon className="size-4" />
          </BannerIcon>
          <div className="flex flex-col gap-0.5">
            <BannerTitle>Your account is on hold</BannerTitle>
            <BannerDescription>
              {account.data?.account.verification_note ??
                'Guests can still see your page, but you cannot change it.'}{' '}
              Reply to our email if you have questions.
            </BannerDescription>
          </div>
        </BannerContent>
      </Banner>
    );
  }

  if (status === 'active') {
    if (!onboarding || account.data?.account.approved_at === null) return null;
    return (
      <div
        data-slot="approval-banner"
        role="status"
        className="flex min-h-11 items-center gap-2.5 rounded-xl bg-success-tint px-3 py-2 text-sm text-foreground"
      >
        <BadgeCheckIcon aria-hidden="true" className="size-4 shrink-0 text-success" />
        You're approved. Publish your page when it's ready.
      </div>
    );
  }

  const checks = (
    <AppSheet
      open={checksOpen}
      onOpenChange={setChecksOpen}
      title="What we check"
      description="So guests can trust every page on Smart App PH."
      size="sm"
      footer={
        <Button className="min-h-11" onClick={() => setChecksOpen(false)}>
          Got it
        </Button>
      }
    >
      <ul className="list-disc space-y-3 pl-5 text-sm">
        <li>That the place is real: your Facebook page, photos or a quick call.</li>
        <li>That you can be reached on the mobile number and email you gave.</li>
        <li>That what you rent is allowed (staycations, apartments or bed spaces).</li>
      </ul>
    </AppSheet>
  );

  // Pattern Guide §3.11: the full banner only on Home; one calm row everywhere else.
  if (onboarding) {
    return (
      <>
        <div
          data-slot="approval-banner"
          className="flex min-h-11 items-center gap-2.5 rounded-xl bg-muted px-3 py-2 text-sm"
        >
          <HourglassIcon aria-hidden="true" className="size-4 shrink-0 text-warning" />
          <p className="min-w-0 flex-1 text-foreground">
            We're checking your application. Your page goes live after we approve you.
          </p>
          <button
            type="button"
            className="shrink-0 font-medium text-primary-hover underline-offset-4 outline-none hover-hover:hover:underline focus-visible:underline pointer-coarse:min-h-11"
            onClick={() => setChecksOpen(true)}
          >
            What we check
          </button>
        </div>
        {checks}
      </>
    );
  }

  // Home: a calm card (not a coloured banner) with the next step and what we check.
  return (
    <>
      <section
        data-slot="approval-banner"
        aria-labelledby="approval-title"
        className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-warning-tint">
            <HourglassIcon aria-hidden="true" className="size-4 text-warning" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 id="approval-title" className="font-medium text-foreground">
              We're checking your application
            </h2>
            <p className="text-sm text-muted-foreground">
              We'll email you. Set up your page now; it goes live after we approve you.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="min-h-11 sm:min-h-8"
            nativeButton={false}
            render={<Link to="/onboarding" />}
          >
            Set up your page
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-h-11 sm:min-h-8"
            onClick={() => setChecksOpen(true)}
          >
            What we check
          </Button>
        </div>
      </section>
      {checks}
    </>
  );
}

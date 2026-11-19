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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@smartapp/ui/components/sheet';
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
      <Banner
        variant="success"
        data-slot="approval-banner"
        dismissible={false}
        className="rounded-lg"
      >
        <BannerContent className="flex-row">
          <BannerIcon>
            <BadgeCheckIcon className="size-4" />
          </BannerIcon>
          <div className="flex flex-col gap-0.5">
            <BannerTitle>You're approved</BannerTitle>
            <BannerDescription>Publish your page when it's ready.</BannerDescription>
          </div>
        </BannerContent>
      </Banner>
    );
  }

  return (
    <>
      <Banner
        variant="warning"
        data-slot="approval-banner"
        dismissible={false}
        className="rounded-lg"
      >
        <BannerContent className="flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 gap-3">
            <BannerIcon>
              <HourglassIcon className="size-4" />
            </BannerIcon>
            <div className="flex flex-col gap-0.5">
              <BannerTitle>We're checking your application</BannerTitle>
              <BannerDescription>
                We'll email you. Set up your page now; it goes live after we approve you.
              </BannerDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {onboarding ? null : (
              <Button
                size="sm"
                className="min-h-11 sm:min-h-8"
                nativeButton={false}
                render={<Link to="/onboarding" />}
              >
                Set up your page
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="min-h-11 sm:min-h-8"
              onClick={() => setChecksOpen(true)}
            >
              What we check
            </Button>
          </div>
        </BannerContent>
      </Banner>
      <Sheet open={checksOpen} onOpenChange={setChecksOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] sm:mx-auto sm:max-w-lg sm:rounded-t-xl"
        >
          <SheetHeader>
            <SheetTitle>What we check</SheetTitle>
            <SheetDescription>So guests can trust every page on Smart App PH.</SheetDescription>
          </SheetHeader>
          <ul className="space-y-3 px-4 pb-6 text-sm">
            <li>That the place is real: your Facebook page, photos or a quick call.</li>
            <li>That you can be reached on the mobile number and email you gave.</li>
            <li>That what you rent is allowed (staycations, apartments or bed spaces).</li>
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}

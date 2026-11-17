import type { ReactNode } from 'react';
import { PauseCircleIcon } from 'lucide-react';
import {
  Banner,
  BannerContent,
  BannerDescription,
  BannerIcon,
  BannerTitle,
} from '@smartapp/ui/components/banner';

export interface PausedAccountBannerProps {
  readonly propertyName?: string | undefined;
  readonly action?: ReactNode;
}

/** Warning banner shown across owner dashboard frames when an account subscription is paused. */
export function PausedAccountBanner({ propertyName, action }: PausedAccountBannerProps) {
  return (
    <Banner
      variant="warning"
      dismissible={false}
      className="rounded-none border-x-0 border-t-0 px-4 py-2.5"
      aria-label="Paused account notice"
    >
      <BannerIcon>
        <PauseCircleIcon className="size-4" />
      </BannerIcon>
      <BannerContent className="flex-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <BannerTitle>
            {propertyName ? `${propertyName} is paused` : 'Your account is paused'}
          </BannerTitle>
          <BannerDescription>
            Online bookings are turned off and guests see your contact details only until billing is
            settled.
          </BannerDescription>
        </div>
        {action}
      </BannerContent>
    </Banner>
  );
}

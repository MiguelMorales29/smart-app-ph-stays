import { Banner, BannerContent, BannerIcon, BannerTitle } from '@smartapp/ui/components/banner';
import { InfoIcon } from 'lucide-react';

export function DemoBanner({ isDemo }: { readonly isDemo: boolean }) {
  if (!isDemo) {
    return null;
  }

  return (
    <Banner
      variant="info"
      dismissible={false}
      role="status"
      aria-label="Demo property indicator"
      className="rounded-none border-x-0 border-t-0 px-4 py-2"
    >
      <BannerContent className="mx-auto w-full max-w-5xl flex-row items-center justify-center gap-2">
        <BannerIcon>
          <InfoIcon className="size-4" />
        </BannerIcon>
        <BannerTitle>Demo · not a real property</BannerTitle>
      </BannerContent>
    </Banner>
  );
}

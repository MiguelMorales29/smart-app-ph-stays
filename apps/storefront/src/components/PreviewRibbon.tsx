'use client';

import { Banner, BannerContent, BannerIcon, BannerTitle } from '@smartapp/ui/components/banner';
import { FlaskConicalIcon } from 'lucide-react';

export function PreviewRibbon() {
  // On sample data the floating Preview pill already says this; the ribbon is only for
  // previews that run on real data (from Phase 10).
  if (
    process.env.NEXT_PUBLIC_APP_ENV !== 'preview' ||
    process.env.NEXT_PUBLIC_DATA_SOURCE === 'memory'
  ) {
    return null;
  }

  return (
    <Banner
      variant="warning"
      dismissible={false}
      role="status"
      aria-label="Preview environment indicator"
      className="rounded-none border-x-0 border-t-0 px-4 py-2"
    >
      <BannerContent className="mx-auto w-full max-w-5xl flex-row items-center justify-center gap-2">
        <BannerIcon>
          <FlaskConicalIcon className="size-4" />
        </BannerIcon>
        <BannerTitle>Preview · sample data</BannerTitle>
      </BannerContent>
    </Banner>
  );
}

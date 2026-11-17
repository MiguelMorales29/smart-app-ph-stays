'use client';

import { Banner, BannerContent, BannerIcon, BannerTitle } from '@smartapp/ui/components/banner';
import { FlaskConicalIcon } from 'lucide-react';

export function PreviewRibbon() {
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'preview') {
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
      <BannerContent className="mx-auto w-full max-w-5xl justify-center">
        <BannerIcon>
          <FlaskConicalIcon className="size-4" />
        </BannerIcon>
        <BannerTitle>Preview · sample data</BannerTitle>
      </BannerContent>
    </Banner>
  );
}

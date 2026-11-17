import { Banner, BannerIcon, BannerTitle } from '@smartapp/ui/components/banner';
import { FlaskConicalIcon } from 'lucide-react';

export function PreviewRibbon() {
  // On sample data the floating Preview pill already says this; the ribbon is only for
  // previews that run on real data (from Phase 10).
  if (import.meta.env.VITE_APP_ENV !== 'preview' || import.meta.env.VITE_DATA_SOURCE === 'memory') {
    return null;
  }

  return (
    <Banner
      variant="warning"
      dismissible={false}
      className="rounded-none border-x-0 border-t-0 px-4 py-1.5"
      aria-label="Preview environment indicator"
    >
      <BannerIcon>
        <FlaskConicalIcon className="size-4" />
      </BannerIcon>
      <BannerTitle>Preview · sample data</BannerTitle>
    </Banner>
  );
}

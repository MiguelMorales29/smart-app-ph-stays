import { Banner, BannerIcon, BannerTitle } from '@smartapp/ui/components/banner';
import { FlaskConicalIcon } from 'lucide-react';

export function PreviewRibbon() {
  if (import.meta.env.VITE_APP_ENV !== 'preview') {
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

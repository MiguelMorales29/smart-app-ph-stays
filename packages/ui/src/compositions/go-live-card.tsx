import { useEffect, useId, useState } from 'react';
import { CheckIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { MilestonePicture } from '@smartapp/ui/compositions/milestone-picture';
import { celebrate } from '@smartapp/ui/lib/celebration';
import { cn } from '@smartapp/ui/lib/utils';

/**
 * The go-live moment (D53): "<Place> is live", the page link, Copy and one confetti burst per
 * property per device. Shown by the Phase 5 publish flow; previewed on /kit.
 */
export function GoLiveCard({
  propertyName,
  url,
  celebrationKey,
  onOpen,
  className,
}: {
  readonly propertyName: string;
  /** The full public address, e.g. https://smartapp.ph/ulap-suites */
  readonly url: string;
  /** One burst per key per device, e.g. `live:${propertyId}`. Pass null to skip the burst. */
  readonly celebrationKey: string | null;
  readonly onOpen?: (() => void) | undefined;
  readonly className?: string | undefined;
}) {
  const titleId = useId();
  const [copied, setCopied] = useState(false);
  const display = url.replace(/^https?:\/\//, '');

  useEffect(() => {
    if (celebrationKey) void celebrate(celebrationKey);
  }, [celebrationKey]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <section
      data-slot="go-live-card"
      aria-labelledby={titleId}
      className={cn(
        'flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center shadow-xs',
        className,
      )}
    >
      <MilestonePicture art="live" tone="celebrate" />
      <div className="space-y-1">
        <h2 id={titleId} className="line-clamp-2 font-heading text-xl font-semibold">
          {propertyName} is live
        </h2>
        <p className="text-sm text-muted-foreground">Guests can now find your page and book.</p>
      </div>
      <p className="w-full truncate rounded-lg bg-muted px-3 py-2 text-sm font-medium">{display}</p>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => {
            void navigator.clipboard
              ?.writeText(url)
              .then(() => setCopied(true))
              .catch(() => undefined);
          }}
        >
          {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
          {copied ? 'Link copied' : 'Copy link'}
        </Button>
        <Button
          className="min-h-11"
          nativeButton={false}
          render={<a href={url} target="_blank" rel="noreferrer" onClick={onOpen} />}
        >
          <ExternalLinkIcon aria-hidden="true" />
          Open your page
        </Button>
      </div>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Link copied' : ''}
      </span>
    </section>
  );
}

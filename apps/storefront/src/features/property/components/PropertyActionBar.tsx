import { Button } from '@smartapp/ui/components/button';
import { CalendarIcon, MessageSquareIcon } from 'lucide-react';
import Link from 'next/link';

export interface PropertyActionBarProps {
  readonly slug: string;
  readonly checkDatesHref: string | null;
}

/**
 * Sticky action bar on phones (part 15): "Check dates" (goes to the single unit or `#units`)
 * and "Message" (`/<slug>/inquire`). Placed inside `PropertyFrame`'s sticky bar with safe-area
 * padding so it respects the home indicator and never covers the footer or last section.
 */
export function PropertyActionBar({ slug, checkDatesHref }: PropertyActionBarProps) {
  return (
    <div className="flex items-center gap-2.5">
      {checkDatesHref ? (
        <Button
          nativeButton={false}
          render={
            checkDatesHref.startsWith('#') ? (
              <a href={checkDatesHref} />
            ) : (
              <Link href={checkDatesHref} />
            )
          }
          className="min-h-12 flex-1 gap-2 px-4 text-base font-semibold"
        >
          <CalendarIcon aria-hidden="true" className="size-4" />
          Check dates
        </Button>
      ) : null}

      <Button
        variant={checkDatesHref ? 'outline' : 'default'}
        nativeButton={false}
        render={<Link href={`/${slug}/inquire`} />}
        className={
          checkDatesHref
            ? 'min-h-12 shrink-0 gap-2 px-4 text-base font-medium'
            : 'min-h-12 flex-1 gap-2 px-4 text-base font-semibold'
        }
      >
        <MessageSquareIcon aria-hidden="true" className="size-4" />
        Message
      </Button>
    </div>
  );
}

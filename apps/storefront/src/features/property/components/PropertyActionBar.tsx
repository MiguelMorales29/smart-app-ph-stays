'use client';

import type { PropertyContact, WeeklyHours } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { CalendarIcon, MessageSquareIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PropertyContactSheet } from './PropertyContactSheet';

export interface PropertyActionBarProps {
  readonly propertyName: string;
  readonly checkDatesHref: string | null;
  readonly contact: PropertyContact;
  readonly replyHours: WeeklyHours | null;
}

/**
 * Sticky action bar on phones & tablets (<1024 px, part 15 & D76):
 * "Check dates" (single unit → unit page, multiple → `#units`) and "Message", which opens
 * `PropertyContactSheet` with the owner's configured channels (no `/inquire` in wave 1).
 */
export function PropertyActionBar({
  propertyName,
  checkDatesHref,
  contact,
  replyHours,
}: PropertyActionBarProps) {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
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
          type="button"
          variant={checkDatesHref ? 'outline' : 'default'}
          onClick={() => setContactOpen(true)}
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

      <PropertyContactSheet
        open={contactOpen}
        onOpenChange={setContactOpen}
        propertyName={propertyName}
        contact={contact}
        replyHours={replyHours}
      />
    </>
  );
}

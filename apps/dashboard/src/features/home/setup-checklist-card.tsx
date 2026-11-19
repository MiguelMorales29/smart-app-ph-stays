import { Link } from '@tanstack/react-router';
import { CheckIcon, ChevronRightIcon, ClockIcon } from 'lucide-react';
import type { SetupChecklistView, SetupStepKey } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { CircularProgressCombined } from '@smartapp/ui/components/circular-progress';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { cn } from '@smartapp/ui/lib/utils';
import { useSetupChecklistQuery } from '@/data/setup/reads';

type RowKey = 'account' | SetupStepKey;

interface RowCopy {
  readonly title: string;
  readonly hint: string;
  readonly action: string;
  readonly waiting?: string;
}

const ROW_COPY: Record<RowKey, RowCopy> = {
  account: { title: 'Create your account', hint: '', action: '' },
  property: {
    title: 'Add your place',
    hint: 'Its name, town and web address. Guests see these first.',
    action: 'Add your place',
  },
  unit: {
    title: 'Add your first unit',
    hint: 'A whole place, a private room or beds in a shared room.',
    action: 'Add a unit',
  },
  photos: {
    title: 'Add photos',
    hint: 'At least 3 photos for each unit you list.',
    action: 'Add photos',
  },
  price: {
    title: 'Set a price',
    hint: 'The nightly price and how many guests it includes.',
    action: 'Set a price',
  },
  payment_accounts: {
    title: 'Add how guests pay',
    hint: 'A GCash, Maya or bank account where guests send the down payment.',
    action: 'Add a way to pay',
  },
  rules: {
    title: 'Check your rules',
    hint: 'Cancellation, check-in and check-out times, and house rules.',
    action: 'Check your rules',
  },
  publish: {
    title: 'Publish your page',
    hint: 'Your page goes live and guests can book.',
    action: 'Open the page editor',
    waiting: 'Waits for our approval of your account.',
  },
};

const ONBOARDING_STEP: Partial<Record<SetupStepKey, 1 | 2 | 3 | 4 | 5 | 6>> = {
  property: 1,
  unit: 2,
  photos: 3,
  price: 4,
  payment_accounts: 5,
  rules: 6,
};

function StatusDot({ status }: { readonly status: 'done' | 'todo' | 'waiting' }) {
  if (status === 'done') {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-tint text-success motion-safe:animate-in motion-safe:zoom-in-50 duration-base ease-enter">
        <CheckIcon aria-hidden="true" className="size-3.5" />
        <span className="sr-only">Done:</span>
      </span>
    );
  }
  if (status === 'waiting') {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-warning-tint text-warning">
        <ClockIcon aria-hidden="true" className="size-3.5" />
        <span className="sr-only">Waiting:</span>
      </span>
    );
  }
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-border">
      <span className="sr-only">To do:</span>
    </span>
  );
}

interface ChecklistRow {
  readonly key: RowKey;
  readonly status: 'done' | 'todo' | 'waiting';
}

/** The rows in order: the account (always done, D48 head start) and the 7 checklist items. */
export function checklistRows(view: SetupChecklistView): ChecklistRow[] {
  const account: ChecklistRow = { key: 'account', status: 'done' };
  return [
    account,
    ...view.items.map((item): ChecklistRow => ({ key: item.key, status: item.status })),
  ];
}

/** Home's "Get your page ready" card (OW-02). Hidden once the page is published. */
export function SetupChecklistCard() {
  const checklist = useSetupChecklistQuery();

  if (checklist.isPending) {
    return <Skeleton className="h-40 w-full rounded-xl" aria-label="Loading your setup" />;
  }
  if (checklist.isError || !checklist.data) return null;

  const rows = checklistRows(checklist.data);
  const publish = rows.find((row) => row.key === 'publish');
  if (publish?.status === 'done') return null;

  const done = rows.filter((row) => row.status === 'done').length;
  const nextKey = rows.find((row) => row.status === 'todo')?.key ?? null;

  return (
    <section
      aria-labelledby="setup-title"
      className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5"
    >
      <div className="flex items-center gap-4">
        <CircularProgressCombined
          value={done}
          max={rows.length}
          label="Setup"
          getValueText={(value, _min, max) => `${value} of ${max} done`}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <h2 id="setup-title" className="font-heading text-lg font-semibold">
            Get your page ready
          </h2>
          <p className="text-sm text-muted-foreground tabular">
            {done} of {rows.length} done
          </p>
          <div className="grid grid-cols-8 gap-1" aria-hidden="true">
            {rows.map((row) => (
              <span
                key={row.key}
                className={cn(
                  'h-1.5 rounded-full transition-colors duration-slow ease-enter',
                  row.status === 'done' ? 'bg-primary' : 'bg-muted',
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <ol className="mt-4 divide-y divide-border">
        {rows.map((row) => {
          const copy = ROW_COPY[row.key];
          const open = row.key === nextKey;
          const step = row.key === 'account' ? undefined : ONBOARDING_STEP[row.key];
          return (
            <li key={row.key} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <StatusDot status={row.status} />
                <span
                  className={cn(
                    'min-w-0 flex-1 text-sm',
                    open ? 'font-semibold' : 'font-medium',
                    row.status === 'done' && 'text-muted-foreground',
                  )}
                >
                  {copy.title}
                </span>
                {!open && row.status === 'todo' && step !== undefined ? (
                  <Link
                    to="/onboarding"
                    search={{ step }}
                    aria-label={copy.action}
                    className="-m-2 flex size-11 items-center justify-center rounded-md text-muted-foreground outline-none hover-hover:hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <ChevronRightIcon aria-hidden="true" className="size-4" />
                  </Link>
                ) : null}
              </div>
              {row.status === 'waiting' && copy.waiting ? (
                <p className="mt-1 pl-9 text-sm text-muted-foreground">{copy.waiting}</p>
              ) : null}
              {open ? (
                <div className="mt-2 space-y-3 pl-9">
                  <p className="text-sm text-muted-foreground">{copy.hint}</p>
                  {row.key === 'publish' ? (
                    <Button
                      className="min-h-11"
                      nativeButton={false}
                      render={<Link to="/editor" />}
                    >
                      {copy.action}
                    </Button>
                  ) : (
                    <Button
                      className="min-h-11"
                      nativeButton={false}
                      render={<Link to="/onboarding" search={{ step: step ?? 1 }} />}
                    >
                      {copy.action}
                    </Button>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

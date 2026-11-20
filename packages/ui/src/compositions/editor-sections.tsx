import { useState, type ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@smartapp/ui/components/accordion';
import { useFormFactor } from '@smartapp/ui/hooks/use-form-factor';
import { cn } from '@smartapp/ui/lib/utils';

export interface EditorSection<T extends string> {
  readonly value: T;
  readonly label: string;
  /** The section's current value, e.g. "₱2,600 a night · Fri/Sat ₱3,200". */
  readonly summary?: ReactNode | undefined;
  /** A dot for a section that still needs the owner. */
  readonly needsYou?: boolean | undefined;
  readonly content: ReactNode;
}

/**
 * Sections of a long editor (Pattern Guide §3.7). Phones and tablets: an accordion whose headers
 * show each section's value. Desktop: a section list on the left and the open section on the
 * right. A section's content loads the first time it opens and then stays mounted, so forms keep
 * their state and opening and closing always animate.
 */
export function EditorSections<T extends string>({
  sections,
  value,
  onValueChange,
  label = 'Sections',
}: {
  readonly sections: readonly EditorSection<T>[];
  /** The open section; null closes all of them on phones. */
  readonly value: T | null;
  readonly onValueChange: (value: T | null) => void;
  readonly label?: string | undefined;
}) {
  const formFactor = useFormFactor();
  const [visited, setVisited] = useState<ReadonlySet<T>>(() => new Set(value ? [value] : []));
  if (value && !visited.has(value)) setVisited(new Set([...visited, value]));
  const desktopValue = value ?? sections[0]?.value ?? null;

  if (formFactor === 'desktop') {
    if (desktopValue && !visited.has(desktopValue)) setVisited(new Set([...visited, desktopValue]));
    return (
      <div className="grid grid-cols-[15rem_minmax(0,1fr)] items-start gap-8">
        <nav aria-label={label} className="sticky top-[calc(var(--shell-header-height)+1rem)]">
          <ul className="flex flex-col gap-1">
            {sections.map((section) => {
              const active = section.value === desktopValue;
              return (
                <li key={section.value}>
                  <button
                    type="button"
                    aria-current={active ? 'true' : undefined}
                    onClick={() => onValueChange(section.value)}
                    className={cn(
                      'press flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      active ? 'bg-primary-tint' : 'hover-hover:hover:bg-muted',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {section.label}
                      </span>
                      {section.summary ? (
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                          {section.summary}
                        </span>
                      ) : null}
                    </span>
                    {section.needsYou ? (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                        aria-label="Needs you"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0 rounded-2xl border border-border bg-card p-6">
          {sections.map((section) =>
            visited.has(section.value) ? (
              <section
                key={section.value}
                hidden={section.value !== desktopValue}
                aria-label={section.label}
                className="motion-safe:animate-in motion-safe:fade-in-0 duration-base"
              >
                {section.content}
              </section>
            ) : null,
          )}
        </div>
      </div>
    );
  }

  return (
    <Accordion
      aria-label={label}
      value={value ? [value] : []}
      onValueChange={(next) => {
        const picked = sections.find((section) => section.value === next[0]);
        onValueChange(picked ? picked.value : null);
      }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      {sections.map((section) => (
        <AccordionItem key={section.value} value={section.value} className="border-border px-4">
          <AccordionTrigger className="min-h-14 items-center py-3 text-base hover:no-underline">
            <span className="flex min-w-0 flex-1 items-center gap-2 pr-2">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-foreground">{section.label}</span>
                {section.summary ? (
                  <span className="mt-0.5 block truncate text-sm font-normal text-muted-foreground">
                    {section.summary}
                  </span>
                ) : null}
              </span>
              {section.needsYou ? (
                <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Needs you" />
              ) : null}
            </span>
          </AccordionTrigger>
          <AccordionContent keepMounted className="pb-5">
            {visited.has(section.value) ? section.content : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

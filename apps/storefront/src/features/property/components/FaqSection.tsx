'use client';

import type { PropertyPageDraft } from '@smartapp/core';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@smartapp/ui/components/accordion';

export interface FaqSectionProps {
  readonly items: PropertyPageDraft['faq'];
}

/** FAQ (part 13): installed Base UI Accordion with height animation, one open at a time. */
export function FaqSection({ items }: FaqSectionProps) {
  if (items.length === 0) return null;

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      data-slot="faq-section"
      className="scroll-mt-32 space-y-4 lg:scroll-mt-24"
    >
      <h2 id="faq-heading" className="font-heading text-xl font-semibold tracking-tight">
        Questions and answers
      </h2>

      <div className="rounded-2xl border border-border bg-card px-5 py-1 text-card-foreground">
        <Accordion multiple={false}>
          {items.map((item, index) => (
            <AccordionItem key={`${index}-${item.question}`} value={`faq-${index}`}>
              <AccordionTrigger className="min-h-12 py-3.5 text-base font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

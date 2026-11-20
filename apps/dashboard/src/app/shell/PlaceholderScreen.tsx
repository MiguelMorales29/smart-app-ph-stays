import { Link } from '@tanstack/react-router';
import { HammerIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';

/**
 * A page we haven't built yet. `phase` is shown only on /kit/routes (Pattern Guide §3.10: no
 * developer text on real pages).
 */
export function PlaceholderScreen({
  title,
  detail,
  secondaryLink,
}: {
  readonly title: string;
  readonly phase?: number | undefined;
  readonly detail?: string | undefined;
  readonly secondaryLink?: { readonly to: string; readonly label: string } | undefined;
}) {
  return (
    <section className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight max-md:sr-only">{title}</h1>
      <EmptyState
        icon={<HammerIcon />}
        title="Coming soon"
        description={detail ?? "We're still building this page. Everything else in the menu works."}
        action={
          secondaryLink ? (
            <Button
              variant="outline"
              className="min-h-11 sm:min-h-9"
              nativeButton={false}
              render={<Link to={secondaryLink.to} />}
            >
              {secondaryLink.label}
            </Button>
          ) : undefined
        }
      />
    </section>
  );
}

import { Link } from '@tanstack/react-router';
import { Button } from '@smartapp/ui/components/button';

export function PlaceholderScreen({
  title,
  phase,
  detail,
  secondaryLink,
}: {
  readonly title: string;
  readonly phase: number;
  readonly detail?: string | undefined;
  readonly secondaryLink?: { readonly to: string; readonly label: string } | undefined;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Coming in phase {phase}</p>
        {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      {secondaryLink ? (
        <div>
          <Button
            variant="outline"
            className="min-h-11 sm:min-h-9"
            nativeButton={false}
            render={<Link to={secondaryLink.to} />}
          >
            {secondaryLink.label}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

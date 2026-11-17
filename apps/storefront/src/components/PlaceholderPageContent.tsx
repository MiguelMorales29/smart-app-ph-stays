export function PlaceholderPageContent({
  title,
  phase,
  detail,
}: {
  readonly title: string;
  readonly phase: number;
  readonly detail?: string;
}) {
  return (
    <section className="space-y-2">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">Coming in phase {phase}</p>
      {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
    </section>
  );
}

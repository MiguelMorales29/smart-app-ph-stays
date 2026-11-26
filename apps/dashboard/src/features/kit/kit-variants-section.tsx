import { lazy, Suspense, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { Badge } from '@smartapp/ui/components/badge';
import { Button } from '@smartapp/ui/components/button';
import { Label } from '@smartapp/ui/components/label';
import { Switch } from '@smartapp/ui/components/switch';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { cn } from '@smartapp/ui/lib/utils';

import { KIT_VARIANT_GROUPS, type KitVariantGroup } from './kit-variants-registry';

/*
 * Raw ReUI example variants (UI-6), grouped under their base component. Each group stays closed until
 * someone opens it, so the kit page, its screenshots and the accessibility scan only load the base
 * components; opening a group loads just that group's examples. Screens never import these files
 * (tooling/kit-examples.test.ts): they use a named variant or a composition instead.
 */

const AREA_LABELS: Record<string, string> = {
  buttons: 'Buttons and badges',
  inputs: 'Inputs',
  pickers: 'Pickers',
  calendar: 'Calendars',
  'photos-files': 'Photos and files',
  lists: 'Lists and tables',
  feedback: 'Feedback',
  navigation: 'Navigation',
  'chat-money': 'Conversation',
};

/** Areas wide enough to need the full row for each example. */
const WIDE_AREAS = new Set(['lists', 'calendar']);

type LoadedVariant = {
  readonly name: string;
  readonly Example: LazyExoticComponent<ComponentType>;
};

/** One lazy component per example, made once at module load (never during render). */
const LAZY_VARIANTS: ReadonlyMap<string, LoadedVariant> = new Map(
  KIT_VARIANT_GROUPS.flatMap((group) =>
    group.items.map((item) => [
      item.name,
      {
        name: item.name,
        Example: lazy(() => item.load().then((module) => ({ default: module.Pattern }))),
      },
    ]),
  ),
);

function VariantTile({ variant }: { readonly variant: LoadedVariant }) {
  return (
    <figure className="min-w-0 space-y-2 rounded-xl border border-border bg-card p-4">
      <figcaption className="text-xs text-muted-foreground tabular">{variant.name}</figcaption>
      <div className="flex min-h-16 min-w-0 items-center justify-center overflow-x-auto">
        <Suspense fallback={<Skeleton className="h-16 w-full" />}>
          <variant.Example />
        </Suspense>
      </div>
    </figure>
  );
}

function VariantGroup({ group }: { readonly group: KitVariantGroup }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const switchId = `variants-dark-${group.area}-${group.component}`;
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-medium text-foreground">{group.component}</p>
        <Badge variant="secondary">{group.items.length} variants</Badge>
        <Button
          variant="outline"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Hide variants' : 'Show variants'}
        </Button>
        {open ? (
          <div className="flex items-center gap-2">
            <Switch id={switchId} checked={dark} onCheckedChange={setDark} />
            <Label htmlFor={switchId}>Dark</Label>
          </div>
        ) : null}
      </div>
      {open ? (
        <div className={cn('rounded-xl p-3', dark ? 'dark bg-background' : 'bg-muted')}>
          <div className={cn('grid gap-3', WIDE_AREAS.has(group.area) ? '' : 'lg:grid-cols-2')}>
            {group.items.map((item) => {
              const variant = LAZY_VARIANTS.get(item.name);
              return variant ? <VariantTile key={item.name} variant={variant} /> : null;
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Variant rows for the given areas (Base: buttons; Forms: inputs, pickers, calendars; Patterns: the rest). */
export function KitVariantsSection({ areas }: { readonly areas: readonly string[] }) {
  return (
    <section className="space-y-6" aria-labelledby="kit-variants-heading">
      <div className="space-y-1">
        <h2 id="kit-variants-heading" className="font-heading text-lg font-semibold">
          Variants (UI-6)
        </h2>
        <p className="text-sm text-muted-foreground">
          ReUI example variants under their base component. Open a row to load it. Pick one for a
          screen by turning it into a named variant or a composition first.
        </p>
      </div>
      {areas.map((area) => {
        const groups = KIT_VARIANT_GROUPS.filter((group) => group.area === area);
        if (groups.length === 0) return null;
        const total = groups.reduce((sum, group) => sum + group.items.length, 0);
        return (
          <div key={area} className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              {AREA_LABELS[area] ?? area} <span className="text-muted-foreground">· {total}</span>
            </h3>
            {groups.map((group) => (
              <VariantGroup key={`${group.area}-${group.component}`} group={group} />
            ))}
          </div>
        );
      })}
    </section>
  );
}

import { useId, useMemo, useState } from 'react';
import { Building2Icon, CheckIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@smartapp/ui/components/button';
import { Input } from '@smartapp/ui/components/input';
import { AmenityGlyph } from '@smartapp/ui/compositions/amenity-glyph';

export interface AmenityOption {
  readonly id: string;
  readonly label: string;
  /** Lucide icon name, or "emoji:…" for an owner's own amenity (D93). */
  readonly icon: string;
  /** Marks the owner's own amenity. */
  readonly own?: boolean | undefined;
  /** Group heading ("Comfort", "Kitchen"). */
  readonly group: string;
}

export interface AmenityChipsProps {
  readonly options: readonly AmenityOption[];
  readonly value: readonly string[];
  readonly onValueChange: (ids: string[]) => void;
  /** Adds an owner's own amenity; omit to hide "Add your own". */
  readonly onAddOwn?: ((label: string) => void) | undefined;
  /** Already given by the property ("At the property"): shown ticked and can't be changed here. */
  readonly locked?: readonly string[] | undefined;
  /** Why locked chips can't be changed, shown under the list. */
  readonly lockedNote?: string | undefined;
  readonly className?: string | undefined;
}

/**
 * Grouped amenity chips with search and "Add your own" (Phase 4 plan, section 7). Each chip is a
 * real checkbox, so the keyboard and screen readers work as on any form.
 */
export function AmenityChips({
  options,
  value,
  onValueChange,
  onAddOwn,
  locked,
  lockedNote,
  className,
}: AmenityChipsProps) {
  const lockedSet = useMemo(() => new Set(locked ?? []), [locked]);
  const [query, setQuery] = useState('');
  const [own, setOwn] = useState('');
  const searchId = useId();
  const selected = useMemo(() => new Set(value), [value]);
  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const map = new Map<string, AmenityOption[]>();
    for (const option of options) {
      if (needle && !option.label.toLowerCase().includes(needle)) continue;
      const list = map.get(option.group) ?? [];
      list.push(option);
      map.set(option.group, list);
    }
    return [...map.entries()];
  }, [options, query]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onValueChange([...next]);
  }

  return (
    <div data-slot="amenity-chips" className={cn('flex flex-col gap-4', className)}>
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Search amenities
        </label>
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={searchId}
          type="search"
          placeholder="Search amenities"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-8"
        />
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No amenity matches "{query}".</p>
      ) : null}
      {groups.map(([group, items]) => (
        <fieldset key={group} className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-foreground">{group}</legend>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => {
              const isLocked = lockedSet.has(item.id);
              const checked = isLocked || selected.has(item.id);
              return (
                <label
                  key={item.id}
                  className={cn(
                    // Pattern Guide §3.5: tint, a blue ring and a check when picked.
                    'press inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm transition-colors duration-fast pointer-coarse:min-h-11',
                    isLocked && 'cursor-default border-dashed',
                    'has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                    checked
                      ? 'border-primary bg-primary-tint font-semibold text-foreground shadow-[inset_0_0_0_0.5px_var(--primary)]'
                      : 'border-input bg-card text-foreground hover-hover:hover:bg-muted',
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    disabled={isLocked}
                    onChange={() => toggle(item.id)}
                  />
                  {isLocked ? (
                    <Building2Icon aria-hidden="true" className="size-4 text-primary" />
                  ) : checked ? (
                    <CheckIcon aria-hidden="true" className="size-4 text-primary" />
                  ) : (
                    <AmenityGlyph icon={item.icon} className="text-muted-foreground" />
                  )}
                  {item.label}
                  {isLocked ? <span className="sr-only">(at the property)</span> : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      {lockedSet.size > 0 && lockedNote ? (
        <p className="text-sm text-muted-foreground">{lockedNote}</p>
      ) : null}
      {onAddOwn ? (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const label = own.trim();
            if (!label) return;
            onAddOwn(label);
            setOwn('');
          }}
        >
          <label className="sr-only" htmlFor={`${searchId}-own`}>
            Add your own amenity
          </label>
          <Input
            id={`${searchId}-own`}
            placeholder="Add your own (e.g. Karaoke)"
            value={own}
            maxLength={80}
            onChange={(event) => setOwn(event.target.value)}
          />
          <Button type="submit" variant="outline" className="min-h-8 pointer-coarse:min-h-11">
            <PlusIcon aria-hidden="true" />
            Add
          </Button>
        </form>
      ) : null}
    </div>
  );
}

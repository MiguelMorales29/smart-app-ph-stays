import { createElement } from 'react';
import { Link } from '@tanstack/react-router';
import { ACTIVE_WAVE, SETTINGS_NAV_ITEMS } from '@/app/nav-config';

export function SettingsIndexPage() {
  const items = SETTINGS_NAV_ITEMS.filter((item) => item.wave <= ACTIVE_WAVE);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Coming in phase 4</p>
      </div>

      <nav aria-label="Settings sections" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-card-foreground transition-colors hover:bg-accent"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              {createElement(item.icon, { className: 'size-4', 'aria-hidden': true })}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">Phase {item.phase}</p>
            </div>
          </Link>
        ))}
      </nav>
    </section>
  );
}

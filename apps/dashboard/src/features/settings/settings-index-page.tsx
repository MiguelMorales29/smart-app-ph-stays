import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { SettingsHubList, useWideSettings } from './settings-nav';

/**
 * /settings (OW-12, OW-23–25): grouped rows with each setting's current value. From 1,024 px the
 * list sits beside the page, so the hub opens Property details.
 */
export function SettingsIndexPage() {
  const wide = useWideSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (wide) void navigate({ to: '/settings/property', replace: true });
  }, [navigate, wide]);

  return (
    <section className="mx-auto max-w-xl space-y-6 pb-16">
      <h1 className="font-heading text-2xl font-semibold tracking-tight max-md:sr-only">
        Settings
      </h1>
      <SettingsHubList />
    </section>
  );
}

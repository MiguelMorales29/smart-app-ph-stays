/**
 * D63: the dashboard's account menu opens the Preview panel on phones. This tiny module keeps the
 * event name in one place without pulling the panel itself into production bundles.
 */
export const DEV_PANEL_OPEN_EVENT = 'smartapp:open-dev-panel';

/** Opens the Preview panel from anywhere, e.g. an account menu item. */
export function openDevPanel(): void {
  window.dispatchEvent(new Event(DEV_PANEL_OPEN_EVENT));
}

import { useEffect, useId, useRef, useState } from 'react';
import { FlaskConicalIcon, XIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { DEV_PANEL_OPEN_EVENT } from '@smartapp/ui/lib/dev-panel';

export interface DevSwitchOption {
  readonly value: string;
  readonly label: string;
}

export interface DevSwitchField {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly options: readonly DevSwitchOption[];
  readonly onChange: (value: string) => void;
}

export interface DevSwitchPanelProps {
  /** Short summary shown on the closed pill, e.g. the current scenario. */
  readonly summary: string;
  readonly fields: readonly DevSwitchField[];
  /** Marker attribute that the production build scan looks for. */
  readonly marker: string;
}

const HIDDEN_KEY = 'smartapp-dev-pill-hidden';

function readHidden(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const clean = params.get('clean');
    if (clean === '1') {
      window.sessionStorage.setItem(HIDDEN_KEY, '1');
      return true;
    }
    if (clean === '0') {
      window.sessionStorage.removeItem(HIDDEN_KEY);
      return false;
    }
    return window.sessionStorage.getItem(HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Floating developer switches for preview and local builds.
 * A small "Preview" pill sits in the bottom-right corner, above any bottom dock
 * or sticky action bar, and opens a themed panel. It never takes space in the layout.
 * `?clean=1` hides it for the browser tab (for screen recordings); `?clean=0` brings it back.
 * D63: on phones the pill hides itself when the page has an element marked `data-dev-panel-menu`
 * (the dashboard's account menu button); that menu opens the panel with `openDevPanel()`.
 */

export function DevSwitchPanel({ summary, fields, marker }: DevSwitchPanelProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(DEV_PANEL_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(DEV_PANEL_OPEN_EVENT, onOpen);
  }, []);
  // Only ever mounted in the browser (the switch gates load it after hydration).
  const [hidden] = useState(readHidden);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        pillRef.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || pillRef.current?.contains(target)) return;
      setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    panelRef.current?.querySelector('select')?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  if (hidden) return null;

  return (
    <div data-switch-marker={marker} data-slot="dev-switch-panel" className="dev-pill-anchor">
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Developer switches"
          className="mb-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <FlaskConicalIcon aria-hidden="true" className="size-4 text-warning" />
              Preview · sample data
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label="Close developer switches"
              onClick={() => {
                setOpen(false);
                pillRef.current?.focus();
              }}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
          <div className="flex flex-col gap-2.5">
            {fields.map((field) => (
              <label key={field.id} className="flex flex-col gap-1 text-xs text-muted-foreground">
                {field.label}
                <select
                  aria-label={field.label}
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Add <code className="font-mono">?clean=1</code> to the link to hide this for recordings.
          </p>
        </div>
      ) : null}
      <button
        ref={pillRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        data-dev-pill=""
        className="pressable flex h-11 max-w-[min(16rem,calc(100vw-2rem))] items-center gap-1.5 rounded-full border border-border bg-popover px-3.5 text-xs font-medium text-popover-foreground shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <FlaskConicalIcon aria-hidden="true" className="size-4 shrink-0 text-warning" />
        <span className="shrink-0">Preview</span>
        <span aria-hidden="true" className="hidden text-muted-foreground sm:inline">
          ·
        </span>
        <span className="hidden truncate text-muted-foreground sm:inline">{summary}</span>
        <span className="sr-only sm:hidden">{summary}</span>
      </button>
    </div>
  );
}

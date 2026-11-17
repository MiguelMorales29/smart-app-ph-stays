import { useEffect, useState } from 'react';

import type { ErrorCode } from '@smartapp/core';
import type * as SwitchesModule from '@smartapp/data/switches';
import type {
  ClockKey,
  ClockOption,
  ScenarioKey,
  ScenarioOption,
  SwitchState,
  ViewAsKey,
  ViewAsOption,
} from '@smartapp/data/switches';

interface LoadedSwitchUi {
  readonly marker: string;
  readonly viewAsOptions: readonly ViewAsOption[];
  readonly scenarioOptions: readonly ScenarioOption[];
  readonly clockOptions: readonly ClockOption[];
  readonly errorCodeOptions: readonly ErrorCode[];
  readonly state: SwitchState;
  readonly controller: typeof SwitchesModule;
}

export function DashboardSwitchBar() {
  const [loaded, setLoaded] = useState<LoadedSwitchUi | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      const controller = await import('@smartapp/data/switches');
      if (!active) return;

      const state = controller.resolveInitialSwitchState(
        window.location.search,
        window.sessionStorage,
        { as: 'owner:ulap-suites' },
      );
      const clock = controller.resolveSwitchClock(state.clock);
      setLoaded({
        marker: controller.SWITCH_BAR_MARKER,
        viewAsOptions: controller.getSwitchViewAsOptions(clock),
        scenarioOptions: controller.getSwitchScenarioOptions(),
        clockOptions: controller.getSwitchClockOptions(),
        errorCodeOptions: controller.getSwitchErrorCodeOptions(),
        state,
        controller,
      });
    }

    void init();
    return () => {
      active = false;
    };
  }, []);

  if (!loaded) {
    return null;
  }

  function applyNextState(next: SwitchState) {
    if (!loaded) return;
    loaded.controller.saveSwitchStateToStorage(window.sessionStorage, next);
    const nextSearch = loaded.controller.serializeSwitchStateToSearch(next, window.location.search);
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
    setLoaded({ ...loaded, state: next });
    window.dispatchEvent(new Event('smartapp:switch-change'));
  }

  return (
    <aside
      aria-label="Developer view and scenario switches"
      data-switch-marker={loaded.marker}
      style={{
        padding: '8px',
        borderBottom: '1px solid #d4d4d8',
        backgroundColor: '#f4f4f5',
        fontSize: '13px',
      }}
    >
      <strong>Dev Switches</strong>{' '}
      <label>
        View as:{' '}
        <select
          aria-label="View as"
          value={loaded.state.as}
          onChange={(event) => {
            const nextAs = loaded.controller.viewAsKeySchema.safeParse(event.target.value);
            if (nextAs.success) {
              applyNextState({ ...loaded.state, as: nextAs.data satisfies ViewAsKey });
            }
          }}
        >
          {loaded.viewAsOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>{' '}
      <label>
        Scenario:{' '}
        <select
          aria-label="Scenario"
          value={loaded.state.pack}
          onChange={(event) => {
            const nextPack = loaded.controller.scenarioKeySchema.safeParse(event.target.value);
            if (nextPack.success) {
              applyNextState({ ...loaded.state, pack: nextPack.data satisfies ScenarioKey });
            }
          }}
        >
          {loaded.scenarioOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>{' '}
      <label>
        Clock:{' '}
        <select
          aria-label="Clock"
          value={loaded.state.clock}
          onChange={(event) => {
            const nextClock = loaded.controller.clockKeySchema.safeParse(event.target.value);
            if (nextClock.success) {
              applyNextState({ ...loaded.state, clock: nextClock.data satisfies ClockKey });
            }
          }}
        >
          {loaded.clockOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>{' '}
      {loaded.state.pack === 'error' ? (
        <label>
          Error code:{' '}
          <select
            aria-label="Error code"
            value={loaded.state.errorCode}
            onChange={(event) => {
              const found = loaded.errorCodeOptions.find((code) => code === event.target.value);
              if (found) {
                applyNextState({ ...loaded.state, errorCode: found });
              }
            }}
          >
            {loaded.errorCodeOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </aside>
  );
}

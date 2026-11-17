'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type * as SwitchesModule from '@smartapp/data/switches';
import { DevSwitchPanel, type DevSwitchField } from '@smartapp/ui/compositions/dev-switch-panel';
import type {
  ClockKey,
  ClockOption,
  ScenarioKey,
  ScenarioOption,
  SwitchState,
  ViewAsKey,
  ViewAsOption,
} from '@smartapp/data/switches';
import type { ErrorCode } from '@smartapp/core';

interface LoadedSwitchUi {
  readonly marker: string;
  readonly viewAsOptions: readonly ViewAsOption[];
  readonly scenarioOptions: readonly ScenarioOption[];
  readonly clockOptions: readonly ClockOption[];
  readonly errorCodeOptions: readonly ErrorCode[];
  readonly state: SwitchState;
  readonly controller: typeof SwitchesModule;
}

export function StorefrontSwitchBar() {
  const router = useRouter();
  const [loaded, setLoaded] = useState<LoadedSwitchUi | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      const controller = await import('@smartapp/data/switches');
      if (!active) return;

      const state = controller.resolveInitialSwitchState(
        window.location.search,
        window.sessionStorage,
      );
      document.cookie = controller.serializeSwitchStateCookie(state);
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
    document.cookie = loaded.controller.serializeSwitchStateCookie(next);
    const nextSearch = loaded.controller.serializeSwitchStateToSearch(next, window.location.search);
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
    setLoaded({ ...loaded, state: next });
    window.dispatchEvent(new Event('smartapp:switch-change'));
    router.refresh();
  }

  const state = loaded.state;
  const controller = loaded.controller;
  const scenarioLabel =
    loaded.scenarioOptions.find((option) => option.key === state.pack)?.label ?? state.pack;
  const fields: DevSwitchField[] = [
    {
      id: 'as',
      label: 'View as',
      value: state.as,
      options: loaded.viewAsOptions.map((option) => ({ value: option.key, label: option.label })),
      onChange: (value) => {
        const nextAs = controller.viewAsKeySchema.safeParse(value);
        if (nextAs.success) applyNextState({ ...state, as: nextAs.data satisfies ViewAsKey });
      },
    },
    {
      id: 'pack',
      label: 'Scenario',
      value: state.pack,
      options: loaded.scenarioOptions.map((option) => ({ value: option.key, label: option.label })),
      onChange: (value) => {
        const nextPack = controller.scenarioKeySchema.safeParse(value);
        if (nextPack.success) {
          applyNextState({ ...state, pack: nextPack.data satisfies ScenarioKey });
        }
      },
    },
    {
      id: 'clock',
      label: 'Clock',
      value: state.clock,
      options: loaded.clockOptions.map((option) => ({ value: option.key, label: option.label })),
      onChange: (value) => {
        const nextClock = controller.clockKeySchema.safeParse(value);
        if (nextClock.success) {
          applyNextState({ ...state, clock: nextClock.data satisfies ClockKey });
        }
      },
    },
    ...(state.pack === 'error'
      ? [
          {
            id: 'errorCode',
            label: 'Error code',
            value: state.errorCode,
            options: loaded.errorCodeOptions.map((code) => ({ value: code, label: code })),
            onChange: (value: string) => {
              const found = loaded.errorCodeOptions.find((code) => code === value);
              if (found) applyNextState({ ...state, errorCode: found });
            },
          },
        ]
      : []),
  ];

  return <DevSwitchPanel marker={loaded.marker} summary={scenarioLabel} fields={fields} />;
}

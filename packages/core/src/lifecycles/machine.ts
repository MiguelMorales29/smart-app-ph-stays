export interface LifecycleMove<S extends string, A extends string> {
  readonly from: S | null;
  readonly to: S;
  readonly by: A;
}

export type LifecycleMachine<S extends string, A extends string> = readonly LifecycleMove<S, A>[];

export function canMove<S extends string, A extends string>(
  machine: LifecycleMachine<S, A>,
  from: S | null,
  to: S,
  actor: A,
): boolean {
  return machine.some((move) => move.from === from && move.to === to && move.by === actor);
}

export function nextStates<S extends string, A extends string>(
  machine: LifecycleMachine<S, A>,
  from: S | null,
  actor?: A,
): readonly S[] {
  const states: S[] = [];

  for (const move of machine) {
    if (move.from !== from) {
      continue;
    }
    if (actor !== undefined && move.by !== actor) {
      continue;
    }
    if (!states.includes(move.to)) {
      states.push(move.to);
    }
  }

  return states;
}

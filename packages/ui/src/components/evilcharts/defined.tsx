/**
 * Drops `undefined` values before props reach a library type that does not accept them under
 * `exactOptionalPropertyTypes` (recharts' own prop types). Keys whose value may be undefined become
 * optional; the rest keep their types. Used by the evilcharts files (UI-5); kept here because it needs a type assertion, which eslint allows only under components/.
 */
export type Defined<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

export function defined<T extends object>(props: T): Defined<T> {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as Defined<T>;
}

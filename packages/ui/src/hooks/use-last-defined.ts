import { useState } from 'react';

/**
 * Returns the value, or the last value that wasn't null/undefined. Use it for a sheet or dialog
 * whose data is cleared when it closes, so its content doesn't blank out or change while the close
 * animation plays (Pattern Guide §2: never remove content while it animates).
 */
export function useLastDefined<T>(value: T | null | undefined): T | null | undefined {
  const [last, setLast] = useState(value);
  if (value !== null && value !== undefined && value !== last) setLast(value);
  return value ?? last;
}

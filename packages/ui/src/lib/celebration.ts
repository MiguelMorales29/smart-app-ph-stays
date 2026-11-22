const SEEN_PREFIX = 'smartapp-celebrated:';

export interface ConfettiOrigin {
  /** Horizontal viewport fraction (0..1). */
  readonly x: number;
  /** Vertical viewport fraction (0..1). */
  readonly y: number;
}

function alreadyCelebrated(key: string): boolean {
  try {
    return window.localStorage.getItem(SEEN_PREFIX + key) !== null;
  } catch {
    return false;
  }
}

function markCelebrated(key: string): void {
  try {
    window.localStorage.setItem(SEEN_PREFIX + key, new Date().toISOString());
  } catch {
    // ignore: at worst the owner sees confetti twice
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function readThemeConfettiColors(): string[] {
  const styles = getComputedStyle(document.documentElement);
  return ['--primary', '--brand-accent', '--warning', '--info']
    .map((name) => styles.getPropertyValue(name).trim())
    .filter((value) => value.length > 0);
}

/**
 * One confetti burst for a milestone (D53: the go-live moment), once per key per device.
 * canvas-confetti loads only when this runs. Under reduced motion nothing moves; the
 * screen's still message carries the moment. Colours come from the theme tokens.
 */
export async function celebrate(key: string): Promise<boolean> {
  if (typeof window === 'undefined' || alreadyCelebrated(key)) return false;
  markCelebrated(key);
  if (prefersReducedMotion()) return false;
  const { default: confetti } = await import('canvas-confetti');
  const colors = readThemeConfettiColors();
  await confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    origin: { y: 0.65 },
    ticks: 160,
    disableForReducedMotion: true,
    ...(colors.length > 0 ? { colors } : {}),
  });
  return true;
}

/** Small confetti burst at a specific viewport point (e.g. a completed milestone or badge). */
export async function confettiBurst(origin: ConfettiOrigin = { x: 0.5, y: 0.6 }): Promise<void> {
  if (prefersReducedMotion()) return;
  const { default: confetti } = await import('canvas-confetti');
  const colors = readThemeConfettiColors();
  await confetti({
    particleCount: 24,
    spread: 48,
    startVelocity: 24,
    scalar: 0.75,
    ticks: 90,
    origin,
    zIndex: 70,
    disableForReducedMotion: true,
    ...(colors.length > 0 ? { colors } : {}),
  });
}

/** Dual side-cannon confetti burst for major unlocks. */
export async function confettiSideCannons(): Promise<void> {
  if (prefersReducedMotion()) return;
  const { default: confetti } = await import('canvas-confetti');
  const colors = readThemeConfettiColors();
  const shared = {
    particleCount: 60,
    spread: 60,
    startVelocity: 45,
    ticks: 160,
    zIndex: 70,
    disableForReducedMotion: true,
    ...(colors.length > 0 ? { colors } : {}),
  };
  await Promise.all([
    confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.7 } }),
    confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.7 } }),
  ]);
}

/** For tests and the /kit page: lets the burst play again on this device. */
export function resetCelebration(key: string): void {
  try {
    window.localStorage.removeItem(SEEN_PREFIX + key);
  } catch {
    // ignore
  }
}

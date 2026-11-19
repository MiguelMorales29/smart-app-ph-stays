const SEEN_PREFIX = 'smartapp-celebrated:';

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

/**
 * One confetti burst for a milestone (D53: the go-live moment), once per key per device.
 * canvas-confetti (4 KB) loads only when this runs. Under reduced motion nothing moves; the
 * screen's still message carries the moment. Colours come from the theme tokens.
 */
export async function celebrate(key: string): Promise<boolean> {
  if (typeof window === 'undefined' || alreadyCelebrated(key)) return false;
  markCelebrated(key);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const { default: confetti } = await import('canvas-confetti');
  const styles = getComputedStyle(document.documentElement);
  const colors = ['--primary', '--brand-accent', '--warning', '--info']
    .map((name) => styles.getPropertyValue(name).trim())
    .filter((value) => value.length > 0);
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

/** For tests and the /kit page: lets the burst play again on this device. */
export function resetCelebration(key: string): void {
  try {
    window.localStorage.removeItem(SEEN_PREFIX + key);
  } catch {
    // ignore
  }
}

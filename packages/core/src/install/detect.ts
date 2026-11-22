import { z } from 'zod';

export const IN_APP_BROWSERS = ['facebook', 'messenger', 'instagram', 'tiktok'] as const;
export const inAppBrowserSchema = z.enum(IN_APP_BROWSERS);
export type InAppBrowser = z.infer<typeof inAppBrowserSchema>;

export const INSTALL_PLATFORMS = [
  'installed',
  'in_app',
  'prompt',
  'ios_safari_26',
  'ios_safari_legacy',
  'ios_chrome',
  'other',
] as const;
export const installPlatformSchema = z.enum(INSTALL_PLATFORMS);
export type InstallPlatform = z.infer<typeof installPlatformSchema>;

export const INSTALL_DISMISS_DAYS = 30;
export const SHORT_APP_NAME_MAX = 12;

const DAY_MS = 86_400_000;

export interface DetectInstallInput {
  readonly standalone: boolean;
  readonly hasPrompt: boolean;
  readonly userAgent: string;
  readonly maxTouchPoints?: number | undefined;
}

export interface InstallDetection {
  readonly platform: InstallPlatform;
  readonly inAppBrowser: InAppBrowser | null;
  readonly iosVersion: number | null;
  readonly isIos: boolean;
}

export interface InstallNudgeInput {
  readonly platform: InstallPlatform;
  readonly visitCount: number;
  readonly confirmedBooking?: boolean | undefined;
  readonly dismissedAt: string | null;
  readonly nowMs: number;
}

/** Detects social in-app browsers that cannot install PWAs directly (D76). */
export function detectInAppBrowser(userAgent: string): InAppBrowser | null {
  if (/FBAN\/Messenger|Messenger(?:Lite|ForiOS|iOS|\/)|Orca-Android/i.test(userAgent)) {
    return 'messenger';
  }
  if (/Instagram/i.test(userAgent)) {
    return 'instagram';
  }
  if (/BytedanceWebview|TikTok|musical_ly|Trill/i.test(userAgent)) {
    return 'tiktok';
  }
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(userAgent)) {
    return 'facebook';
  }
  return null;
}

/** True on iPhone, iPad, iPod, and desktop-mode iPadOS Safari (`Macintosh` with touch). */
export function isIosDevice(userAgent: string, maxTouchPoints = 0): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true;
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

/**
 * Extracts the major iOS / iPadOS version from the user agent.
 * Handles both `CPU iPhone OS 26_0` and Safari `Version/26.0` (when the OS token is frozen).
 */
export function parseIosVersion(userAgent: string, maxTouchPoints = 0): number | null {
  if (!isIosDevice(userAgent, maxTouchPoints)) return null;

  const osMatch = /(?:iPhone OS|CPU OS|CPU iPhone OS)\s+(\d+)(?:[_.]\d+)?/i.exec(userAgent);
  const osMajor = osMatch?.[1] ? Number.parseInt(osMatch[1], 10) : null;

  const safariVersionMatch =
    !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent) && /Safari\//i.test(userAgent)
      ? /Version\/(\d+)(?:\.\d+)?/i.exec(userAgent)
      : null;
  const safariMajor = safariVersionMatch?.[1] ? Number.parseInt(safariVersionMatch[1], 10) : null;

  if (osMajor !== null && safariMajor !== null) {
    return Math.max(osMajor, safariMajor);
  }
  return osMajor ?? safariMajor;
}

/** True for Chrome on iPhone/iPad (`CriOS`). */
export function isIosChrome(userAgent: string, maxTouchPoints = 0): boolean {
  return (
    isIosDevice(userAgent, maxTouchPoints) &&
    detectInAppBrowser(userAgent) === null &&
    /CriOS\//i.test(userAgent)
  );
}

/** True for Safari on iPhone/iPad (excluding third-party iOS browsers and social webviews). */
export function isIosSafari(userAgent: string, maxTouchPoints = 0): boolean {
  if (!isIosDevice(userAgent, maxTouchPoints)) return false;
  if (detectInAppBrowser(userAgent) !== null) return false;
  if (/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|DuckDuckGo/i.test(userAgent)) return false;
  return /Safari\//i.test(userAgent);
}

/**
 * Classifies how this browser can install the property app (D76, D82).
 * Installed always wins; then social in-app browsers; then native install prompt;
 * then Chrome on iPhone (`CriOS`); then iOS Safari (26+ vs legacy); otherwise `other`.
 */
export function detectInstallPlatform(input: DetectInstallInput): InstallDetection {
  const touchPoints = input.maxTouchPoints ?? 0;
  const isIos = isIosDevice(input.userAgent, touchPoints);
  const iosVersion = parseIosVersion(input.userAgent, touchPoints);
  const inAppBrowser = detectInAppBrowser(input.userAgent);

  if (input.standalone) {
    return { platform: 'installed', inAppBrowser, iosVersion, isIos };
  }
  if (inAppBrowser !== null) {
    return { platform: 'in_app', inAppBrowser, iosVersion, isIos };
  }
  if (input.hasPrompt) {
    return { platform: 'prompt', inAppBrowser: null, iosVersion, isIos };
  }
  if (isIosChrome(input.userAgent, touchPoints)) {
    return { platform: 'ios_chrome', inAppBrowser: null, iosVersion, isIos: true };
  }
  if (isIosSafari(input.userAgent, touchPoints)) {
    const platform: InstallPlatform =
      iosVersion !== null && iosVersion >= 26 ? 'ios_safari_26' : 'ios_safari_legacy';
    return { platform, inAppBrowser: null, iosVersion, isIos: true };
  }
  return { platform: 'other', inAppBrowser: null, iosVersion, isIos };
}

/** Human-friendly label for a detected in-app browser. */
export function inAppBrowserLabel(browser: InAppBrowser): string {
  switch (browser) {
    case 'facebook':
      return 'Facebook';
    case 'messenger':
      return 'Messenger';
    case 'instagram':
      return 'Instagram';
    case 'tiktok':
      return 'TikTok';
  }
}

/** Fits a property name onto a phone home-screen icon label (12 characters by default). */
export function shortAppName(name: string, max = SHORT_APP_NAME_MAX): string {
  const cleaned = name.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= max) return cleaned;
  const firstWord = cleaned.split(' ')[0] ?? cleaned;
  if (firstWord.length >= 3 && firstWord.length <= max) return firstWord;
  return cleaned.slice(0, max).trimEnd();
}

/**
 * Friendly install nudge visibility (D82):
 * never on the first visit (unless a booking was just confirmed), hidden when installed or
 * unsupported, and quiet for 30 days after dismissal.
 */
export function shouldShowInstallNudge(input: InstallNudgeInput): boolean {
  if (input.platform === 'installed' || input.platform === 'other') return false;
  if (input.visitCount < 2 && !input.confirmedBooking) return false;
  if (input.dismissedAt) {
    const dismissedMs = Date.parse(input.dismissedAt);
    if (!Number.isNaN(dismissedMs) && input.nowMs - dismissedMs < INSTALL_DISMISS_DAYS * DAY_MS) {
      return false;
    }
  }
  return true;
}

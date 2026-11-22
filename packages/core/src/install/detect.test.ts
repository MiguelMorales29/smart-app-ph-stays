import { describe, expect, it } from 'vitest';

import {
  INSTALL_DISMISS_DAYS,
  detectInAppBrowser,
  detectInstallPlatform,
  inAppBrowserLabel,
  isIosChrome,
  isIosDevice,
  isIosSafari,
  parseIosVersion,
  shortAppName,
  shouldShowInstallNudge,
} from './detect.js';

const UA_IOS_26_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const UA_IOS_26_FROZEN_OS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1';
const UA_IOS_18_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const UA_IOS_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.33 Mobile/15E148 Safari/604.1';
const UA_IPADOS_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';
const UA_ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36';
const UA_FB_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23A341 [FBAN/FBIOS;FBAV/512.0.0.48.105;FBBV/712345678]';
const UA_MESSENGER_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23A341 [FBAN/MessengerForiOS;FBAV/512.0.0]';
const UA_INSTAGRAM_ANDROID =
  'Mozilla/5.0 (Linux; Android 15; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36 Instagram 380.0.0.40.109';
const UA_TIKTOK_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 BytedanceWebview/d8a21c6';

describe('install detection', () => {
  it('parses iOS versions for iOS 26+, frozen-OS iOS 26 Safari, older iOS, and desktop-mode iPad', () => {
    expect(parseIosVersion(UA_IOS_26_SAFARI)).toBe(26);
    expect(parseIosVersion(UA_IOS_26_FROZEN_OS)).toBe(26);
    expect(parseIosVersion(UA_IOS_18_SAFARI)).toBe(18);
    expect(parseIosVersion(UA_IOS_CHROME)).toBe(26);
    expect(parseIosVersion(UA_IPADOS_DESKTOP, 5)).toBe(26);
    expect(parseIosVersion(UA_IPADOS_DESKTOP, 0)).toBeNull();
    expect(parseIosVersion(UA_ANDROID_CHROME)).toBeNull();
  });

  it('distinguishes iOS Safari from Chrome on iPhone and social in-app browsers', () => {
    expect(isIosDevice(UA_IOS_26_SAFARI)).toBe(true);
    expect(isIosSafari(UA_IOS_26_SAFARI)).toBe(true);
    expect(isIosChrome(UA_IOS_26_SAFARI)).toBe(false);

    expect(isIosChrome(UA_IOS_CHROME)).toBe(true);
    expect(isIosSafari(UA_IOS_CHROME)).toBe(false);

    expect(isIosSafari(UA_FB_IOS)).toBe(false);
    expect(isIosSafari(UA_MESSENGER_IOS)).toBe(false);
    expect(isIosSafari(UA_TIKTOK_IOS)).toBe(false);
  });

  it('detects Facebook, Messenger, Instagram and TikTok in-app browsers', () => {
    expect(detectInAppBrowser(UA_FB_IOS)).toBe('facebook');
    expect(detectInAppBrowser(UA_MESSENGER_IOS)).toBe('messenger');
    expect(detectInAppBrowser(UA_INSTAGRAM_ANDROID)).toBe('instagram');
    expect(detectInAppBrowser(UA_TIKTOK_IOS)).toBe('tiktok');
    expect(detectInAppBrowser(UA_IOS_26_SAFARI)).toBeNull();
    expect(detectInAppBrowser(UA_ANDROID_CHROME)).toBeNull();

    expect(inAppBrowserLabel('facebook')).toBe('Facebook');
    expect(inAppBrowserLabel('messenger')).toBe('Messenger');
    expect(inAppBrowserLabel('instagram')).toBe('Instagram');
    expect(inAppBrowserLabel('tiktok')).toBe('TikTok');
  });

  it('classifies install platforms with standalone and in-app taking precedence', () => {
    expect(
      detectInstallPlatform({
        standalone: true,
        hasPrompt: true,
        userAgent: UA_IOS_26_SAFARI,
      }).platform,
    ).toBe('installed');

    expect(
      detectInstallPlatform({
        standalone: false,
        hasPrompt: true,
        userAgent: UA_INSTAGRAM_ANDROID,
      }),
    ).toMatchObject({ platform: 'in_app', inAppBrowser: 'instagram', isIos: false });

    expect(
      detectInstallPlatform({
        standalone: false,
        hasPrompt: true,
        userAgent: UA_ANDROID_CHROME,
      }).platform,
    ).toBe('prompt');

    expect(
      detectInstallPlatform({
        standalone: false,
        hasPrompt: false,
        userAgent: UA_IOS_26_SAFARI,
      }),
    ).toMatchObject({ platform: 'ios_safari_26', iosVersion: 26, isIos: true });

    expect(
      detectInstallPlatform({
        standalone: false,
        hasPrompt: false,
        userAgent: UA_IOS_18_SAFARI,
      }),
    ).toMatchObject({ platform: 'ios_safari_legacy', iosVersion: 18, isIos: true });

    expect(
      detectInstallPlatform({
        standalone: false,
        hasPrompt: false,
        userAgent: UA_IOS_CHROME,
      }),
    ).toMatchObject({ platform: 'ios_chrome', iosVersion: 26, isIos: true });

    expect(
      detectInstallPlatform({
        standalone: false,
        hasPrompt: false,
        userAgent: UA_ANDROID_CHROME,
      }).platform,
    ).toBe('other');
  });

  it('shortens home-screen app labels cleanly', () => {
    expect(shortAppName('Ulap Suites')).toBe('Ulap Suites');
    expect(shortAppName("Tita Lorna's Dorm")).toBe('Tita');
    expect(shortAppName('Superlongpropertyname')).toBe('Superlongpro');
  });

  it('shows the install nudge only on 2nd visit or after a confirmed booking, respecting 30-day dismiss', () => {
    const now = Date.parse('2026-12-10T10:00:00+08:00');
    const twentyNineDaysAgo = new Date(now - (INSTALL_DISMISS_DAYS - 1) * 86_400_000).toISOString();
    const thirtyOneDaysAgo = new Date(now - (INSTALL_DISMISS_DAYS + 1) * 86_400_000).toISOString();

    expect(
      shouldShowInstallNudge({
        platform: 'ios_safari_26',
        visitCount: 1,
        dismissedAt: null,
        nowMs: now,
      }),
    ).toBe(false);

    expect(
      shouldShowInstallNudge({
        platform: 'ios_safari_26',
        visitCount: 1,
        confirmedBooking: true,
        dismissedAt: null,
        nowMs: now,
      }),
    ).toBe(true);

    expect(
      shouldShowInstallNudge({
        platform: 'ios_safari_26',
        visitCount: 2,
        dismissedAt: null,
        nowMs: now,
      }),
    ).toBe(true);

    expect(
      shouldShowInstallNudge({
        platform: 'ios_safari_26',
        visitCount: 3,
        dismissedAt: twentyNineDaysAgo,
        nowMs: now,
      }),
    ).toBe(false);

    expect(
      shouldShowInstallNudge({
        platform: 'ios_safari_26',
        visitCount: 3,
        dismissedAt: thirtyOneDaysAgo,
        nowMs: now,
      }),
    ).toBe(true);

    expect(
      shouldShowInstallNudge({
        platform: 'installed',
        visitCount: 5,
        dismissedAt: null,
        nowMs: now,
      }),
    ).toBe(false);
  });
});

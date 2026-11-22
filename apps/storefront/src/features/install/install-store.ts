'use client';

import {
  detectInstallPlatform,
  type InstallDetection,
  type InstallPlatform,
} from '@smartapp/core';
import { useSyncExternalStore } from 'react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isInstallPrompt(event: Event): event is InstallPromptEvent {
  return 'prompt' in event && typeof event.prompt === 'function' && 'userChoice' in event;
}

const SERVER_DETECTION: InstallDetection = {
  platform: 'other',
  inAppBrowser: null,
  iosVersion: null,
  isIos: false,
};

let deferredPrompt: InstallPromptEvent | null = null;
let installedHere = false;
let cachedSnapshot: InstallDetection | null = null;
const listeners = new Set<() => void>();

function emit() {
  cachedSnapshot = null;
  for (const listener of listeners) {
    listener();
  }
}

/** Mounted once inside PropertyFrame to capture Chrome's install prompt and completion event. */
export function watchInstall(onInstalled?: () => void): () => void {
  const onPrompt = (event: Event) => {
    if (!isInstallPrompt(event)) return;
    event.preventDefault();
    deferredPrompt = event;
    emit();
  };
  const onAppInstalled = () => {
    deferredPrompt = null;
    installedHere = true;
    emit();
    onInstalled?.();
  };
  window.addEventListener('beforeinstallprompt', onPrompt);
  window.addEventListener('appinstalled', onAppInstalled);
  return () => {
    window.removeEventListener('beforeinstallprompt', onPrompt);
    window.removeEventListener('appinstalled', onAppInstalled);
  };
}

/** Triggers the browser's native install prompt when available. */
export async function promptInstall(): Promise<boolean> {
  const event = deferredPrompt;
  if (!event) return false;
  await event.prompt();
  const choice = await event.userChoice;
  deferredPrompt = null;
  emit();
  return choice.outcome === 'accepted';
}

function hasIosStandalone(nav: object): boolean {
  return 'standalone' in nav && Reflect.get(nav, 'standalone') === true;
}

/** True when opened from the home screen on iOS, Android or desktop. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    hasIosStandalone(window.navigator)
  );
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const media = window.matchMedia('(display-mode: standalone)');
  media.addEventListener('change', listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', listener);
  };
}

function getClientSnapshot(): InstallDetection {
  if (cachedSnapshot) return cachedSnapshot;
  cachedSnapshot = detectInstallPlatform({
    standalone: installedHere || isStandaloneDisplay(),
    hasPrompt: deferredPrompt !== null,
    userAgent: window.navigator.userAgent,
    maxTouchPoints: window.navigator.maxTouchPoints,
  });
  return cachedSnapshot;
}

/** Live install detection for the current browser; safe during Next.js SSR. */
export function useInstallDetection(): InstallDetection {
  return useSyncExternalStore(subscribe, getClientSnapshot, () => SERVER_DETECTION);
}

export function useInstallPlatform(): InstallPlatform {
  return useInstallDetection().platform;
}

function visitKey(slug: string): string {
  return `smartapp:visits:${slug}`;
}

function sessionVisitKey(slug: string): string {
  return `smartapp:session-visited:${slug}`;
}

function dismissKey(slug: string): string {
  return `smartapp:install-dismissed:${slug}`;
}

/** Increments visit count at most once per browser tab session and returns the total visits. */
export function recordPropertyVisit(slug: string): number {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = window.localStorage.getItem(visitKey(slug));
    const current = raw ? Number.parseInt(raw, 10) : 0;
    const safeCurrent = Number.isFinite(current) && current > 0 ? current : 0;
    if (window.sessionStorage.getItem(sessionVisitKey(slug)) === '1') {
      return Math.max(1, safeCurrent);
    }
    const next = safeCurrent + 1;
    window.localStorage.setItem(visitKey(slug), String(next));
    window.sessionStorage.setItem(sessionVisitKey(slug), '1');
    return next;
  } catch {
    return 1;
  }
}

export function readInstallDismissedAt(slug: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(dismissKey(slug));
  } catch {
    return null;
  }
}

export function dismissInstallNudge(slug: string, at: Date = new Date()): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(dismissKey(slug), at.toISOString());
  } catch {
    // Ignore storage quota / private mode failures.
  }
}

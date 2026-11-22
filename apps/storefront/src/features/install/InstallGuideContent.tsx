'use client';

import { inAppBrowserLabel, type InAppBrowser, type InstallPlatform } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
} from '@smartapp/ui/components/stepper';
import { Switch } from '@smartapp/ui/components/switch';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import {
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  PlusIcon,
  ShareIcon,
  SmartphoneIcon,
  SquarePlusIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { promptInstall, useInstallDetection } from './install-store';
import {
  SafariRealCornerPointer,
  SafariStep1Drawing,
  SafariStep2Drawing,
  SafariStep3Drawing,
  SafariStep4Drawing,
} from './SafariStepDrawings';

type FallbackGuideTab = 'ios_26' | 'ios_legacy' | 'android';

export interface InstallGuideContentProps {
  readonly slug: string;
  readonly propertyName: string;
  readonly logoSrc: string | null;
  /** Optional platform override (useful on the `/install` page or tests). */
  readonly previewPlatform?: InstallPlatform | undefined;
  readonly previewInAppBrowser?: InAppBrowser | null | undefined;
  readonly showCornerPointer?: boolean | undefined;
  readonly onInstalled?: (() => void) | undefined;
}

/**
 * Full install guide (D76, D82):
 * - iOS 26 Safari: 4-step vertical Stepper with Safari drawings, pulsing arrow, address-bar toggle,
 *   and "Can't see it? Scroll the list, or tap Edit Actions" under step 3.
 * - Older iOS Safari (<26): 3-step bottom Share guide.
 * - Chrome on iPhone (`CriOS`): 3-step top-right Share guide.
 * - Facebook / Messenger / Instagram / TikTok in-app browser: "Open in Safari or Chrome to install" + Copy link.
 * - Android Chrome: one-tap native install prompt.
 * - Desktop / other browsers: switcher to read iPhone (iOS 26), older iPhone, or Android steps.
 */
export function InstallGuideContent({
  slug,
  propertyName,
  logoSrc,
  previewPlatform,
  previewInAppBrowser,
  showCornerPointer = false,
  onInstalled,
}: InstallGuideContentProps) {
  const detected = useInstallDetection();
  const platform = previewPlatform ?? detected.platform;
  const inAppBrowser =
    previewInAppBrowser !== undefined ? previewInAppBrowser : detected.inAppBrowser;

  const [addressBarAtTop, setAddressBarAtTop] = useState(false);
  const [fallbackTab, setFallbackTab] = useState<FallbackGuideTab>('ios_26');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 2400);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  async function handleCopyLink() {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/${slug}`
        : `https://smartapp.webserbisyo.com/${slug}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopyState('copied');
        return;
      } catch {
        // Fall through to failed state.
      }
    }
    setCopyState('failed');
  }

  async function handleNativeInstall() {
    setInstalling(true);
    try {
      const accepted = await promptInstall();
      if (accepted) {
        onInstalled?.();
      }
    } finally {
      setInstalling(false);
    }
  }

  if (platform === 'installed') {
    return (
      <div
        data-slot="install-guide-installed"
        className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-success-tint text-success">
          <CheckCircle2Icon aria-hidden="true" className="size-6" />
        </span>
        <p className="font-heading text-base font-semibold">{propertyName} is installed</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          You&apos;re already using the installed app from your Home Screen.
        </p>
      </div>
    );
  }

  if (platform === 'in_app') {
    const appLabel = inAppBrowser ? inAppBrowserLabel(inAppBrowser) : 'this app';
    return (
      <div data-slot="install-guide-in-app" className="space-y-4">
        <div className="space-y-2 rounded-2xl border border-warning/30 bg-warning-tint p-4 text-foreground">
          <div className="flex items-start gap-2.5">
            <ExternalLinkIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <div className="space-y-1">
              <p className="font-heading text-base font-semibold">
                Open in Safari or Chrome to install
              </p>
              <p className="text-sm leading-relaxed text-foreground/90">
                You opened this link inside {appLabel}. Its built-in browser can&apos;t add apps to
                your Home Screen.
              </p>
            </div>
          </div>
        </div>

        <Stepper
          defaultValue={1}
          orientation="vertical"
          aria-label="Open in Safari or Chrome steps"
        >
          <StepperNav className="w-full gap-0">
            <StepperItem step={1} className="relative items-start">
              <div className="flex w-full items-start gap-3 pb-4">
                <StepperIndicator className="size-8 rounded-full bg-primary text-primary-foreground">
                  1
                </StepperIndicator>
                <div className="flex-1 space-y-1 pt-0.5">
                  <StepperTitle className="text-sm font-semibold">Copy this page link</StepperTitle>
                  <StepperDescription className="text-sm">
                    Tap the button below, or tap the menu in {appLabel} and choose Open in browser.
                  </StepperDescription>
                </div>
              </div>
              <StepperSeparator className="absolute top-9 bottom-1 left-4 m-0 h-auto w-px -translate-x-1/2 bg-border" />
            </StepperItem>
            <StepperItem step={2} className="relative items-start">
              <div className="flex w-full items-start gap-3">
                <StepperIndicator className="size-8 rounded-full bg-muted text-foreground">
                  2
                </StepperIndicator>
                <div className="flex-1 space-y-1 pt-0.5">
                  <StepperTitle className="text-sm font-semibold">
                    Open Safari (iPhone) or Chrome (Android)
                  </StepperTitle>
                  <StepperDescription className="text-sm">
                    Paste the link in the address bar, then tap Install to add {propertyName} to
                    your Home Screen.
                  </StepperDescription>
                </div>
              </div>
            </StepperItem>
          </StepperNav>
        </Stepper>

        <Button
          type="button"
          onClick={() => void handleCopyLink()}
          className="min-h-12 w-full gap-2 text-base font-semibold"
        >
          {copyState === 'copied' ? (
            <CheckIcon aria-hidden="true" className="size-4" />
          ) : (
            <CopyIcon aria-hidden="true" className="size-4" />
          )}
          {copyState === 'copied' ? 'Link copied' : 'Copy link'}
        </Button>

        <span role="status" aria-live="polite" className="sr-only">
          {copyState === 'copied'
            ? 'Link copied. Paste it in Safari or Chrome.'
            : copyState === 'failed'
              ? 'Could not copy automatically. Copy the link from the address bar.'
              : ''}
        </span>
      </div>
    );
  }

  if (platform === 'prompt') {
    return (
      <div data-slot="install-guide-prompt" className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-property-10-soft text-property-10-soft-foreground">
            <SmartphoneIcon aria-hidden="true" className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="font-heading text-base font-semibold">
              Add {propertyName} to your Home Screen
            </p>
            <p className="text-sm text-muted-foreground">
              Opens full screen like an app so you can check rooms and your booking with one tap.
            </p>
          </div>
        </div>

        <Button
          type="button"
          disabled={installing}
          onClick={() => void handleNativeInstall()}
          className="min-h-12 w-full gap-2 text-base font-semibold"
        >
          <DownloadIcon aria-hidden="true" className="size-4" />
          {installing ? 'Opening install prompt…' : `Install ${propertyName}`}
        </Button>
      </div>
    );
  }

  const effectiveMode: 'ios_safari_26' | 'ios_safari_legacy' | 'ios_chrome' | 'android_manual' =
    platform === 'ios_safari_26' || platform === 'ios_safari_legacy' || platform === 'ios_chrome'
      ? platform
      : fallbackTab === 'ios_26'
        ? 'ios_safari_26'
        : fallbackTab === 'ios_legacy'
          ? 'ios_safari_legacy'
          : 'android_manual';

  return (
    <div data-slot="install-guide-steps" className="space-y-5">
      {platform === 'other' ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Choose your phone to follow the step-by-step install guide for {propertyName}.
          </p>
          <SegmentedControl
            aria-label="Choose device install steps"
            value={fallbackTab}
            onValueChange={setFallbackTab}
            options={[
              { value: 'ios_26', label: 'iPhone (iOS 26)' },
              { value: 'ios_legacy', label: 'Older iPhone' },
              { value: 'android', label: 'Android' },
            ]}
          />
        </div>
      ) : null}

      {effectiveMode === 'ios_safari_26' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5">
            <label
              htmlFor="safari-bar-top-toggle"
              className="cursor-pointer text-sm font-medium text-card-foreground"
            >
              My address bar is at the top
            </label>
            <Switch
              id="safari-bar-top-toggle"
              checked={addressBarAtTop}
              onCheckedChange={setAddressBarAtTop}
            />
          </div>

          <Stepper defaultValue={1} orientation="vertical" aria-label="iPhone iOS 26 install steps">
            <StepperNav className="w-full gap-0">
              <StepperItem step={1} className="relative items-start">
                <div className="flex w-full items-start gap-3 pb-5">
                  <StepperIndicator className="size-8 rounded-full bg-primary text-primary-foreground">
                    <EllipsisIcon aria-hidden="true" className="size-4" />
                  </StepperIndicator>
                  <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
                    <div>
                      <StepperTitle className="text-sm font-semibold">1. Tap ⋯</StepperTitle>
                      <StepperDescription className="text-sm">
                        {addressBarAtTop
                          ? 'Look at the top right of Safari beside the address bar.'
                          : 'Look at the bottom right of Safari beside the address bar.'}
                      </StepperDescription>
                    </div>
                    <SafariStep1Drawing
                      addressBarAtTop={addressBarAtTop}
                      propertyName={propertyName}
                      slug={slug}
                      logoSrc={logoSrc}
                    />
                  </div>
                </div>
                <StepperSeparator className="absolute top-9 bottom-1 left-4 m-0 h-auto w-px -translate-x-1/2 bg-border" />
              </StepperItem>

              <StepperItem step={2} className="relative items-start">
                <div className="flex w-full items-start gap-3 pb-5">
                  <StepperIndicator className="size-8 rounded-full bg-muted text-foreground">
                    <ShareIcon aria-hidden="true" className="size-4" />
                  </StepperIndicator>
                  <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
                    <div>
                      <StepperTitle className="text-sm font-semibold">2. Tap Share</StepperTitle>
                      <StepperDescription className="text-sm">
                        Choose Share at the top of Safari&apos;s menu.
                      </StepperDescription>
                    </div>
                    <SafariStep2Drawing />
                  </div>
                </div>
                <StepperSeparator className="absolute top-9 bottom-1 left-4 m-0 h-auto w-px -translate-x-1/2 bg-border" />
              </StepperItem>

              <StepperItem step={3} className="relative items-start">
                <div className="flex w-full items-start gap-3 pb-5">
                  <StepperIndicator className="size-8 rounded-full bg-muted text-foreground">
                    <SquarePlusIcon aria-hidden="true" className="size-4" />
                  </StepperIndicator>
                  <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
                    <div>
                      <StepperTitle className="text-sm font-semibold">
                        3. Scroll down and tap Add to Home Screen
                      </StepperTitle>
                      <StepperDescription className="text-sm">
                        Can&apos;t see it? Scroll the list, or tap Edit Actions.
                      </StepperDescription>
                    </div>
                    <SafariStep3Drawing />
                  </div>
                </div>
                <StepperSeparator className="absolute top-9 bottom-1 left-4 m-0 h-auto w-px -translate-x-1/2 bg-border" />
              </StepperItem>

              <StepperItem step={4} className="relative items-start">
                <div className="flex w-full items-start gap-3">
                  <StepperIndicator className="size-8 rounded-full bg-muted text-foreground">
                    <PlusIcon aria-hidden="true" className="size-4" />
                  </StepperIndicator>
                  <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
                    <div>
                      <StepperTitle className="text-sm font-semibold">
                        4. Keep &ldquo;Open as Web App&rdquo; on, then tap Add
                      </StepperTitle>
                      <StepperDescription className="text-sm">
                        {propertyName} will appear on your Home Screen like an app.
                      </StepperDescription>
                    </div>
                    <SafariStep4Drawing
                      addressBarAtTop={addressBarAtTop}
                      propertyName={propertyName}
                      slug={slug}
                      logoSrc={logoSrc}
                    />
                  </div>
                </div>
              </StepperItem>
            </StepperNav>
          </Stepper>

          {showCornerPointer ? <SafariRealCornerPointer addressBarAtTop={addressBarAtTop} /> : null}
        </div>
      ) : null}

      {effectiveMode === 'ios_safari_legacy' ? (
        <Stepper defaultValue={1} orientation="vertical" aria-label="iPhone Safari install steps">
          <StepperNav className="w-full gap-0">
            <StepperItem step={1} className="relative items-start">
              <div className="flex w-full items-start gap-3 pb-5">
                <StepperIndicator className="size-8 rounded-full bg-primary text-primary-foreground">
                  <ShareIcon aria-hidden="true" className="size-4" />
                </StepperIndicator>
                <div className="flex-1 space-y-1 pt-0.5">
                  <StepperTitle className="text-sm font-semibold">
                    1. Tap Share at the bottom
                  </StepperTitle>
                  <StepperDescription className="text-sm">
                    It&apos;s the square with an up arrow in Safari&apos;s bottom bar.
                  </StepperDescription>
                </div>
              </div>
              <StepperSeparator className="absolute top-9 bottom-1 left-4 m-0 h-auto w-px -translate-x-1/2 bg-border" />
            </StepperItem>

            <StepperItem step={2} className="relative items-start">
              <div className="flex w-full items-start gap-3 pb-5">
                <StepperIndicator className="size-8 rounded-full bg-muted text-foreground">
                  <SquarePlusIcon aria-hidden="true" className="size-4" />
                </StepperIndicator>
                <div className="flex-1 space-y-1 pt-0.5">
                  <StepperTitle className="text-sm font-semibold">
                    2. Tap Add to Home Screen
                  </StepperTitle>
                  <StepperDescription className="text-sm">
                    Can&apos;t see it? Scroll the list, or tap Edit Actions.
                  </StepperDescription>
                </div>
              </div>
              <StepperSeparator className="absolute top-9 bottom-1 left-4 m-0 h-auto w-px -translate-x-1/2 bg-border" />
            </StepperItem>

            <StepperItem step={3} className="relative items-start">
              <div className="flex w-full items-start gap-3">
                <StepperIndicator className="size-8 rounded-full bg-muted text-foreground">
                  <PlusIcon aria-hidden="true" className="size-4" />
                </StepperIndicator>
                <div className="flex-1 space-y-1 pt-0.5">
                  <StepperTitle className="text-sm font-semibold">3. Tap Add</StepperTitle>
                  <StepperDescription className="text-sm">
                    {propertyName} will appear on your Home Screen.
                  </StepperDescription>
                </div>
              </div>
            </StepperItem>
          </StepperNav>
        </Stepper>
      ) : null}

      {effectiveMode === 'ios_chrome' ? (
        <Stepper
          defaultValue={1}
          orientation="vertical"
          aria-label="Chrome on iPhone install steps"
        >
          <StepperNav className="w-full gap-0">
            <StepperItem step={1} className="relative items-start">
              <div className="flex w-full items-start gap-3 pb-5">
                <StepperIndicator className="size-8 rounded-full bg-primary text-primary-foreground">
                  <ShareIcon aria-hidden="true" className="size-4" />
                </StepperIndicator>
                <div className="flex-1 space-y-1 pt-0.5">
                  <StepperTitle className="text-sm font-semibold">
                    1. Tap Share at the top right
                  </StepperTitle>
                  <StepperDescription className="text-sm">
                    Look for the Share icon inside Chrome&apos;s address bar at the top right.
                  </StepperDescription>
                </div>
              </div>
              <StepperSeparator className="absolute top-9 bottom-1 left-4 m-0 h-auto w-px -translate-x-1/2 bg-border" />
            </StepperItem>

            <StepperItem step={2} className="relative items-start">
              <div className="flex w-full items-start gap-3 pb-5">
                <StepperIndicator className="size-8 rounded-full bg-muted text-foreground">
                  <SquarePlusIcon aria-hidden="true" className="size-4" />
                </StepperIndicator>
                <div className="flex-1 space-y-1 pt-0.5">
                  <StepperTitle className="text-sm font-semibold">
                    2. Tap Add to Home Screen
                  </StepperTitle>
                  <StepperDescription className="text-sm">
                    Scroll down in the share sheet until you see Add to Home Screen.
                  </StepperDescription>
                </div>
              </div>
              <StepperSeparator className="absolute top-9 bottom-1 left-4 m-0 h-auto w-px -translate-x-1/2 bg-border" />
            </StepperItem>

            <StepperItem step={3} className="relative items-start">
              <div className="flex w-full items-start gap-3">
                <StepperIndicator className="size-8 rounded-full bg-muted text-foreground">
                  <PlusIcon aria-hidden="true" className="size-4" />
                </StepperIndicator>
                <div className="flex-1 space-y-1 pt-0.5">
                  <StepperTitle className="text-sm font-semibold">3. Tap Add</StepperTitle>
                  <StepperDescription className="text-sm">
                    {propertyName} will open right from your Home Screen.
                  </StepperDescription>
                </div>
              </div>
            </StepperItem>
          </StepperNav>
        </Stepper>
      ) : null}

      {effectiveMode === 'android_manual' ? (
        <Stepper defaultValue={1} orientation="vertical" aria-label="Android Chrome install steps">
          <StepperNav className="w-full gap-0">
            <StepperItem step={1} className="relative items-start">
              <div className="flex w-full items-start gap-3 pb-5">
                <StepperIndicator className="size-8 rounded-full bg-primary text-primary-foreground">
                  1
                </StepperIndicator>
                <div className="flex-1 space-y-1 pt-0.5">
                  <StepperTitle className="text-sm font-semibold">
                    1. Open Chrome&apos;s menu (⋮)
                  </StepperTitle>
                  <StepperDescription className="text-sm">
                    Tap the three dots at the top right of Chrome.
                  </StepperDescription>
                </div>
              </div>
              <StepperSeparator className="absolute top-9 bottom-1 left-4 m-0 h-auto w-px -translate-x-1/2 bg-border" />
            </StepperItem>

            <StepperItem step={2} className="relative items-start">
              <div className="flex w-full items-start gap-3 pb-5">
                <StepperIndicator className="size-8 rounded-full bg-muted text-foreground">
                  2
                </StepperIndicator>
                <div className="flex-1 space-y-1 pt-0.5">
                  <StepperTitle className="text-sm font-semibold">
                    2. Tap Add to Home screen or Install app
                  </StepperTitle>
                  <StepperDescription className="text-sm">
                    Choose Install when Chrome asks to confirm.
                  </StepperDescription>
                </div>
              </div>
              <StepperSeparator className="absolute top-9 bottom-1 left-4 m-0 h-auto w-px -translate-x-1/2 bg-border" />
            </StepperItem>

            <StepperItem step={3} className="relative items-start">
              <div className="flex w-full items-start gap-3">
                <StepperIndicator className="size-8 rounded-full bg-muted text-foreground">
                  3
                </StepperIndicator>
                <div className="flex-1 space-y-1 pt-0.5">
                  <StepperTitle className="text-sm font-semibold">
                    3. Open {propertyName} from your Home Screen
                  </StepperTitle>
                  <StepperDescription className="text-sm">
                    No app store needed — it stays updated automatically.
                  </StepperDescription>
                </div>
              </div>
            </StepperItem>
          </StepperNav>
        </Stepper>
      ) : null}
    </div>
  );
}

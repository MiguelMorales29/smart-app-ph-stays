import { propertyPalette, type FontPair, type PropertyPalette } from '@smartapp/core';
import { cn } from 'cn';
import type { ComponentProps } from 'react';

import { cssVars, type CssVarsObject } from '../lib/css-vars';
import { fontPairVars } from '../lib/font-pairs';
import { PropertyThemeDocument } from './property-theme-document';

export type PropertyLogoShape = 'circle' | 'rounded';

export interface PropertyThemeProps extends Omit<ComponentProps<'div'>, 'style'> {
  brandColor: string;
  pageColor?: string | null | undefined;
  cardColor?: string | null | undefined;
  accentColor?: string | null | undefined;
  fontPair?: FontPair | undefined;
  logoShape?: PropertyLogoShape | undefined;
  /**
   * The storefront sets this once so portals (sheets, drawers, dropdowns, toasts) mounted at
   * <body> receive the property's CSS variables on <html>, along with `--control-h: 48px`.
   */
  withPortals?: boolean | undefined;
}

export interface PropertyThemeVarOptions {
  readonly logoShape?: PropertyLogoShape | undefined;
  readonly controlHeight?: string | undefined;
}

/** Turns a resolved PropertyPalette into CSS variables for property surfaces and UI primitives. */
export function propertyThemeVars(
  palette: PropertyPalette,
  options?: PropertyThemeVarOptions,
): CssVarsObject {
  const logoRadius = options?.logoShape === 'circle' ? '9999px' : 'var(--radius)';
  return {
    '--property-60': palette.property60,
    '--property-30': palette.property30,
    '--property-10': palette.property10,
    '--property-10-foreground': palette.property10Foreground,
    '--property-10-hover': palette.property10Hover,
    '--property-10-text': palette.property10Text,
    '--property-10-soft': palette.property10Soft,
    '--property-10-soft-foreground': palette.property10SoftForeground,
    '--property-accent': palette.brandAccent,
    '--property-accent-foreground': palette.brandAccentForeground,
    '--property-accent-hover': palette.brandAccentHover,
    '--property-accent-text': palette.brandAccentText,
    '--property-accent-soft': palette.brandAccentSoft,
    '--property-accent-soft-foreground': palette.brandAccentSoftForeground,
    '--background': palette.mixed ? palette.property30 : palette.property60,
    '--foreground': palette.foreground,
    '--card': palette.property30,
    '--card-foreground': palette.foreground,
    '--popover': palette.property30,
    '--popover-foreground': palette.foreground,
    '--raised': palette.property30,
    '--primary': palette.property10,
    '--primary-foreground': palette.property10Foreground,
    '--primary-hover': palette.property10Hover,
    '--primary-tint': palette.property10Soft,
    '--secondary': palette.property10Soft,
    '--secondary-foreground': palette.property10SoftForeground,
    '--brand-accent': palette.brandAccent,
    '--brand-accent-foreground': palette.brandAccentForeground,
    '--ring': palette.property10Text,
    '--page-foreground': palette.page.foreground,
    '--page-muted-foreground': palette.page.muted,
    '--page-link': palette.page.link,
    '--card-link': palette.property10Text,
    '--muted-foreground': palette.cardMuted,
    '--card-muted-foreground': palette.cardMuted,
    '--logo-radius': logoRadius,
    ...(options?.controlHeight ? { '--control-h': options.controlHeight } : {}),
    ...(palette.tint
      ? {
          '--muted': palette.tint.muted,
          '--accent': palette.tint.muted,
          '--accent-foreground': palette.foreground,
          '--border': palette.tint.border,
        }
      : {}),
  };
}

// Server-safe wrapper (no hooks) so Next.js Server Components can render PropertyTheme directly.
export function PropertyTheme({
  brandColor,
  pageColor,
  cardColor,
  accentColor,
  fontPair = 'malinaw',
  logoShape = 'rounded',
  withPortals = false,
  className,
  children,
  ...props
}: PropertyThemeProps) {
  const palette = propertyPalette({ brandColor, pageColor, cardColor, accentColor });
  const vars: CssVarsObject = {
    ...propertyThemeVars(palette, {
      logoShape,
      controlHeight: withPortals ? '48px' : undefined,
    }),
    ...fontPairVars(fontPair),
  };

  return (
    <div
      data-slot="property-theme"
      data-surface="light"
      data-surface-mix={palette.mixed ? 'mixed' : undefined}
      data-font-pair={fontPair}
      data-logo-shape={logoShape}
      className={cn('contents light font-sans text-foreground', className)}
      style={cssVars(vars)}
      {...props}
    >
      {withPortals ? <PropertyThemeDocument vars={vars} /> : null}
      {children}
    </div>
  );
}

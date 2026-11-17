'use client';

import { useEffect } from 'react';

import { setCssVars, type CssVarsObject } from '../lib/css-vars';

// Portals (sheets, dialogs, toasts) render at the end of <body>, outside PropertyTheme.
// This copies the property's CSS variables onto <html> while the property page is open and undoes them after.
export function PropertyThemeDocument({ vars }: { readonly vars: CssVarsObject }) {
  useEffect(() => {
    return setCssVars(document.documentElement, vars);
  }, [vars]);
  return null;
}

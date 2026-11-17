import { describe, expect, it } from 'vitest';

import { parseThemeMode, resolveThemeMode } from './theme';

describe('dashboard theme helpers', () => {
  it('parses valid theme modes and falls back to system', () => {
    expect(parseThemeMode('light')).toBe('light');
    expect(parseThemeMode('dark')).toBe('dark');
    expect(parseThemeMode('system')).toBe('system');
    expect(parseThemeMode(null)).toBe('system');
    expect(parseThemeMode(undefined)).toBe('system');
    expect(parseThemeMode('invalid')).toBe('system');
  });

  it('resolves light, dark, and system against prefers-color-scheme', () => {
    expect(resolveThemeMode('light', true)).toBe('light');
    expect(resolveThemeMode('light', false)).toBe('light');
    expect(resolveThemeMode('dark', true)).toBe('dark');
    expect(resolveThemeMode('dark', false)).toBe('dark');
    expect(resolveThemeMode('system', true)).toBe('dark');
    expect(resolveThemeMode('system', false)).toBe('light');
  });
});

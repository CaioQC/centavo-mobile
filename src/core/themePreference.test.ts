import { describe, expect, it } from 'vitest';

import { parseThemePreference, resolveScheme } from './themePreference';

describe('parseThemePreference', () => {
  it('aceita os três valores gravados', () => {
    expect(parseThemePreference('SYSTEM')).toBe('SYSTEM');
    expect(parseThemePreference('LIGHT')).toBe('LIGHT');
    expect(parseThemePreference('DARK')).toBe('DARK');
  });

  it('ausente, vazio ou desconhecido segue o sistema', () => {
    expect(parseThemePreference(null)).toBe('SYSTEM');
    expect(parseThemePreference(undefined)).toBe('SYSTEM');
    expect(parseThemePreference('')).toBe('SYSTEM');
    expect(parseThemePreference('dark')).toBe('SYSTEM');
    expect(parseThemePreference('AZUL')).toBe('SYSTEM');
  });
});

describe('resolveScheme', () => {
  it('claro e escuro ignoram o sistema', () => {
    expect(resolveScheme('LIGHT', 'dark')).toBe('light');
    expect(resolveScheme('DARK', 'light')).toBe('dark');
    expect(resolveScheme('DARK', null)).toBe('dark');
  });

  it('sistema segue o aparelho e, sem informação, usa o claro', () => {
    expect(resolveScheme('SYSTEM', 'dark')).toBe('dark');
    expect(resolveScheme('SYSTEM', 'light')).toBe('light');
    expect(resolveScheme('SYSTEM', null)).toBe('light');
    expect(resolveScheme('SYSTEM', undefined)).toBe('light');
  });
});

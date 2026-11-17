// Preferência de tema (Ajustes): seguir o sistema ou fixar claro/escuro. Gravada em `settings` (chave `theme`).

export type ThemePreference = 'SYSTEM' | 'LIGHT' | 'DARK';
export type ResolvedScheme = 'light' | 'dark';

export const THEME_SETTING_KEY = 'theme';
export const THEME_PREFERENCES: readonly ThemePreference[] = ['SYSTEM', 'LIGHT', 'DARK'];

/** Valor lido do banco → preferência. Ausente ou desconhecido vale `SYSTEM`. */
export function parseThemePreference(value: string | null | undefined): ThemePreference {
  return THEME_PREFERENCES.find((preference) => preference === value) ?? 'SYSTEM';
}

/** Tema que vale de fato: a escolha do usuário ou, em `SYSTEM`, o do sistema (sem informação = claro). */
export function resolveScheme(
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | null | undefined,
): ResolvedScheme {
  if (preference === 'LIGHT') return 'light';
  if (preference === 'DARK') return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export const THEME_PREFERENCE_LABELS: Record<ThemePreference, string> = {
  SYSTEM: 'Sistema',
  LIGHT: 'Claro',
  DARK: 'Escuro',
};

import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

import { resolveScheme, type ThemePreference } from '../../core/themePreference';
import { categoryColors, colors, type CategoryColorKey, type CategoryColor, type ColorScheme, type ColorTokens } from './tokens';

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  category: Record<CategoryColorKey, CategoryColor>;
}

/** Preferência de tema e como trocá-la; quem grava no banco é o `ThemePreferenceProvider`. */
export interface ThemePreferenceValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const ThemePreferenceContext = createContext<ThemePreferenceValue>({
  preference: 'SYSTEM',
  setPreference: () => {},
});

export function useThemePreference(): ThemePreferenceValue {
  return useContext(ThemePreferenceContext);
}

/** Tema atual: o que o usuário fixou em Ajustes ou, em "Sistema", o do aparelho. */
export function useTheme(): Theme {
  const { preference } = useThemePreference();
  const scheme: ColorScheme = resolveScheme(preference, useColorScheme());
  return { scheme, colors: colors[scheme], category: categoryColors[scheme] };
}

import { useColorScheme } from 'react-native';

import { categoryColors, colors, type CategoryColorKey, type CategoryColor, type ColorScheme, type ColorTokens } from './tokens';

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  category: Record<CategoryColorKey, CategoryColor>;
}

/** Tema atual, claro ou escuro conforme o sistema (a opção de fixar entra em Ajustes, etapa 2). */
export function useTheme(): Theme {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: colors[scheme], category: categoryColors[scheme] };
}

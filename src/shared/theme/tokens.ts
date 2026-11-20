// Tokens da identidade Caderneta (docs/mobile/design.md). Nenhuma tela usa cor solta.

export type ColorScheme = 'light' | 'dark';

export interface ColorTokens {
  /** fundo das telas */
  bg: string;
  /** cartões e barra de abas */
  card: string;
  /** contorno do cartão: no escuro substitui a sombra; no claro não há contorno */
  cardBorder: string;
  /** texto principal */
  text: string;
  /** texto secundário */
  muted: string;
  /** fundo das barras de progresso */
  track: string;
  /** cartão do saldo, botão "+", barra do orçamento */
  accent: string;
  /** texto sobre o accent */
  onAccent: string;
  /** links e aba ativa (legível no escuro) */
  accentText: string;
  /** "Atenção" (a partir de 80% do limite) */
  warn: string;
  /** "Estourou" (acima de 100%) */
  over: string;
  /** valor de receita */
  income: string;
  /** véu atrás das folhas de opções */
  overlay: string;
  /** cor da sombra da barra de abas flutuante */
  shadow: string;
}

export const colors: Record<ColorScheme, ColorTokens> = {
  light: {
    bg: '#F3F5F9',
    card: '#FFFFFF',
    cardBorder: 'transparent',
    text: '#151A24',
    muted: '#5B6474',
    track: '#E9EDF3',
    accent: '#2F54EB',
    onAccent: '#FFFFFF',
    accentText: '#2F54EB',
    warn: '#A15C07',
    over: '#C2410C',
    income: '#15803D',
    overlay: 'rgba(15, 18, 24, 0.4)',
    shadow: '#0F1218',
  },
  dark: {
    bg: '#0F1218',
    card: '#1A1F29',
    cardBorder: '#232A36',
    text: '#EEF1F6',
    muted: '#A3ACBB',
    track: '#2A3140',
    accent: '#2F54EB',
    onAccent: '#FFFFFF',
    // accent clareado em 45% (mistura com branco): #2F54EB → #8DA1F4
    accentText: '#8DA1F4',
    warn: '#FBBF24',
    over: '#FB923C',
    income: '#86EFAC',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: '#000000',
  },
};

/** Chave de cor de uma categoria; é o valor gravado em `categories.color`. */
export type CategoryColorKey =
  | 'housing'
  | 'food'
  | 'transport'
  | 'leisure'
  | 'subscriptions'
  | 'health'
  | 'shopping'
  | 'education'
  | 'other'
  | 'income';

export interface CategoryColor {
  /** fundo do quadrado do ícone */
  background: string;
  /** cor do ícone (e da barra do orçamento) */
  icon: string;
}

// Claro: ícone na cor forte sobre fundo pastel. Escuro: ícone na cor clara sobre
// a própria cor translúcida (16% de opacidade).
const darkCategory = (icon: string): CategoryColor => ({ background: `${icon}29`, icon });

export const categoryColors: Record<ColorScheme, Record<CategoryColorKey, CategoryColor>> = {
  light: {
    housing: { background: '#E0E7FF', icon: '#4338CA' },
    food: { background: '#FFEDD5', icon: '#C2410C' },
    transport: { background: '#CCFBF1', icon: '#0F766E' },
    leisure: { background: '#FCE7F3', icon: '#BE185D' },
    subscriptions: { background: '#EDE9FE', icon: '#6D28D9' },
    health: { background: '#DCFCE7', icon: '#15803D' },
    shopping: { background: '#FEF3C7', icon: '#A15C07' },
    education: { background: '#E0F2FE', icon: '#0369A1' },
    // "Outros" e as receitas não estão na tabela do design: usam os neutros e o verde de receita.
    other: { background: '#E9EDF3', icon: '#5B6474' },
    income: { background: '#DCFCE7', icon: '#15803D' },
  },
  dark: {
    housing: darkCategory('#A5B4FC'),
    food: darkCategory('#FDBA74'),
    transport: darkCategory('#5EEAD4'),
    leisure: darkCategory('#F9A8D4'),
    subscriptions: darkCategory('#C4B5FD'),
    health: darkCategory('#86EFAC'),
    shopping: darkCategory('#FCD34D'),
    education: darkCategory('#7DD3FC'),
    other: darkCategory('#A3ACBB'),
    income: darkCategory('#86EFAC'),
  },
};

/** Espaçamento em px (grade de 4). */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Raios: cartões 18–24, ícones de categoria 11–13. */
export const radius = { categoryIcon: 12, card: 20, cardLarge: 24, pill: 999 } as const;

/** Área de toque mínima (design.md). */
export const MIN_TOUCH_SIZE = 44;

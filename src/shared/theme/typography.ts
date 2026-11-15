import type { TextStyle } from 'react-native';

// Plus Jakarta Sans, pesos 400 a 800. Os nomes são os que o useFonts registra.
export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export type TextVariant = 'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'captionMoney' | 'money';

export const textStyles: Record<TextVariant, TextStyle> = {
  title: { fontFamily: fontFamily.extrabold, fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: fontFamily.bold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  // Algarismos tabulares: os números não "dançam" nas listas.
  // Valor em corpo pequeno (totais do dia, resumo do mês).
  captionMoney: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
  money: { fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 22, fontVariant: ['tabular-nums'] },
};

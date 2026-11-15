import { Text, type TextProps } from 'react-native';

import { textStyles, useTheme, type TextVariant } from '../theme';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  /** `text` (padrão) ou `muted` */
  tone?: 'text' | 'muted' | 'accent';
}

/** Texto com a fonte e as cores do tema. Toda tela usa este componente, não `Text` solto. */
export function AppText({ variant = 'body', tone = 'text', style, ...props }: AppTextProps) {
  const { colors } = useTheme();
  const color = tone === 'muted' ? colors.muted : tone === 'accent' ? colors.accentText : colors.text;
  return <Text {...props} style={[textStyles[variant], { color }, style]} />;
}

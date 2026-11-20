import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, useTheme } from '../theme';

interface CardProps {
  children: ReactNode;
  /** Quando existe, o cartão inteiro vira um botão. */
  onPress?: () => void;
  /** Texto lido pelo leitor de tela; sem `onPress`, agrupa o cartão num só elemento. */
  accessibilityLabel?: string;
  /** Anuncia mudanças no conteúdo (resumos que aparecem depois de uma ação). */
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  /** Raio maior (cartões de resumo, como o do orçamento e o da meta). */
  large?: boolean;
  /** Espaçamento interno e layout ficam por conta de quem usa. */
  style?: StyleProp<ViewStyle>;
}

/** Superfície dos cartões do app: cor, contorno (só no escuro) e raio do tema. Base de `ListRow` e dos painéis de resumo. */
export function Card({ children, onPress, accessibilityLabel, accessibilityLiveRegion, large = false, style }: CardProps) {
  const { colors } = useTheme();
  const surface = [
    styles.surface,
    large && styles.large,
    { backgroundColor: colors.card, borderColor: colors.cardBorder },
    style,
  ];
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={surface}>
        {children}
      </Pressable>
    );
  }
  return (
    <View
      accessible={accessibilityLabel !== undefined ? true : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion={accessibilityLiveRegion}
      style={surface}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { borderRadius: radius.card, borderWidth: 1 },
  large: { borderRadius: radius.cardLarge },
});

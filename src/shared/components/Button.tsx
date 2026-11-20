import type { ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../theme';
import { AppText } from './AppText';

interface ButtonProps {
  label: string;
  onPress: () => void;
  icon?: ComponentType<LucideProps>;
  /** `primary` é o botão azul da ação principal; `secondary` é o cartão com contorno; `tonal` tem fundo de trilha, para ficar visível dentro de um cartão. */
  variant?: 'primary' | 'secondary' | 'tonal';
  disabled?: boolean;
  /** Mostra um indicador no lugar do ícone e bloqueia o toque. */
  loading?: boolean;
}

/** Botão em pílula das telas: ação principal (azul) ou secundária (cartão). Área de toque de 44 px ou mais. */
export function Button({ label, onPress, icon: Icon, variant = 'primary', disabled = false, loading = false }: ButtonProps) {
  const { colors } = useTheme();
  const primary = variant === 'primary';
  const blocked = disabled || loading;
  const foreground = primary ? colors.onAccent : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      style={[
        styles.button,
        primary
          ? { backgroundColor: colors.accent }
          : variant === 'tonal'
            ? { backgroundColor: colors.track }
            : { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 },
        { opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={foreground} /> : Icon ? <Icon size={20} color={foreground} /> : null}
      <AppText variant="bodyStrong" style={{ color: foreground }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
});

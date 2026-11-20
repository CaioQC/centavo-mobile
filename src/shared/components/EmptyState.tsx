import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../theme';
import { AppText } from './AppText';

interface EmptyStateProps {
  icon: ComponentType<LucideProps>;
  title: string;
  message: string;
  /** Ação da tela vazia ("Criar meta", "Tentar de novo"); só aparece com `onAction`. */
  actionLabel?: string;
  onAction?: () => void;
}

/** Estado vazio (ou de erro): toda lista do app tem um, com uma ação quando houver o que fazer. */
export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.track }]}>
        <Icon size={24} color={colors.muted} strokeWidth={1.75} />
      </View>
      <AppText variant="heading" accessibilityRole="header" style={styles.centered}>
        {title}
      </AppText>
      <AppText tone="muted" style={styles.centered}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
          <AppText tone="accent" variant="bodyStrong">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.categoryIcon,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  centered: { textAlign: 'center' },
  action: { minHeight: MIN_TOUCH_SIZE, minWidth: MIN_TOUCH_SIZE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
});

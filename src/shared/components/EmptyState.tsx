import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

import { radius, spacing, useTheme } from '../theme';
import { AppText } from './AppText';

interface EmptyStateProps {
  icon: ComponentType<LucideProps>;
  title: string;
  message: string;
}

/** Estado vazio: toda lista do app tem um (a ação entra junto com a tela de cada etapa). */
export function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.track }]}>
        <Icon size={24} color={colors.muted} strokeWidth={1.75} />
      </View>
      <AppText variant="heading" style={styles.centered}>
        {title}
      </AppText>
      <AppText tone="muted" style={styles.centered}>
        {message}
      </AppText>
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
});

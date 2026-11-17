import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, type LucideProps } from 'lucide-react-native';

import { AppText } from '../../shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../../shared/theme';

interface ShortcutRowProps {
  icon: ComponentType<LucideProps>;
  title: string;
  subtitle: string;
  onPress: () => void;
}

/** Atalho do Início para outra tela (contas, ajustes). */
export function ShortcutRow({ icon: Icon, title, subtitle, onPress }: ShortcutRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <View style={[styles.icon, { backgroundColor: colors.track }]}>
        <Icon size={20} color={colors.muted} strokeWidth={1.75} />
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" tone="muted">
          {subtitle}
        </AppText>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH_SIZE + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  icon: { width: 40, height: 40, borderRadius: radius.categoryIcon, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
});

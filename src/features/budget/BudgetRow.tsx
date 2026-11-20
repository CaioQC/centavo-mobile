import { Pressable, StyleSheet, View } from 'react-native';
import { Clock } from 'lucide-react-native';

import type { CategoryBudgetLine } from '../../core/budget';
import { formatCents } from '../../core/money';
import type { Category } from '../../data/types';
import { AppText, CategoryBadge } from '../../shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../../shared/theme';
import { BudgetBar } from './BudgetBar';
import { usageText } from './usageText';

interface BudgetRowProps {
  category: Category;
  line: CategoryBudgetLine;
  /** quando existe, a linha vira um botão (a edição do limite liga isto) */
  onPress?: () => void;
}

/** Categoria do orçamento: gasto contra o limite, barra na cor da categoria e o "já comprometido" em destaque. */
export function BudgetRow({ category, line, onPress }: BudgetRowProps) {
  const { colors, category: palette } = useTheme();
  const categoryColor = (palette as Record<string, { icon: string } | undefined>)[category.color]?.icon ?? palette.other.icon;
  const statusColor = line.usage.status === 'OVER' ? colors.over : line.usage.status === 'WARNING' ? colors.warn : colors.muted;
  const amounts =
    line.limitInCents === null
      ? line.spentInCents > 0
        ? `Gasto ${formatCents(line.spentInCents)}`
        : 'Nenhum gasto'
      : `${formatCents(line.spentInCents)} de ${formatCents(line.limitInCents)}`;
  const label = [
    category.name,
    amounts,
    usageText(line.usage),
    line.committedInCents > 0 ? `já comprometido ${formatCents(line.committedInCents)}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(', ');

  const content = (
    <>
      <View style={styles.header}>
        <CategoryBadge icon={category.icon} color={category.color} />
        <View style={styles.texts}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {category.name}
          </AppText>
          <AppText variant="captionMoney" tone="muted">
            {amounts}
          </AppText>
        </View>
        <AppText variant="caption" style={{ color: statusColor }}>
          {usageText(line.usage)}
        </AppText>
      </View>
      <BudgetBar usage={line.usage} color={categoryColor} />
      {line.committedInCents > 0 ? (
        <View style={[styles.committed, { backgroundColor: colors.track }]}>
          <Clock size={16} color={colors.accentText} strokeWidth={2} />
          <AppText variant="captionMoney" tone="accent">
            Já comprometido {formatCents(line.committedInCents)}
          </AppText>
        </View>
      ) : null}
    </>
  );

  const style = [styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }];
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label} style={style}>
        {content}
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={style}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: MIN_TOUCH_SIZE + spacing.lg, gap: spacing.md, padding: spacing.md, borderRadius: radius.card, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  texts: { flex: 1 },
  committed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});

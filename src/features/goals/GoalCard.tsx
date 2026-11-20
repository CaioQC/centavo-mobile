import { Pressable, StyleSheet, View } from 'react-native';

import { formatDateInput } from '../../core/dateInput';
import { goalProgress } from '../../core/goals';
import { formatCents } from '../../core/money';
import type { Goal } from '../../data/types';
import { AppText, CategoryBadge } from '../../shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../../shared/theme';
import { GoalProgressBar } from './GoalProgressBar';

/** Texto do estado da meta: "Meta batida" ou "Faltam R$ 1.000,00". */
export function remainingText(completed: boolean, remainingInCents: number): string {
  return completed ? 'Meta batida' : `Faltam ${formatCents(remainingInCents)}`;
}

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
}

/** Cartão da meta: nome, progresso, quanto guardou do alvo e quanto falta. */
export function GoalCard({ goal, onPress }: GoalCardProps) {
  const { colors, category } = useTheme();
  const progress = goalProgress(goal.savedInCents, goal.targetInCents);
  const color = (category as Record<string, { icon: string } | undefined>)[goal.color]?.icon ?? category.other.icon;
  const remaining = remainingText(progress.completed, progress.remainingInCents);
  const amounts = `${formatCents(progress.savedInCents)} de ${formatCents(goal.targetInCents)}`;
  const deadline = goal.targetDate ? `até ${formatDateInput(goal.targetDate)}` : null;
  const label = [goal.name, amounts, `${progress.percent}%`, remaining, deadline]
    .filter((part): part is string => part !== null)
    .join(', ');

  const content = (
    <>
      <View style={styles.header}>
        <CategoryBadge icon={goal.icon} color={goal.color} />
        <View style={styles.texts}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {goal.name}
          </AppText>
          <AppText variant="captionMoney" tone="muted">
            {amounts}
          </AppText>
        </View>
        <AppText variant="caption" style={{ color: progress.completed ? colors.income : colors.muted }}>
          {progress.percent}%
        </AppText>
      </View>
      <GoalProgressBar ratio={progress.ratio} color={color} completed={progress.completed} />
      <View style={styles.footer}>
        <AppText variant="captionMoney" style={{ color: progress.completed ? colors.income : colors.text }}>
          {remaining}
        </AppText>
        {deadline ? (
          <AppText variant="caption" tone="muted">
            {deadline}
          </AppText>
        ) : null}
      </View>
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
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

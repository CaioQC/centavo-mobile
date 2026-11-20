import { StyleSheet, View } from 'react-native';

import { formatDateInput } from '../../core/dateInput';
import { goalProgress } from '../../core/goals';
import { formatCents } from '../../core/money';
import type { Goal } from '../../data/types';
import { AppText, CategoryBadge, ListRow } from '../../shared/components';
import { useTheme } from '../../shared/theme';
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

  return (
    <ListRow
      leading={<CategoryBadge icon={goal.icon} color={goal.color} />}
      title={goal.name}
      subtitle={amounts}
      subtitleVariant="captionMoney"
      trailing={
        <AppText variant="caption" style={{ color: progress.completed ? colors.income : colors.muted }}>
          {progress.percent}%
        </AppText>
      }
      accessibilityLabel={label}
      onPress={onPress}
    >
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
    </ListRow>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowDownToLine, ArrowUpFromLine, Target } from 'lucide-react-native';

import { formatDateInput } from '@/core/dateInput';
import { goalProgress } from '@/core/goals';
import { formatCents, formatSignedCents } from '@/core/money';
import type { Database } from '@/data/database';
import { getGoal, listContributions } from '@/data/repositories';
import { useDbQuery } from '@/data/useDbQuery';
import { GoalProgressBar } from '@/features/goals/GoalProgressBar';
import { remainingText } from '@/features/goals/GoalCard';
import { AppText, Button, CategoryBadge, Card, EmptyState, ListRow, QueryFallback, Screen, Section } from '@/shared/components';
import { spacing, useTheme } from '@/shared/theme';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, category } = useTheme();

  const load = useCallback(
    async (db: Database) => {
      const [goal, contributions] = await Promise.all([getGoal(db, id), listContributions(db, id)]);
      return { goal, contributions };
    },
    [id],
  );
  const result = useDbQuery(load);
  const goBack = () => router.back();
  const goal = result.data?.goal ?? null;

  if (!result.data || !goal) {
    return (
      <Screen title="Meta" onBack={goBack}>
        <QueryFallback
          status={result.status}
          errorTitle="Não foi possível carregar a meta"
          onRetry={result.reload}
          notFound={{ icon: Target, title: 'Meta não encontrada', message: 'Ela pode ter sido removida. Volte às metas.', onBack: goBack }}
        />
      </Screen>
    );
  }

  const { contributions } = result.data;
  const progress = goalProgress(goal.savedInCents, goal.targetInCents);
  const color = (category as Record<string, { icon: string } | undefined>)[goal.color]?.icon ?? category.other.icon;
  const remaining = remainingText(progress.completed, progress.remainingInCents);
  const canWithdraw = progress.savedInCents > 0;
  const openContribution = (kind: 'DEPOSIT' | 'WITHDRAWAL') =>
    router.push({ pathname: '/goal-contribution', params: { goalId: goal.id, kind } });

  return (
    <Screen title={goal.name} onBack={goBack} scroll>
      <Card
        large
        style={styles.summary}
        accessibilityLabel={`${goal.name}, ${formatCents(progress.savedInCents)} de ${formatCents(goal.targetInCents)}, ${progress.percent}%, ${remaining}${goal.targetDate ? `, até ${formatDateInput(goal.targetDate)}` : ''}`}
      >
        <View style={styles.summaryHeader}>
          <CategoryBadge icon={goal.icon} color={goal.color} size={48} />
          <View style={styles.flex}>
            <AppText variant="caption" tone="muted">
              Guardado
            </AppText>
            <AppText variant="titleMoney">{formatCents(progress.savedInCents)}</AppText>
          </View>
        </View>
        <GoalProgressBar ratio={progress.ratio} color={color} completed={progress.completed} height={12} />
        <View style={styles.row}>
          <AppText variant="captionMoney" tone="muted">
            de {formatCents(goal.targetInCents)} · {progress.percent}%
          </AppText>
          <AppText variant="captionMoney" style={{ color: progress.completed ? colors.income : colors.text }}>
            {remaining}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted">
          {goal.targetDate ? `Data-alvo: ${formatDateInput(goal.targetDate)}` : 'Sem data-alvo'}
        </AppText>
      </Card>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button label="Novo aporte" icon={ArrowDownToLine} onPress={() => openContribution('DEPOSIT')} />
        </View>
        <View style={styles.action}>
          <Button
            label="Retirar"
            icon={ArrowUpFromLine}
            variant="tonal"
            disabled={!canWithdraw}
            onPress={() => openContribution('WITHDRAWAL')}
          />
        </View>
      </View>
      {canWithdraw ? null : (
        <AppText variant="caption" tone="muted">
          Nada guardado para retirar ainda.
        </AppText>
      )}

      <Section title="Aportes">
        {contributions.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhum aporte ainda"
            message="Registre o primeiro aporte e veja a barra avançar."
            actionLabel="Novo aporte"
            onAction={() => openContribution('DEPOSIT')}
          />
        ) : (
          contributions.map((contribution) => {
            const isWithdrawal = contribution.amountInCents < 0;
            const kindLabel = isWithdrawal ? 'Retirada' : 'Aporte';
            const amountText = formatSignedCents(contribution.amountInCents);
            return (
              <ListRow
                key={contribution.id}
                title={kindLabel}
                subtitle={formatDateInput(contribution.date)}
                trailing={
                  <AppText variant="money" style={isWithdrawal ? undefined : { color: colors.income }}>
                    {amountText}
                  </AppText>
                }
                accessibilityLabel={`${kindLabel}, ${formatDateInput(contribution.date)}, ${amountText}`}
              />
            );
          })
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: { gap: spacing.md, padding: spacing.lg },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});

import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowDownToLine, ArrowUpFromLine, Target, TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDateInput } from '@/core/dateInput';
import { goalProgress } from '@/core/goals';
import { formatCents, formatSignedCents } from '@/core/money';
import type { Database } from '@/data/database';
import { getGoal, listContributions } from '@/data/repositories';
import { useDbQuery } from '@/data/useDbQuery';
import { GoalProgressBar } from '@/features/goals/GoalProgressBar';
import { remainingText } from '@/features/goals/GoalCard';
import { AppText, Button, CategoryBadge, EmptyState, Screen } from '@/shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '@/shared/theme';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, category } = useTheme();
  const insets = useSafeAreaInsets();

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
    const failed = result.status === 'error';
    if (result.status === 'loading') {
      return (
        <Screen title="Meta" onBack={goBack}>
          <ActivityIndicator accessibilityLabel="Carregando" color={colors.muted} />
        </Screen>
      );
    }
    return (
      <Screen title="Meta" onBack={goBack}>
        <EmptyState
          icon={failed ? TriangleAlert : Target}
          title={failed ? 'Não foi possível carregar a meta' : 'Meta não encontrada'}
          message={failed ? 'Algo deu errado ao ler os dados do aparelho. Tente de novo.' : 'Ela pode ter sido removida. Volte às metas.'}
          actionLabel={failed ? 'Tentar de novo' : 'Voltar'}
          onAction={failed ? result.reload : goBack}
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
    <Screen title={goal.name} onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View
          accessible
          accessibilityLabel={`${goal.name}, ${formatCents(progress.savedInCents)} de ${formatCents(goal.targetInCents)}, ${progress.percent}%, ${remaining}${goal.targetDate ? `, até ${formatDateInput(goal.targetDate)}` : ''}`}
          style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
          <View style={styles.summaryHeader}>
            <CategoryBadge icon={goal.icon} color={goal.color} size={48} />
            <View style={styles.flex}>
              <AppText variant="caption" tone="muted">
                Guardado
              </AppText>
              <AppText variant="title" style={styles.money}>
                {formatCents(progress.savedInCents)}
              </AppText>
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
        </View>

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

        <View style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            Aportes
          </AppText>
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
                <View
                  key={contribution.id}
                  accessible
                  accessibilityLabel={`${kindLabel}, ${formatDateInput(contribution.date)}, ${amountText}`}
                  style={[styles.contribution, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{kindLabel}</AppText>
                    <AppText variant="caption" tone="muted">
                      {formatDateInput(contribution.date)}
                    </AppText>
                  </View>
                  <AppText variant="money" style={isWithdrawal ? undefined : { color: colors.income }}>
                    {amountText}
                  </AppText>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  summary: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.cardLarge, borderWidth: 1 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  money: { fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
  section: { gap: spacing.sm },
  contribution: {
    minHeight: MIN_TOUCH_SIZE + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
  },
});

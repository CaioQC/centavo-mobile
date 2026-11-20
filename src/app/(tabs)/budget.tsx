import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Clock, Target } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildMonthBudget } from '@/core/budget';
import { currentMonth, todayLocal, type YearMonth } from '@/core/dates';
import { formatCents } from '@/core/money';
import type { Database } from '@/data/database';
import {
  copyPreviousMonthLimitsIfNew,
  listBudgetLimits,
  listCategories,
  listTransactionsByBudgetMonth,
} from '@/data/repositories';
import { useDbQuery } from '@/data/useDbQuery';
import { BudgetBar } from '@/features/budget/BudgetBar';
import { BudgetRow } from '@/features/budget/BudgetRow';
import { usageText } from '@/features/budget/usageText';
import { MonthSelector } from '@/features/statement/MonthSelector';
import { AppText, Card, EmptyState, QueryFallback, Screen, TAB_BAR_CLEARANCE } from '@/shared/components';
import { radius, spacing, useTheme } from '@/shared/theme';

export default function BudgetScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState<YearMonth>(() => currentMonth());

  const load = useCallback(
    async (db: Database) => {
      // Mês novo: traz os limites do mês anterior (uma vez por mês).
      await copyPreviousMonthLimitsIfNew(db, month);
      const [categories, limits, transactions] = await Promise.all([
        listCategories(db, 'EXPENSE'),
        listBudgetLimits(db, month),
        listTransactionsByBudgetMonth(db, month),
      ]);
      return { categories, limits, transactions };
    },
    [month],
  );
  const result = useDbQuery(load);
  const data = result.data;

  const budget = useMemo(
    () =>
      data
        ? buildMonthBudget(
            data.categories.map((category) => category.id),
            data.limits,
            data.transactions,
            todayLocal(),
          )
        : null,
    [data],
  );

  const bottomInset = TAB_BAR_CLEARANCE + insets.bottom;
  const header = <MonthSelector month={month} onChange={setMonth} />;

  if (!data || !budget) {
    return (
      <Screen title="Orçamento" bottomInset={bottomInset}>
        <View style={styles.loading}>
          {header}
          <QueryFallback status={result.status} errorTitle="Não foi possível carregar o orçamento" onRetry={result.reload} />
        </View>
      </Screen>
    );
  }

  const hasLimits = budget.totalLimitInCents > 0;

  return (
    <Screen title="Orçamento" bottomInset={bottomInset} scroll gap={spacing.md}>
      {header}

      <Card
        large
        style={styles.summary}
        accessibilityLabel={
          (hasLimits
            ? `Gasto do mês ${formatCents(budget.spentInCents)} de ${formatCents(budget.totalLimitInCents)}, ${usageText(budget.usage)}`
            : `Gasto do mês ${formatCents(budget.spentInCents)}, nenhum limite definido`) +
          (budget.committedInCents > 0 ? `, já comprometido ${formatCents(budget.committedInCents)}` : '')
        }
      >
        <AppText variant="caption" tone="muted">
          Gasto no mês
        </AppText>
        <AppText variant="titleMoney">
          {formatCents(budget.spentInCents)}
        </AppText>
        {hasLimits ? (
          <>
            <BudgetBar usage={budget.usage} color={colors.accent} />
            <View style={styles.summaryFooter}>
              <AppText variant="captionMoney" tone="muted">
                de {formatCents(budget.totalLimitInCents)} de orçamento
              </AppText>
              <AppText
                variant="caption"
                style={{
                  color: budget.usage.status === 'OVER' ? colors.over : budget.usage.status === 'WARNING' ? colors.warn : colors.muted,
                }}
              >
                {usageText(budget.usage)}
              </AppText>
            </View>
          </>
        ) : (
          <AppText variant="caption" tone="muted">
            Nenhum limite definido neste mês. Toque numa categoria para definir.
          </AppText>
        )}
        {budget.committedInCents > 0 ? (
          <View style={[styles.committed, { backgroundColor: colors.track }]}>
            <Clock size={16} color={colors.accentText} strokeWidth={2} />
            <AppText variant="captionMoney" tone="accent">
              Já comprometido {formatCents(budget.committedInCents)}
            </AppText>
          </View>
        ) : null}
      </Card>

      {data.categories.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma categoria de despesa"
          message="O orçamento é feito por categoria de despesa, e nenhuma foi encontrada neste aparelho."
          actionLabel="Tentar de novo"
          onAction={result.reload}
        />
      ) : null}

      {data.categories.map((category, index) => (
        <BudgetRow
          key={category.id}
          category={category}
          line={budget.lines[index]!}
          onPress={() => router.push({ pathname: '/edit-limit', params: { month, categoryId: category.id } })}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { gap: spacing.md },
  summary: { gap: spacing.sm, padding: spacing.lg },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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

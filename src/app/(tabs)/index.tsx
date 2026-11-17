import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { House, Landmark, Settings, TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { totalBalance } from '@/core/accounts';
import { buildMonthBudget, settledTransactions } from '@/core/budget';
import { currentMonth, todayLocal } from '@/core/dates';
import { formatMonthLabel } from '@/core/labels';
import { formatCents } from '@/core/money';
import { topSpendingCategories } from '@/core/spending';
import type { Database } from '@/data/database';
import {
  copyPreviousMonthLimitsIfNew,
  listAccountsWithBalance,
  listBudgetLimits,
  listCategories,
  listRecentTransactions,
  listTransactionsByBudgetMonth,
} from '@/data/repositories';
import { useDbQuery } from '@/data/useDbQuery';
import { ShortcutRow } from '@/features/home/ShortcutRow';
import { SpendingRing } from '@/features/home/SpendingRing';
import { TransactionRow } from '@/features/statement/TransactionRow';
import { AppText, CategoryBadge, EmptyState, Screen, TAB_BAR_CLEARANCE } from '@/shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '@/shared/theme';

const RECENT_COUNT = 5;
const TOP_CATEGORIES = 3;

async function loadHome(db: Database) {
  const month = currentMonth();
  // Mês novo: os limites do mês anterior já valem aqui, sem esperar o usuário abrir o Orçamento.
  await copyPreviousMonthLimitsIfNew(db, month);
  const [accounts, categories, monthTransactions, recent, limits] = await Promise.all([
    listAccountsWithBalance(db),
    listCategories(db),
    listTransactionsByBudgetMonth(db, month),
    listRecentTransactions(db, todayLocal(), RECENT_COUNT),
    listBudgetLimits(db, month),
  ]);
  return { month, accounts, categories, monthTransactions, recent, limits };
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = TAB_BAR_CLEARANCE + insets.bottom;
  const load = useCallback((db: Database) => loadHome(db), []);
  const result = useDbQuery(load);
  const data = result.data;

  const summary = useMemo(() => {
    if (!data) return null;
    const today = todayLocal();
    const expenseIds = data.categories.filter((category) => category.kind === 'EXPENSE').map((c) => c.id);
    // Mesmas regras da tela Orçamento: gasto por budget_month, sem o que ainda é só "já comprometido".
    const budget = buildMonthBudget(expenseIds, data.limits, data.monthTransactions, today);
    return {
      balanceInCents: totalBalance(data.accounts),
      spentInCents: budget.spentInCents,
      budgetInCents: budget.totalLimitInCents,
      usage: budget.usage,
      top: topSpendingCategories(settledTransactions(data.monthTransactions, today), new Set(expenseIds), TOP_CATEGORIES),
      categoriesById: new Map(data.categories.map((category) => [category.id, category])),
    };
  }, [data]);

  if (!data || !summary) {
    return (
      <Screen title="Início" bottomInset={bottomInset}>
        {result.status === 'error' ? (
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar o início"
            message="Algo deu errado ao ler os dados do aparelho. Tente de novo."
            actionLabel="Tentar de novo"
            onAction={result.reload}
          />
        ) : (
          <ActivityIndicator accessibilityLabel="Carregando" color={colors.muted} />
        )}
      </Screen>
    );
  }

  const shortcuts = (
    <>
      <ShortcutRow
        icon={Landmark}
        title="Contas e conexões"
        subtitle="Saldo de cada conta"
        onPress={() => router.push('/accounts')}
      />
      <ShortcutRow
        icon={Settings}
        title="Ajustes"
        subtitle="Biometria, tema e dados de exemplo"
        onPress={() => router.push('/settings')}
      />
    </>
  );

  if (data.accounts.length === 0) {
    return (
      <Screen title="Início" bottomInset={bottomInset}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <EmptyState
            icon={House}
            title="Nenhuma conta ainda"
            message="Crie uma conta manual ou restaure os dados de exemplo em Ajustes para ver seu saldo e o gasto do mês."
            actionLabel="Nova conta manual"
            onAction={() => router.push('/new-account')}
          />
          {shortcuts}
        </ScrollView>
      </Screen>
    );
  }

  const { usage } = summary;
  const ringColor = usage.status === 'OVER' ? colors.over : usage.status === 'WARNING' ? colors.warn : colors.accent;
  const statusColor = usage.status === 'OVER' ? colors.over : usage.status === 'WARNING' ? colors.warn : colors.muted;
  const statusText =
    usage.status === 'OVER'
      ? `Estourou · ${usage.percent}%`
      : usage.status === 'WARNING'
        ? `Atenção · ${usage.percent}%`
        : `${usage.percent}% usado`;
  const monthName = formatMonthLabel(data.month);
  const accountCount = data.accounts.length;

  return (
    <Screen title="Início" bottomInset={bottomInset}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View
          accessible
          accessibilityLabel={`Saldo das contas, ${formatCents(summary.balanceInCents)}`}
          style={[styles.balance, { backgroundColor: colors.accent }]}
        >
          <AppText variant="caption" style={{ color: colors.onAccent }}>
            Saldo das contas
          </AppText>
          <AppText variant="title" style={[styles.money, { color: colors.onAccent }]}>
            {formatCents(summary.balanceInCents)}
          </AppText>
          <AppText variant="caption" style={{ color: colors.onAccent }}>
            {accountCount === 1 ? '1 conta' : `${accountCount} contas`}, com a fatura do cartão descontada
          </AppText>
        </View>

        <View style={[styles.card, styles.spendingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SpendingRing
            ratio={usage.ratio}
            color={ringColor}
            label={usage.status === 'NONE' ? '—' : `${usage.percent}%`}
          />
          <View style={styles.spendingText}>
            <AppText variant="caption" tone="muted">
              Gasto em {monthName}
            </AppText>
            <AppText variant="heading" style={styles.money}>
              {formatCents(summary.spentInCents)}
            </AppText>
            {usage.status === 'NONE' ? (
              <AppText variant="caption" tone="muted">
                Sem orçamento definido para este mês.
              </AppText>
            ) : (
              <>
                <AppText variant="captionMoney" tone="muted">
                  de {formatCents(summary.budgetInCents)} de orçamento
                </AppText>
                <AppText variant="caption" style={{ color: statusColor }}>
                  {statusText}
                </AppText>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            Onde mais gastou
          </AppText>
          {summary.top.length === 0 ? (
            <AppText tone="muted">Nenhum gasto em {monthName} ainda.</AppText>
          ) : (
            summary.top.map((entry) => {
              const category = entry.categoryId ? summary.categoriesById.get(entry.categoryId) : undefined;
              const name = category?.name ?? 'Sem categoria';
              return (
                <View
                  key={entry.categoryId ?? 'none'}
                  accessible
                  accessibilityLabel={`${name}, ${formatCents(entry.totalInCents)}`}
                  style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <CategoryBadge icon={category?.icon} color={category?.color} />
                  <AppText variant="bodyStrong" style={styles.rowName} numberOfLines={1}>
                    {name}
                  </AppText>
                  <AppText variant="money">{formatCents(entry.totalInCents)}</AppText>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="heading" accessibilityRole="header">
              Últimas transações
            </AppText>
            {data.recent.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => router.navigate('/statement')} style={styles.link}>
                <AppText tone="accent" variant="bodyStrong">
                  Ver extrato
                </AppText>
              </Pressable>
            ) : null}
          </View>
          {data.recent.length === 0 ? (
            <EmptyState
              icon={House}
              title="Nenhuma transação ainda"
              message="Os lançamentos aparecem aqui assim que você registrar o primeiro."
              actionLabel="Novo lançamento"
              onAction={() => router.push('/new-transaction')}
            />
          ) : (
            data.recent.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                category={transaction.categoryId ? summary.categoriesById.get(transaction.categoryId) : undefined}
                onPress={() => router.push(`/transaction/${transaction.id}`)}
              />
            ))
          )}
        </View>

        <View style={styles.section}>{shortcuts}</View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingBottom: spacing.lg },
  balance: { padding: spacing.xl, borderRadius: radius.cardLarge, gap: spacing.xs },
  money: { fontVariant: ['tabular-nums'] },
  card: { padding: spacing.lg, borderRadius: radius.card, borderWidth: 1 },
  spendingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  spendingText: { flex: 1, gap: spacing.xs },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { minHeight: MIN_TOUCH_SIZE, justifyContent: 'center' },
  row: {
    minHeight: MIN_TOUCH_SIZE + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  rowName: { flex: 1 },
});

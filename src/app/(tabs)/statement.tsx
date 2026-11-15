import { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ReceiptText, Search, TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentMonth, todayLocal, type YearMonth } from '@/core/dates';
import { formatDayLabel, formatMonthLabel } from '@/core/labels';
import { formatCents, formatSignedCents } from '@/core/money';
import { filterStatement, groupByDay, summarizeStatement } from '@/core/statement';
import { listAccounts, listCategories, listTransactionsByMonth } from '@/data/repositories';
import type { Database } from '@/data/database';
import { useDbQuery } from '@/data/useDbQuery';
import { MonthSelector } from '@/features/statement/MonthSelector';
import { StatementFilters } from '@/features/statement/StatementFilters';
import { TransactionRow } from '@/features/statement/TransactionRow';
import { AppText, EmptyState, Screen, TAB_BAR_CLEARANCE } from '@/shared/components';
import { spacing, useTheme } from '@/shared/theme';

export default function StatementScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [month, setMonth] = useState<YearMonth>(() => currentMonth());
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(
    async (db: Database) => {
      const [transactions, accounts, categories] = await Promise.all([
        listTransactionsByMonth(db, month),
        listAccounts(db),
        listCategories(db),
      ]);
      return { transactions, accounts, categories };
    },
    [month],
  );
  const result = useDbQuery(load);

  const data = result.data;
  const categoriesById = useMemo(() => new Map((data?.categories ?? []).map((category) => [category.id, category])), [data]);
  const filtered = useMemo(
    () => filterStatement(data?.transactions ?? [], { accountId, categoryId, query }),
    [data, accountId, categoryId, query],
  );
  const sections = useMemo(
    () => {
      const today = todayLocal();
      return groupByDay(filtered).map((group) => ({
        key: group.date,
        title: formatDayLabel(group.date, today),
        totalInCents: group.totalInCents,
        data: group.items,
      }));
    },
    [filtered],
  );
  const summary = useMemo(() => summarizeStatement(filtered), [filtered]);

  const hasFilters = accountId !== null || categoryId !== null || query.trim() !== '';
  const clearFilters = () => {
    setAccountId(null);
    setCategoryId(null);
    setQuery('');
  };

  const header = (
    <View style={styles.header}>
      <MonthSelector month={month} onChange={setMonth} />
      <StatementFilters
        accounts={data?.accounts ?? []}
        categories={data?.categories ?? []}
        accountId={accountId}
        categoryId={categoryId}
        query={query}
        onAccountChange={setAccountId}
        onCategoryChange={setCategoryId}
        onQueryChange={setQuery}
      />
      {data && filtered.length > 0 ? (
        <View style={styles.summary} accessible accessibilityLabel={`Entradas ${formatCents(summary.incomeInCents)}, saídas ${formatCents(summary.expenseInCents)}`}>
          <AppText variant="caption" tone="muted">
            Entradas <AppText variant="captionMoney" style={{ color: colors.income }}>{formatCents(summary.incomeInCents)}</AppText>
          </AppText>
          <AppText variant="caption" tone="muted">
            Saídas <AppText variant="captionMoney">{formatCents(summary.expenseInCents)}</AppText>
          </AppText>
        </View>
      ) : null}
    </View>
  );

  let empty = null; // enquanto a primeira carga não termina, a lista fica em branco
  if (result.status === 'error' && !data) {
    empty = (
      <EmptyState
        icon={TriangleAlert}
        title="Não foi possível carregar o extrato"
        message="Algo deu errado ao ler os lançamentos do aparelho. Tente de novo."
        actionLabel="Tentar de novo"
        onAction={result.reload}
      />
    );
  } else if (!data) {
    empty = null;
  } else if (hasFilters) {
    empty = (
      <EmptyState
        icon={Search}
        title="Nada encontrado"
        message="Nenhum lançamento deste mês combina com a busca e os filtros."
        actionLabel="Limpar filtros"
        onAction={clearFilters}
      />
    );
  } else {
    empty = (
      <EmptyState
        icon={ReceiptText}
        title="Nenhum lançamento neste mês"
        message={`Os lançamentos de ${formatMonthLabel(month).toLowerCase()} aparecem aqui, agrupados por dia.`}
        actionLabel="Novo lançamento"
        onAction={() => router.push('/new-transaction')}
      />
    );
  }

  return (
    <Screen title="Extrato">
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        ListEmptyComponent={empty ?? undefined}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + insets.bottom + spacing.lg }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={Separator}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader} accessibilityRole="header">
            <AppText variant="bodyStrong">{section.title}</AppText>
            <AppText variant="captionMoney" tone="muted">
              {formatSignedCents(section.totalInCents)}
            </AppText>
          </View>
        )}
        renderItem={({ item }) => <TransactionRow transaction={item} category={item.categoryId ? categoriesById.get(item.categoryId) : undefined} onPress={() => router.push(`/transaction/${item.id}`)} />}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: spacing.sm }} />;
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingBottom: spacing.sm },
  summary: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});

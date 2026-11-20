import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ReceiptText, TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatFullDate, formatInstallment } from '@/core/labels';
import { formatSignedCents } from '@/core/money';
import type { Database } from '@/data/database';
import {
  deleteManualTransaction,
  getTransaction,
  listCategories,
  updateTransactionCategory,
  updateTransactionNote,
} from '@/data/repositories';
import { useDatabase, useDbQuery } from '@/data/useDbQuery';
import { NoteEditor } from '@/features/transaction/NoteEditor';
import { AppText, Button, EmptyState, Screen, SelectField, type SelectOption } from '@/shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '@/shared/theme';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const db = useDatabase();

  const load = useCallback(
    async (database: Database) => {
      const [transaction, categories] = await Promise.all([getTransaction(database, id), listCategories(database)]);
      return { transaction, categories };
    },
    [id],
  );
  const result = useDbQuery(load);
  const transaction = result.data?.transaction ?? null;
  const categories = result.data?.categories;

  const categoryOptions = useMemo<SelectOption[]>(() => {
    if (!transaction || !categories) return [];
    const kind = transaction.amountInCents > 0 ? 'INCOME' : 'EXPENSE';
    const options: SelectOption[] = categories
      // Um estorno (valor positivo) pode ter categoria de despesa: a atual sempre aparece na lista.
      .filter((category) => category.kind === kind || category.id === transaction.categoryId)
      .map((category) => ({
        value: category.id,
        label: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
      }));
    return transaction.categoryId === null ? [{ value: null, label: 'Sem categoria' }, ...options] : options;
  }, [transaction, categories]);

  const goBack = () => router.back();

  if (!result.data) {
    return (
      <Screen title="Transação" onBack={goBack}>
        {result.status === 'error' ? (
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar o lançamento"
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

  if (!transaction) {
    return (
      <Screen title="Transação" onBack={goBack}>
        <EmptyState
          icon={ReceiptText}
          title="Lançamento não encontrado"
          message="Ele pode ter sido excluído. Volte ao extrato para ver os lançamentos."
          actionLabel="Voltar ao extrato"
          onAction={goBack}
        />
      </Screen>
    );
  }

  const isManual = transaction.source === 'MANUAL';
  const installment = formatInstallment(transaction.installmentNumber, transaction.totalInstallments);
  const isInstallment = transaction.totalInstallments !== null && transaction.totalInstallments > 1;
  const amountColor = transaction.amountInCents > 0 ? colors.income : colors.text;

  const changeCategory = async (categoryId: string | null) => {
    if (categoryId === null || categoryId === transaction.categoryId) return;
    try {
      await updateTransactionCategory(db, transaction.id, categoryId);
      result.reload();
    } catch {
      Alert.alert('Não foi possível trocar a categoria', 'Tente de novo.');
    }
  };

  const saveNote = async (note: string) => {
    await updateTransactionNote(db, transaction.id, note);
  };

  const remove = async () => {
    try {
      await deleteManualTransaction(db, transaction.id);
      router.back();
    } catch {
      Alert.alert('Não foi possível excluir', 'Tente de novo.');
    }
  };

  const confirmRemove = () => {
    const total = transaction.totalInstallments ?? 1;
    Alert.alert(
      'Excluir lançamento?',
      isInstallment
        ? `Esta compra tem ${total} parcelas, e todas serão excluídas. Não dá para desfazer.`
        : 'Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: remove },
      ],
    );
  };

  const rows: { label: string; value: string }[] = [
    { label: 'Conta', value: transaction.accountName },
    { label: 'Data', value: formatFullDate(transaction.date) },
    ...(installment && isInstallment
      ? [{ label: 'Parcela', value: `${transaction.installmentNumber} de ${transaction.totalInstallments}` }]
      : []),
    { label: 'Origem', value: isManual ? 'Lançamento manual' : 'Importado do banco' },
  ];

  return (
    <Screen title="Transação" onBack={goBack}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View style={styles.summary}>
          <AppText variant="title" style={[styles.amount, { color: amountColor }]} accessibilityLabel={formatSignedCents(transaction.amountInCents)}>
            {formatSignedCents(transaction.amountInCents)}
          </AppText>
          <AppText variant="heading">{transaction.description}</AppText>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {rows.map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <AppText tone="muted">{row.label}</AppText>
              <AppText variant="bodyStrong" style={styles.infoValue}>
                {row.value}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.selectRow}>
            <SelectField
              label="Categoria"
              sheetTitle="Escolher categoria"
              value={transaction.categoryId}
              options={categoryOptions}
              onChange={changeCategory}
            />
          </View>
          <AppText variant="caption" tone="muted">
            {transaction.categorySource === 'MANUAL'
              ? 'Você escolheu esta categoria; uma nova importação não a altera.'
              : 'Categoria vinda do banco. Toque para trocar por outra.'}
          </AppText>
        </View>

        <NoteEditor key={transaction.id} initial={transaction.note ?? ''} onSave={saveNote} />

        {isManual ? (
          <Button
            label={isInstallment ? 'Excluir compra parcelada' : 'Excluir lançamento'}
            variant="danger"
            onPress={confirmRemove}
          />
        ) : (
          <AppText variant="caption" tone="muted" style={styles.note}>
            Lançamentos importados do banco não podem ser excluídos; só recategorizados e anotados.
          </AppText>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  summary: { gap: spacing.xs },
  amount: { fontVariant: ['tabular-nums'] },
  card: { borderRadius: radius.card, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  infoRow: {
    minHeight: MIN_TOUCH_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  infoValue: { flexShrink: 1, textAlign: 'right' },
  section: { gap: spacing.sm },
  selectRow: { flexDirection: 'row' },
  note: { textAlign: 'center' },
});

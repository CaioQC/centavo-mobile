import { Pressable, StyleSheet, View } from 'react-native';

import { formatSignedCents } from '../../core/money';
import { formatInstallment } from '../../core/labels';
import type { Category, Transaction } from '../../data/types';
import { AppText, CategoryBadge } from '../../shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../../shared/theme';

interface TransactionRowProps {
  transaction: Transaction;
  category: Category | undefined;
  /** quando existe, a linha vira um botão (o detalhe da transação liga isto) */
  onPress?: () => void;
}

/** Linha do extrato: ícone da categoria, descrição, "categoria · conta · parcela" e o valor com sinal. */
export function TransactionRow({ transaction, category, onPress }: TransactionRowProps) {
  const { colors } = useTheme();
  const installment = formatInstallment(transaction.installmentNumber, transaction.totalInstallments);
  const subtitle = [category?.name ?? 'Sem categoria', transaction.accountName, installment]
    .filter((part): part is string => part !== null)
    .join(' · ');
  const isIncome = transaction.amountInCents > 0;
  const amountText = formatSignedCents(transaction.amountInCents);

  const content = (
    <>
      <CategoryBadge icon={category?.icon} color={category?.color} />
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {transaction.description}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <AppText variant="money" style={isIncome ? { color: colors.income } : undefined}>
        {amountText}
      </AppText>
    </>
  );

  const style = [styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }];
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={`${transaction.description}, ${subtitle}, ${amountText}`} style={style}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${transaction.description}, ${subtitle}, ${amountText}`}
      onPress={onPress}
      style={style}
    >
      {content}
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
  texts: { flex: 1 },
});

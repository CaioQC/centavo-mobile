import { formatSignedCents } from '../../core/money';
import { formatInstallment } from '../../core/labels';
import type { Category, Transaction } from '../../data/types';
import { AppText, CategoryBadge, ListRow } from '../../shared/components';
import { useTheme } from '../../shared/theme';

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

  return (
    <ListRow
      leading={<CategoryBadge icon={category?.icon} color={category?.color} />}
      title={transaction.description}
      subtitle={subtitle}
      subtitleLines={1}
      trailing={
        <AppText variant="money" style={isIncome ? { color: colors.income } : undefined}>
          {amountText}
        </AppText>
      }
      accessibilityLabel={`${transaction.description}, ${subtitle}, ${amountText}`}
      onPress={onPress}
    />
  );
}

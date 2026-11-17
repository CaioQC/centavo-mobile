import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { CreditCard, Landmark, Wallet, type LucideProps } from 'lucide-react-native';

import { formatCents } from '../../core/money';
import type { AccountType, AccountWithBalance } from '../../data/types';
import { AppText } from '../../shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../../shared/theme';

const TYPE_LABEL: Record<AccountType, string> = {
  BANK: 'Conta',
  CREDIT_CARD: 'Cartão de crédito',
  CASH: 'Dinheiro',
};
const TYPE_ICON: Record<AccountType, ComponentType<LucideProps>> = {
  BANK: Landmark,
  CREDIT_CARD: CreditCard,
  CASH: Wallet,
};

/** Linha de uma conta: ícone do tipo, nome, tipo (e limite, no cartão) e saldo. */
export function AccountRow({ account }: { account: AccountWithBalance }) {
  const { colors } = useTheme();
  const Icon = TYPE_ICON[account.type];
  const subtitle =
    account.type === 'CREDIT_CARD' && account.creditLimitInCents !== null
      ? `${TYPE_LABEL[account.type]} · limite ${formatCents(account.creditLimitInCents)}`
      : TYPE_LABEL[account.type];
  const balanceText = formatCents(account.balanceInCents);
  return (
    <View
      accessible
      accessibilityLabel={`${account.name}, ${subtitle}, saldo ${balanceText}`}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <View style={[styles.icon, { backgroundColor: colors.track }]}>
        <Icon size={20} color={colors.muted} strokeWidth={1.75} />
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {account.name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <AppText variant="money">{balanceText}</AppText>
    </View>
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
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.categoryIcon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
});

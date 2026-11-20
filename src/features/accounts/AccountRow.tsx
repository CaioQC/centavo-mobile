import type { ComponentType } from 'react';
import { CreditCard, Landmark, Wallet, type LucideProps } from 'lucide-react-native';

import { formatCents } from '../../core/money';
import type { AccountType, AccountWithBalance } from '../../data/types';
import { AppText, ListRow } from '../../shared/components';

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
  const subtitle =
    account.type === 'CREDIT_CARD' && account.creditLimitInCents !== null
      ? `${TYPE_LABEL[account.type]} · limite ${formatCents(account.creditLimitInCents)}`
      : TYPE_LABEL[account.type];
  const balanceText = formatCents(account.balanceInCents);
  return (
    <ListRow
      icon={TYPE_ICON[account.type]}
      title={account.name}
      subtitle={subtitle}
      subtitleVariant={account.type === 'CREDIT_CARD' ? 'captionMoney' : 'caption'}
      subtitleLines={1}
      trailing={<AppText variant="money">{balanceText}</AppText>}
      accessibilityLabel={`${account.name}, ${subtitle}, saldo ${balanceText}`}
    />
  );
}

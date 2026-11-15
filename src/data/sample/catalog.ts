import type { AccountType } from '../types';

// Banco, contas e valores 100% inventados: o nome não imita nenhuma instituição real (CLAUDE.md).

export const SAMPLE_INSTITUTION = { key: 'jabuticaba', name: 'Banco Jabuticaba' } as const;

export interface SampleAccount {
  /** ID da conta no banco fictício (único por conexão) */
  externalId: string;
  name: string;
  type: AccountType;
  initialBalanceInCents: number;
  creditLimitInCents: number | null;
}

export const SAMPLE_CHECKING_ID = 'cc-0001';
export const SAMPLE_CARD_ID = 'cartao-0001';

export const SAMPLE_ACCOUNTS: SampleAccount[] = [
  {
    externalId: SAMPLE_CHECKING_ID,
    name: 'Conta Corrente',
    type: 'BANK',
    initialBalanceInCents: 180000,
    creditLimitInCents: null,
  },
  {
    externalId: SAMPLE_CARD_ID,
    name: 'Cartão Jabuticaba',
    type: 'CREDIT_CARD',
    initialBalanceInCents: 0,
    creditLimitInCents: 600000,
  },
];

import type { BankAccount } from '../banks/types';

// Banco, contas e valores 100% inventados: o nome não imita nenhuma instituição real (CLAUDE.md).

export const SAMPLE_INSTITUTION = { key: 'jabuticaba', name: 'Banco Jabuticaba' } as const;

/**
 * Chave em `settings` com o dia que ancora os dados de exemplo (o "hoje" da primeira importação).
 * Reimportar usa sempre a mesma âncora: as chaves e os valores não mudam, então restaurar os
 * dados em outro mês não duplica a compra parcelada nem altera valores já gravados.
 */
export const SAMPLE_DATA_ANCHOR_KEY = 'sample_data_anchor';

export type SampleAccount = BankAccount;

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

/** Limites do orçamento do mês corrente nos dados de exemplo, por categoria de despesa (centavos). */
export const SAMPLE_BUDGET_LIMITS: Record<string, number> = {
  housing: 220000,
  food: 100000,
  transport: 60000,
  health: 20000,
  leisure: 15000,
  subscriptions: 8000,
  shopping: 25000,
  education: 15000,
};

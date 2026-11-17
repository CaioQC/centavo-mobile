import type { LocalDate, YearMonth } from '../core/dates';

// Tipos das linhas do SQLite (docs/mobile/modelo-de-dados.md), em camelCase.

export type AccountType = 'BANK' | 'CREDIT_CARD' | 'CASH';
export type Source = 'SIMULATED' | 'MANUAL';
export type CategoryKind = 'EXPENSE' | 'INCOME';
export type CategorySource = 'IMPORT' | 'MANUAL';

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  /** nome do ícone Lucide */
  icon: string;
  /** chave de cor do tema (CategoryColorKey) */
  color: string;
}

export interface Account {
  id: string;
  connectionId: string | null;
  source: Source;
  externalId: string | null;
  name: string;
  type: AccountType;
  initialBalanceInCents: number;
  creditLimitInCents: number | null;
  /** nome do banco da conexão simulada; nulo nas contas manuais */
  institutionName: string | null;
}

/** Conta com o saldo já calculado (saldo inicial + soma das transações). */
export interface AccountWithBalance extends Account {
  balanceInCents: number;
}

export interface Connection {
  id: string;
  institutionKey: string;
  institutionName: string;
  connectedAt: string;
  lastSyncedAt: string | null;
}

/** Transação já com o nome e o tipo da conta (as telas sempre mostram os dois). */
export interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  accountType: AccountType;
  source: Source;
  externalId: string | null;
  description: string;
  /** negativo para despesa, positivo para receita e estorno */
  amountInCents: number;
  date: LocalDate;
  budgetMonth: YearMonth;
  categoryId: string | null;
  categorySource: CategorySource;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  note: string | null;
  createdAt: string;
}

/** Dados para gravar uma transação; o ID e o `createdAt` são gerados pelo repositório. */
export interface NewTransaction {
  accountId: string;
  source: Source;
  externalId: string | null;
  description: string;
  amountInCents: number;
  date: LocalDate;
  budgetMonth: YearMonth;
  categoryId: string | null;
  categorySource: CategorySource;
  installmentGroupId?: string | null;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
  note?: string | null;
}

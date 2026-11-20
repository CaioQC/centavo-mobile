// Orçamento do mês (docs/fluxos/orcamento-do-mes.md, ADR 11). Funções puras: o repositório traz as transações
// com `budget_month` igual ao mês e os limites, e aqui saem o gasto, o "já comprometido" e o status por categoria.

import type { LocalDate } from './dates';
import { budgetUsage, totalSpending, type BudgetUsage } from './spending';

export interface BudgetTransaction {
  /** negativo para despesa, positivo para receita e estorno */
  amountInCents: number;
  categoryId: string | null;
  date: LocalDate;
  /** número da parcela; nulo na compra à vista */
  installmentNumber: number | null;
}

export interface BudgetLimit {
  categoryId: string;
  limitInCents: number;
}

/**
 * "Já comprometido": parcela (a partir da 2ª) de uma compra no cartão que ainda não chegou na data.
 * É dinheiro que já está devido, mas que ainda não saiu; quando a data passa, vira gasto.
 */
export function isCommitted(transaction: BudgetTransaction, today: LocalDate): boolean {
  return (
    transaction.amountInCents < 0 &&
    transaction.installmentNumber !== null &&
    transaction.installmentNumber > 1 &&
    transaction.date > today
  );
}

/** As transações que já aconteceram (tudo menos o "já comprometido"): é o que conta como gasto. */
export function settledTransactions<T extends BudgetTransaction>(transactions: readonly T[], today: LocalDate): T[] {
  return transactions.filter((transaction) => !isCommitted(transaction, today));
}

export interface CategoryBudgetLine {
  categoryId: string;
  /** nulo = sem limite definido neste mês */
  limitInCents: number | null;
  /** gasto da categoria, com os estornos abatidos; nunca negativo */
  spentInCents: number;
  committedInCents: number;
  /** limite − gasto − já comprometido (negativo = passou do limite); nulo sem limite */
  availableInCents: number | null;
  usage: BudgetUsage;
}

export interface MonthBudget {
  /** uma linha por categoria de despesa, na ordem recebida */
  lines: CategoryBudgetLine[];
  /** soma dos limites definidos */
  totalLimitInCents: number;
  /** gasto do mês inteiro, inclusive de transações sem categoria */
  spentInCents: number;
  committedInCents: number;
  /** gasto contra o orçamento total */
  usage: BudgetUsage;
}

/**
 * Monta o orçamento do mês. `transactions` são as do mês (`budget_month`); estorno em categoria de despesa abate o gasto;
 * receita fica de fora. Compra no cartão em N vezes conta uma parcela por mês, e as parcelas ainda não vencidas
 * aparecem como "já comprometido", não como gasto.
 */
export function buildMonthBudget(
  expenseCategoryIds: readonly string[],
  limits: readonly BudgetLimit[],
  transactions: readonly BudgetTransaction[],
  today: LocalDate,
): MonthBudget {
  const expenseIds = new Set(expenseCategoryIds);
  const limitByCategory = new Map(limits.map((limit) => [limit.categoryId, limit.limitInCents]));
  const settled = settledTransactions(transactions, today);
  const committed = transactions.filter((transaction) => isCommitted(transaction, today));

  const lines = expenseCategoryIds.map((categoryId): CategoryBudgetLine => {
    const limitInCents = limitByCategory.get(categoryId) ?? null;
    const spentInCents = totalSpending(
      settled.filter((transaction) => transaction.categoryId === categoryId),
      expenseIds,
    );
    const committedInCents = committed
      .filter((transaction) => transaction.categoryId === categoryId)
      .reduce((sum, transaction) => sum - transaction.amountInCents, 0);
    return {
      categoryId,
      limitInCents,
      spentInCents,
      committedInCents,
      availableInCents: limitInCents === null ? null : limitInCents - spentInCents - committedInCents,
      usage: budgetUsage(spentInCents, limitInCents ?? 0),
    };
  });

  const totalLimitInCents = lines.reduce((sum, line) => sum + (line.limitInCents ?? 0), 0);
  // O total é a soma das linhas (cada uma já sem negativo) mais as despesas fora delas (sem categoria ou de categoria
  // desconhecida); estorno de uma categoria nunca abate o gasto de outra.
  const outsideLines = settled.filter((transaction) => transaction.categoryId === null || !expenseIds.has(transaction.categoryId));
  const spentInCents =
    lines.reduce((sum, line) => sum + line.spentInCents, 0) + totalSpending(outsideLines, new Set<string>());
  const committedInCents = committed.reduce((sum, transaction) => sum - transaction.amountInCents, 0);
  return {
    lines,
    totalLimitInCents,
    spentInCents,
    committedInCents,
    usage: budgetUsage(spentInCents, totalLimitInCents),
  };
}

/** Limites do mês anterior que o mês novo ainda não tem: são esses que a cópia grava (nunca sobrescreve um limite já definido). */
export function limitsToCopy(previous: readonly BudgetLimit[], current: readonly BudgetLimit[]): BudgetLimit[] {
  const existing = new Set(current.map((limit) => limit.categoryId));
  return previous.filter((limit) => !existing.has(limit.categoryId) && limit.limitInCents > 0);
}

export const MAX_LIMIT_IN_CENTS = 99_999_999_999;

/** Mensagem de erro do limite digitado (`null` = válido). Zero é válido e remove o limite. */
export function validateLimit(limitInCents: number): string | null {
  if (!Number.isSafeInteger(limitInCents) || limitInCents < 0) return 'Informe um limite válido, de zero para cima.';
  if (limitInCents > MAX_LIMIT_IN_CENTS) return 'O limite é grande demais.';
  return null;
}

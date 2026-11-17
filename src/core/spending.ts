// Gasto do mês e ranking de categorias do Início. Funções puras sobre as transações que o repositório trouxe.

export interface SpendingItem {
  /** negativo para despesa, positivo para receita e estorno */
  amountInCents: number;
  categoryId: string | null;
}

/**
 * Quanto uma transação pesa no gasto: despesa (negativa) conta sempre; valor positivo só abate
 * o gasto quando é estorno numa categoria de despesa. Receita e positivo sem categoria ficam de fora.
 */
function spendingOf(item: SpendingItem, expenseCategoryIds: ReadonlySet<string>): number {
  if (item.amountInCents < 0) return -item.amountInCents;
  if (item.amountInCents > 0 && item.categoryId !== null && expenseCategoryIds.has(item.categoryId)) {
    return -item.amountInCents;
  }
  return 0;
}

/** Gasto das transações (positivo), com os estornos de categorias de despesa abatidos. Nunca é negativo. */
export function totalSpending(items: readonly SpendingItem[], expenseCategoryIds: ReadonlySet<string>): number {
  const total = items.reduce((sum, item) => sum + spendingOf(item, expenseCategoryIds), 0);
  return Math.max(total, 0);
}

export interface CategorySpending {
  /** nulo = transações sem categoria */
  categoryId: string | null;
  totalInCents: number;
}

/**
 * As categorias que mais gastaram, da maior para a menor (empate: pelo id, para a ordem não variar).
 * Categoria com gasto zero ou negativo (só estorno) não entra.
 */
export function topSpendingCategories(
  items: readonly SpendingItem[],
  expenseCategoryIds: ReadonlySet<string>,
  limit = 3,
): CategorySpending[] {
  const totals = new Map<string | null, number>();
  for (const item of items) {
    const value = spendingOf(item, expenseCategoryIds);
    if (value !== 0) totals.set(item.categoryId, (totals.get(item.categoryId) ?? 0) + value);
  }
  return [...totals.entries()]
    .filter(([, totalInCents]) => totalInCents > 0)
    .map(([categoryId, totalInCents]) => ({ categoryId, totalInCents }))
    .sort((a, b) => b.totalInCents - a.totalInCents || (a.categoryId ?? '').localeCompare(b.categoryId ?? ''))
    .slice(0, Math.max(limit, 0));
}

export type BudgetStatus = 'NONE' | 'OK' | 'WARNING' | 'OVER';

export interface BudgetUsage {
  status: BudgetStatus;
  /** gasto ÷ limite, de 0 em diante (pode passar de 1); 0 quando não há limite */
  ratio: number;
  /** percentual inteiro, arredondado para baixo: 82,9% → 82 */
  percent: number;
}

/**
 * Gasto contra o limite: a partir de 80% é "Atenção"; acima de 100%, "Estourou" (exatamente 100% ainda é "Atenção").
 * Sem limite (zero ou negativo) o status é `NONE`. */
export function budgetUsage(spentInCents: number, limitInCents: number): BudgetUsage {
  if (!Number.isFinite(limitInCents) || limitInCents <= 0) return { status: 'NONE', ratio: 0, percent: 0 };
  const spent = Math.max(spentInCents, 0);
  const ratio = spent / limitInCents;
  const percent = Math.floor((spent * 100) / limitInCents);
  const status: BudgetStatus = spent > limitInCents ? 'OVER' : spent * 5 >= limitInCents * 4 ? 'WARNING' : 'OK';
  return { status, ratio, percent };
}

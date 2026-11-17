import type { YearMonth } from '../../core/dates';
import type { Database } from '../database';

/** Soma dos limites de todas as categorias no mês: o orçamento total (0 se nada foi definido). */
export async function getTotalBudgetInCents(db: Database, month: YearMonth): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(limit_in_cents), 0) AS total FROM budgets WHERE month = ?',
    [month],
  );
  return row?.total ?? 0;
}

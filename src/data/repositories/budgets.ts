import { limitsToCopy, validateLimit, type BudgetLimit } from '../../core/budget';
import { addMonths, type YearMonth } from '../../core/dates';
import { newId } from '../ids';
import type { Database } from '../database';
import { getSetting, setSetting } from './settings';

/** Limites do mês, um por categoria de despesa. */
export function listBudgetLimits(db: Database, month: YearMonth): Promise<BudgetLimit[]> {
  return db.getAllAsync<BudgetLimit>(
    'SELECT category_id AS categoryId, limit_in_cents AS limitInCents FROM budgets WHERE month = ? ORDER BY rowid',
    [month],
  );
}

/**
 * Define o limite de uma categoria de despesa no mês; zero remove o limite.
 * Lança `RangeError` se o valor for inválido ou a categoria não existir ou não for de despesa (a tela valida antes).
 */
export async function setBudgetLimit(
  db: Database,
  month: YearMonth,
  categoryId: string,
  limitInCents: number,
): Promise<void> {
  if (validateLimit(limitInCents) !== null) throw new RangeError('Limite inválido.');
  const category = await db.getFirstAsync<{ kind: string }>('SELECT kind FROM categories WHERE id = ?', [categoryId]);
  if (category?.kind !== 'EXPENSE') throw new RangeError('Só categorias de despesa têm limite.');
  if (limitInCents === 0) {
    await db.runAsync('DELETE FROM budgets WHERE month = ? AND category_id = ?', [month, categoryId]);
    return;
  }
  await db.runAsync(
    `INSERT INTO budgets (id, month, category_id, limit_in_cents) VALUES (?, ?, ?, ?)
     ON CONFLICT (month, category_id) DO UPDATE SET limit_in_cents = excluded.limit_in_cents`,
    [newId(), month, categoryId, limitInCents],
  );
}

/** Grava o limite só se a categoria ainda não tem um no mês (dados de exemplo: nunca sobrescreve o que o usuário definiu). */
export async function insertBudgetLimitIfMissing(
  db: Database,
  month: YearMonth,
  categoryId: string,
  limitInCents: number,
): Promise<void> {
  await db.runAsync(
    'INSERT OR IGNORE INTO budgets (id, month, category_id, limit_in_cents) VALUES (?, ?, ?, ?)',
    [newId(), month, categoryId, limitInCents],
  );
}

const copiedKey = (month: YearMonth) => `budget_limits_copied:${month}`;

/**
 * Ao abrir um mês novo, copia os limites do mês anterior (só os que o mês ainda não tem). Acontece uma vez por mês:
 * depois de copiado, um limite que o usuário removeu não volta. Se o mês anterior não tem limites, nada é marcado e a
 * cópia pode acontecer numa abertura futura. Devolve quantos limites foram copiados.
 */
export function copyPreviousMonthLimitsIfNew(db: Database, month: YearMonth): Promise<number> {
  // Duas chamadas ao mesmo tempo (troca rápida de mês, Início e Orçamento) dividem a mesma execução: sem transação aninhada.
  const running = copying.get(month);
  if (running) return running;
  const task = copyLimits(db, month).finally(() => copying.delete(month));
  copying.set(month, task);
  return task;
}

const copying = new Map<YearMonth, Promise<number>>();

async function copyLimits(db: Database, month: YearMonth): Promise<number> {
  if ((await getSetting(db, copiedKey(month))) !== null) return 0;
  const previous = await listBudgetLimits(db, addMonths(month, -1));
  if (previous.length === 0) return 0;
  const toCopy = limitsToCopy(previous, await listBudgetLimits(db, month));
  await db.withTransactionAsync(async () => {
    for (const limit of toCopy) await insertBudgetLimitIfMissing(db, month, limit.categoryId, limit.limitInCents);
    await setSetting(db, copiedKey(month), 'true');
  });
  return toCopy.length;
}

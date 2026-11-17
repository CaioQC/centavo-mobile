import { monthRange, type YearMonth } from '../../core/dates';
import { buildManualTransactions, type NewTransactionForm } from '../../core/newTransaction';
import { newId } from '../ids';
import type { Database, SqlValue } from '../database';
import type { NewTransaction, Transaction } from '../types';

const SELECT = `SELECT t.id, t.account_id AS accountId, a.name AS accountName, a.type AS accountType, t.source,
    t.external_id AS externalId, t.description, t.amount_in_cents AS amountInCents, t.date,
    t.budget_month AS budgetMonth, t.category_id AS categoryId, t.category_source AS categorySource,
    t.installment_group_id AS installmentGroupId, t.installment_number AS installmentNumber,
    t.total_installments AS totalInstallments, t.note, t.created_at AS createdAt
  FROM transactions t JOIN accounts a ON a.id = t.account_id`;

const INSERT_COLUMNS = `id, account_id, source, external_id, description, amount_in_cents, date, budget_month,
  category_id, category_source, installment_group_id, installment_number, total_installments, note, created_at`;

/** Transação que veio do banco (simulado) não pode ser excluída pelo usuário. */
export class TransactionNotDeletableError extends Error {
  constructor() {
    super('Transação importada do banco não pode ser excluída.');
    this.name = 'TransactionNotDeletableError';
  }
}

/** Transações com `date` dentro do mês, as mais recentes primeiro. */
export function listTransactionsByMonth(db: Database, month: YearMonth): Promise<Transaction[]> {
  const { start, endExclusive } = monthRange(month);
  return db.getAllAsync<Transaction>(
    `${SELECT} WHERE t.date >= ? AND t.date < ? ORDER BY t.date DESC, t.created_at DESC, t.id`,
    [start, endExclusive],
  );
}

export function getTransaction(db: Database, id: string): Promise<Transaction | null> {
  return db.getFirstAsync<Transaction>(`${SELECT} WHERE t.id = ?`, [id]);
}

function insertParams(id: string, createdAt: string, data: NewTransaction): SqlValue[] {
  return [
    id,
    data.accountId,
    data.source,
    data.externalId,
    data.description,
    data.amountInCents,
    data.date,
    data.budgetMonth,
    data.categoryId,
    data.categorySource,
    data.installmentGroupId ?? null,
    data.installmentNumber ?? null,
    data.totalInstallments ?? null,
    data.note ?? null,
    createdAt,
  ];
}

const PLACEHOLDERS = '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?';

/** Grava todas as transações de uma vez (tudo ou nada) e devolve os IDs, na mesma ordem. */
export async function insertTransactions(db: Database, items: NewTransaction[]): Promise<string[]> {
  const createdAt = new Date().toISOString();
  const ids = items.map(() => newId());
  await db.withTransactionAsync(async () => {
    for (const [index, item] of items.entries()) {
      await db.runAsync(
        `INSERT INTO transactions (${INSERT_COLUMNS}) VALUES (${PLACEHOLDERS})`,
        insertParams(ids[index] as string, createdAt, item),
      );
    }
  });
  return ids;
}

/**
 * Importação do banco simulado: insere ou atualiza pelo `external_id` (único por conta), sem duplicar.
 * Nunca mexe no que é do usuário: a observação fica como está e a categoria só é atualizada
 * enquanto `category_source` não for `MANUAL` (ADR 07).
 */
export async function upsertImportedTransaction(db: Database, item: NewTransaction): Promise<void> {
  if (item.externalId === null) throw new Error('Transação importada precisa de external_id.');
  await db.runAsync(
    `INSERT INTO transactions (${INSERT_COLUMNS}) VALUES (${PLACEHOLDERS})
     ON CONFLICT (account_id, external_id) WHERE external_id IS NOT NULL DO UPDATE SET
       description = excluded.description,
       amount_in_cents = excluded.amount_in_cents,
       date = excluded.date,
       budget_month = excluded.budget_month,
       installment_number = excluded.installment_number,
       total_installments = excluded.total_installments,
       category_id = CASE WHEN transactions.category_source = 'MANUAL'
         THEN transactions.category_id ELSE excluded.category_id END`,
    insertParams(newId(), new Date().toISOString(), item),
  );
}

/** Recategoriza (a escolha do usuário vence a da importação) e devolve quantas linhas mudaram. */
export async function updateTransactionCategory(db: Database, id: string, categoryId: string): Promise<number> {
  const result = await db.runAsync(
    "UPDATE transactions SET category_id = ?, category_source = 'MANUAL' WHERE id = ?",
    [categoryId, id],
  );
  return result.changes;
}

/** Grava a observação; texto vazio apaga (vira nulo). */
export async function updateTransactionNote(db: Database, id: string, note: string): Promise<number> {
  const trimmed = note.trim();
  const result = await db.runAsync('UPDATE transactions SET note = ? WHERE id = ?', [
    trimmed === '' ? null : trimmed,
    id,
  ]);
  return result.changes;
}

/**
 * Exclui um lançamento manual; numa compra parcelada leva todas as parcelas.
 * Devolve quantas transações foram apagadas (0 se não existe). Lança
 * `TransactionNotDeletableError` se a transação veio do banco.
 */
export async function deleteManualTransaction(db: Database, id: string): Promise<number> {
  const row = await db.getFirstAsync<{ source: string; installmentGroupId: string | null }>(
    'SELECT source, installment_group_id AS installmentGroupId FROM transactions WHERE id = ?',
    [id],
  );
  if (!row) return 0;
  if (row.source !== 'MANUAL') throw new TransactionNotDeletableError();
  const result = row.installmentGroupId
    ? await db.runAsync('DELETE FROM transactions WHERE installment_group_id = ?', [row.installmentGroupId])
    : await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  return result.changes;
}

/**
 * Grava um lançamento manual. Compra parcelada grava as N parcelas de uma vez (tudo ou nada),
 * ligadas por `installment_group_id`, cada uma com a sua data e o seu `budget_month` (ADR 11).
 * A categoria vem da escolha do usuário, então entra como `MANUAL`. Devolve os IDs, na ordem das parcelas.
 * Lança `RangeError` se o formulário for inválido (a tela valida antes).
 */
export async function createManualTransactions(db: Database, form: NewTransactionForm): Promise<string[]> {
  const drafts = buildManualTransactions(form);
  const groupId = drafts.length > 1 ? newId() : null;
  return insertTransactions(
    db,
    drafts.map((draft) => ({
      accountId: form.accountId as string,
      source: 'MANUAL' as const,
      externalId: null,
      description: draft.description,
      amountInCents: draft.amountInCents,
      date: draft.date,
      budgetMonth: draft.budgetMonth,
      categoryId: form.categoryId,
      categorySource: 'MANUAL' as const,
      installmentGroupId: groupId,
      installmentNumber: draft.installmentNumber,
      totalInstallments: draft.totalInstallments,
    })),
  );
}

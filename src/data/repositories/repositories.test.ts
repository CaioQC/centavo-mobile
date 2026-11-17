import { describe, expect, it } from 'vitest';

import { createTestDatabase } from '../testing/createTestDatabase';
import type { NewTransaction } from '../types';
import type { NewTransactionForm } from '../../core/newTransaction';
import {
  createManualTransactions,
  deleteManualTransaction,
  getTransaction,
  insertAccount,
  insertTransactions,
  listAccounts,
  listCategories,
  listTransactionsByMonth,
  TransactionNotDeletableError,
  updateTransactionCategory,
  updateTransactionNote,
  upsertImportedTransaction,
} from './index';

async function setup() {
  const { db } = await createTestDatabase();
  const accountId = await insertAccount(db, {
    connectionId: null,
    source: 'MANUAL',
    externalId: null,
    name: 'Carteira',
    type: 'CASH',
    initialBalanceInCents: 0,
    creditLimitInCents: null,
  });
  const base = (over: Partial<NewTransaction> = {}): NewTransaction => ({
    accountId,
    source: 'MANUAL',
    externalId: null,
    description: 'Café',
    amountInCents: -500,
    date: '2026-11-10',
    budgetMonth: '2026-11',
    categoryId: 'food',
    categorySource: 'IMPORT',
    ...over,
  });
  return { db, accountId, base };
}

describe('categorias e contas', () => {
  it('lista as 11 categorias e filtra por tipo', async () => {
    const { db } = await setup();
    expect(await listCategories(db)).toHaveLength(11);
    expect((await listCategories(db, 'INCOME')).map((c) => c.id)).toEqual(['salary', 'other-income']);
  });

  it('lista contas com o nome do banco (nulo na manual)', async () => {
    const { db } = await setup();
    const accounts = await listAccounts(db);
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({ name: 'Carteira', institutionName: null, type: 'CASH' });
  });
});

describe('transações', () => {
  it('lista só o mês pedido, do dia mais recente para o mais antigo', async () => {
    const { db, base } = await setup();
    await insertTransactions(db, [
      base({ date: '2026-10-31', budgetMonth: '2026-10', description: 'Outubro' }),
      base({ date: '2026-11-01', description: 'Primeiro' }),
      base({ date: '2026-11-30', description: 'Último' }),
      base({ date: '2026-12-01', budgetMonth: '2026-12', description: 'Dezembro' }),
    ]);
    const list = await listTransactionsByMonth(db, '2026-11');
    expect(list.map((t) => t.description)).toEqual(['Último', 'Primeiro']);
    expect(list[0]).toMatchObject({ accountName: 'Carteira', amountInCents: -500, note: null });
  });

  it('insertTransactions é tudo ou nada', async () => {
    const { db, base } = await setup();
    await expect(
      insertTransactions(db, [base(), base({ categoryId: 'categoria-inexistente' })]),
    ).rejects.toThrow();
    expect(await listTransactionsByMonth(db, '2026-11')).toEqual([]);
  });

  it('recategorizar grava MANUAL; observação vazia apaga', async () => {
    const { db, base } = await setup();
    const [id] = await insertTransactions(db, [base()]);
    expect(await updateTransactionCategory(db, id as string, 'leisure')).toBe(1);
    expect(await updateTransactionNote(db, id as string, '  com a turma  ')).toBe(1);
    expect(await getTransaction(db, id as string)).toMatchObject({
      categoryId: 'leisure',
      categorySource: 'MANUAL',
      note: 'com a turma',
    });
    await updateTransactionNote(db, id as string, '   ');
    expect((await getTransaction(db, id as string))?.note).toBeNull();
    expect(await updateTransactionCategory(db, 'nao-existe', 'food')).toBe(0);
  });

  it('upsert por external_id não duplica e preserva categoria manual e observação', async () => {
    const { db, base } = await setup();
    const imported = base({ source: 'SIMULATED', externalId: 'x-1' });
    await upsertImportedTransaction(db, imported);
    const [row] = await listTransactionsByMonth(db, '2026-11');
    await updateTransactionCategory(db, row?.id as string, 'leisure');
    await updateTransactionNote(db, row?.id as string, 'minha anotação');

    await upsertImportedTransaction(db, { ...imported, description: 'Café (atualizado)', categoryId: 'health' });

    const list = await listTransactionsByMonth(db, '2026-11');
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      description: 'Café (atualizado)',
      categoryId: 'leisure',
      categorySource: 'MANUAL',
      note: 'minha anotação',
    });
  });

  it('upsert atualiza a categoria enquanto ela não for manual', async () => {
    const { db, base } = await setup();
    const imported = base({ source: 'SIMULATED', externalId: 'x-1' });
    await upsertImportedTransaction(db, imported);
    await upsertImportedTransaction(db, { ...imported, categoryId: 'health' });
    expect((await listTransactionsByMonth(db, '2026-11'))[0]?.categoryId).toBe('health');
  });

  it('upsert exige external_id', async () => {
    const { db, base } = await setup();
    await expect(upsertImportedTransaction(db, base())).rejects.toThrow();
  });

  it('exclui lançamento manual; a compra parcelada leva todas as parcelas', async () => {
    const { db, base } = await setup();
    const [single] = await insertTransactions(db, [base()]);
    expect(await deleteManualTransaction(db, single as string)).toBe(1);

    const ids = await insertTransactions(db, [
      base({ installmentGroupId: 'g1', installmentNumber: 1, totalInstallments: 2 }),
      base({
        installmentGroupId: 'g1',
        installmentNumber: 2,
        totalInstallments: 2,
        date: '2026-12-10',
        budgetMonth: '2026-12',
      }),
      base({ description: 'Outra' }),
    ]);
    expect(await deleteManualTransaction(db, ids[1] as string)).toBe(2);
    expect((await listTransactionsByMonth(db, '2026-11')).map((t) => t.description)).toEqual(['Outra']);
  });

  it('não exclui o que veio do banco, e excluir o que não existe devolve 0', async () => {
    const { db, base } = await setup();
    await upsertImportedTransaction(db, base({ source: 'SIMULATED', externalId: 'x-1' }));
    const [row] = await listTransactionsByMonth(db, '2026-11');
    await expect(deleteManualTransaction(db, row?.id as string)).rejects.toBeInstanceOf(
      TransactionNotDeletableError,
    );
    expect(await deleteManualTransaction(db, 'nao-existe')).toBe(0);
  });
});

describe('lançamento manual', () => {
  const form = (accountId: string, over: Partial<NewTransactionForm> = {}): NewTransactionForm => ({
    kind: 'EXPENSE',
    amountInCents: 30000,
    description: '  Geladeira  ',
    accountId,
    accountIsCreditCard: true,
    categoryId: 'shopping',
    date: '2026-11-30',
    installments: 3,
    ...over,
  });

  it('compra em 3x grava as 3 parcelas de uma vez, cada uma no seu mês, e a soma fecha', async () => {
    const { db, accountId } = await setup();
    const ids = await createManualTransactions(db, form(accountId, { amountInCents: 10000 }));
    expect(ids).toHaveLength(3);
    const rows = [
      ...(await listTransactionsByMonth(db, '2026-11')),
      ...(await listTransactionsByMonth(db, '2026-12')),
      ...(await listTransactionsByMonth(db, '2027-01')),
    ].sort((a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0));
    expect(rows.map((t) => [t.installmentNumber, t.totalInstallments, t.date, t.budgetMonth, t.amountInCents])).toEqual([
      [1, 3, '2026-11-30', '2026-11', -3334],
      [2, 3, '2026-12-30', '2026-12', -3333],
      [3, 3, '2027-01-30', '2027-01', -3333],
    ]);
    expect(rows.reduce((sum, t) => sum + t.amountInCents, 0)).toBe(-10000);
    expect(new Set(rows.map((t) => t.installmentGroupId)).size).toBe(1);
    expect(rows[0]).toMatchObject({ description: 'Geladeira', source: 'MANUAL', categorySource: 'MANUAL', externalId: null });
  });

  it('à vista e receita viram uma transação só, sem grupo nem parcela', async () => {
    const { db, accountId } = await setup();
    await createManualTransactions(db, form(accountId, { installments: 1 }));
    await createManualTransactions(
      db,
      form(accountId, { kind: 'INCOME', categoryId: 'salary', installments: 1, description: 'Bônus' }),
    );
    const list = (await listTransactionsByMonth(db, '2026-11')).sort((a, b) => a.description.localeCompare(b.description));
    expect(list.map((t) => [t.description, t.amountInCents, t.installmentGroupId, t.installmentNumber])).toEqual([
      ['Bônus', 30000, null, null],
      ['Geladeira', -30000, null, null],
    ]);
  });

  it('excluir uma parcela leva a compra inteira', async () => {
    const { db, accountId } = await setup();
    const ids = await createManualTransactions(db, form(accountId));
    expect(await deleteManualTransaction(db, ids[1] as string)).toBe(3);
    expect(await listTransactionsByMonth(db, '2026-11')).toEqual([]);
  });

  it('formulário inválido não grava nada', async () => {
    const { db, accountId } = await setup();
    await expect(createManualTransactions(db, form(accountId, { amountInCents: 0 }))).rejects.toThrow(RangeError);
    expect(await listTransactionsByMonth(db, '2026-11')).toEqual([]);
  });
});

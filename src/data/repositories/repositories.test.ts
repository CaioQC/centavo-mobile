import { describe, expect, it } from 'vitest';

import { createTestDatabase } from '../testing/createTestDatabase';
import type { NewTransaction } from '../types';
import {
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

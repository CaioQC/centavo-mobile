import { describe, expect, it } from 'vitest';

import { createTestDatabase } from '../testing/createTestDatabase';
import type { NewTransaction } from '../types';
import type { NewTransactionForm } from '../../core/newTransaction';
import {
  createManualAccount,
  createManualTransactions,
  deleteManualTransaction,
  getTransaction,
  insertAccount,
  insertTransactions,
  listAccounts,
  listAccountsWithBalance,
  listCategories,
  listRecentTransactions,
  listTransactionsByMonth,
  copyPreviousMonthLimitsIfNew,
  listBudgetLimits,
  listTransactionsByBudgetMonth,
  setBudgetLimit,
  TransactionNotDeletableError,
  updateTransactionCategory,
  updateTransactionNote,
  upsertImportedTransaction,
} from './index';

async function setup() {
  const { db, sqlite } = await createTestDatabase();
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
  return { db, sqlite, accountId, base };
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

describe('início', () => {
  it('últimas transações: até hoje, mais recentes primeiro, com limite', async () => {
    const { db, base } = await setup();
    await insertTransactions(db, [
      base({ date: '2026-11-01', description: 'A' }),
      base({ date: '2026-11-10', description: 'B' }),
      base({ date: '2026-11-12', description: 'C' }),
      base({ date: '2026-12-01', budgetMonth: '2026-12', description: 'Futura' }),
    ]);
    const list = await listRecentTransactions(db, '2026-11-12', 2);
    expect(list.map((t) => t.description)).toEqual(['C', 'B']);
  });

});

describe('orçamento', () => {
  it('define, altera e remove o limite (zero remove)', async () => {
    const { db } = await setup();
    await setBudgetLimit(db, '2026-11', 'food', 80_000);
    await setBudgetLimit(db, '2026-11', 'housing', 120_000);
    await setBudgetLimit(db, '2026-11', 'food', 90_000);
    expect(await listBudgetLimits(db, '2026-11')).toEqual([
      { categoryId: 'food', limitInCents: 90_000 },
      { categoryId: 'housing', limitInCents: 120_000 },
    ]);
    await setBudgetLimit(db, '2026-11', 'food', 0);
    expect((await listBudgetLimits(db, '2026-11')).map((l) => l.categoryId)).toEqual(['housing']);
    expect(await listBudgetLimits(db, '2026-12')).toEqual([]);
  });

  it('recusa limite inválido e categoria de receita', async () => {
    const { db } = await setup();
    await expect(setBudgetLimit(db, '2026-11', 'food', -1)).rejects.toThrow(RangeError);
    await expect(setBudgetLimit(db, '2026-11', 'food', 1.5)).rejects.toThrow(RangeError);
    await expect(setBudgetLimit(db, '2026-11', 'salary', 1000)).rejects.toThrow(RangeError);
    await expect(setBudgetLimit(db, '2026-11', 'nao-existe', 1000)).rejects.toThrow(RangeError);
    expect(await listBudgetLimits(db, '2026-11')).toEqual([]);
  });

  it('lista as transações pelo budget_month, não pela data', async () => {
    const { db, base } = await setup();
    await insertTransactions(db, [
      base({ description: 'Parcela 2', date: '2026-12-10', budgetMonth: '2026-12' }),
      base({ description: 'Dezembro, mas do mês anterior', date: '2026-12-02', budgetMonth: '2026-11' }),
      base({ description: 'Novembro', date: '2026-11-10' }),
    ]);
    const list = await listTransactionsByBudgetMonth(db, '2026-11');
    expect(list.map((t) => t.description)).toEqual(['Dezembro, mas do mês anterior', 'Novembro']);
  });

  it('copia os limites do mês anterior uma única vez e não ressuscita o que foi removido', async () => {
    const { db } = await setup();
    await setBudgetLimit(db, '2026-11', 'food', 80_000);
    await setBudgetLimit(db, '2026-11', 'housing', 120_000);
    expect(await copyPreviousMonthLimitsIfNew(db, '2026-12')).toBe(2);
    expect(await listBudgetLimits(db, '2026-12')).toHaveLength(2);
    await setBudgetLimit(db, '2026-12', 'food', 0);
    expect(await copyPreviousMonthLimitsIfNew(db, '2026-12')).toBe(0);
    expect((await listBudgetLimits(db, '2026-12')).map((l) => l.categoryId)).toEqual(['housing']);
  });

  it('mês anterior sem limites não marca a cópia; não sobrescreve limite já definido', async () => {
    const { db } = await setup();
    expect(await copyPreviousMonthLimitsIfNew(db, '2026-12')).toBe(0);
    await setBudgetLimit(db, '2026-11', 'food', 80_000);
    await setBudgetLimit(db, '2026-11', 'housing', 120_000);
    await setBudgetLimit(db, '2026-12', 'food', 50_000);
    expect(await copyPreviousMonthLimitsIfNew(db, '2026-12')).toBe(1);
    expect(await listBudgetLimits(db, '2026-12')).toEqual([
      { categoryId: 'food', limitInCents: 50_000 },
      { categoryId: 'housing', limitInCents: 120_000 },
    ]);
  });
});

describe('saldo e conta manual', () => {
  it('saldo = saldo inicial + soma das transações, só da própria conta', async () => {
    const { db, accountId, base } = await setup();
    const other = await createManualAccount(db, { name: 'Poupança', type: 'BANK', initialBalanceInCents: 100_000 });
    await insertTransactions(db, [
      base({ amountInCents: -500 }),
      base({ amountInCents: 2_000, categoryId: 'salary' }),
      base({ accountId: other, amountInCents: -300 }),
    ]);
    const accounts = await listAccountsWithBalance(db);
    expect(accounts.find((a) => a.id === accountId)?.balanceInCents).toBe(1_500);
    expect(accounts.find((a) => a.id === other)?.balanceInCents).toBe(99_700);
  });

  it('conta sem transações tem o saldo inicial', async () => {
    const { db } = await setup();
    const id = await createManualAccount(db, { name: '  Cofre  ', type: 'CASH', initialBalanceInCents: 25_000 });
    const account = (await listAccountsWithBalance(db)).find((a) => a.id === id);
    expect(account).toMatchObject({
      name: 'Cofre',
      type: 'CASH',
      source: 'MANUAL',
      connectionId: null,
      institutionName: null,
      balanceInCents: 25_000,
    });
  });

  it('recusa conta manual inválida sem gravar', async () => {
    const { db } = await setup();
    await expect(createManualAccount(db, { name: ' ', type: 'CASH', initialBalanceInCents: 0 })).rejects.toThrow(RangeError);
    expect(await listAccounts(db)).toHaveLength(1);
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

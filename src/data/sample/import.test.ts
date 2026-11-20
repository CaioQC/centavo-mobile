import { describe, expect, it } from 'vitest';

import { addContribution, listAccounts, listBudgetLimits, listContributions, listGoals, setBudgetLimit, listTransactionsByMonth, updateTransactionCategory, updateTransactionNote } from '../repositories';
import { createTestDatabase } from '../testing/createTestDatabase';
import { generateSampleTransactions } from './generate';
import { importSampleData, seedSampleDataIfNeeded } from './import';

const TODAY = '2026-11-14';

type TestSqlite = Awaited<ReturnType<typeof createTestDatabase>>['sqlite'];

const count = (sqlite: TestSqlite, table: string) =>
  (sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

describe('importSampleData', () => {
  it('cria o banco fictício conectado, as contas e as transações', async () => {
    const { db, sqlite } = await createTestDatabase();
    const summary = await importSampleData(db, TODAY);
    expect(summary).toEqual({ accounts: 2, transactions: generateSampleTransactions(TODAY).length });
    expect(count(sqlite, 'connections')).toBe(1);
    const accounts = await listAccounts(db);
    expect(accounts.map((a) => [a.name, a.institutionName, a.source])).toEqual([
      ['Cartão Jabuticaba', 'Banco Jabuticaba', 'SIMULATED'],
      ['Conta Corrente', 'Banco Jabuticaba', 'SIMULATED'],
    ]);
    expect(count(sqlite, 'transactions')).toBe(summary.transactions);
  });

  it('traz limites no mês corrente e restaurar não sobrescreve o que o usuário mudou', async () => {
    const { db } = await createTestDatabase();
    await importSampleData(db, TODAY);
    const limits = await listBudgetLimits(db, '2026-11');
    expect(limits.length).toBeGreaterThan(0);
    expect(limits.find((l) => l.categoryId === 'food')?.limitInCents).toBeGreaterThan(0);
    await setBudgetLimit(db, '2026-11', 'food', 12_345);
    await importSampleData(db, TODAY);
    expect((await listBudgetLimits(db, '2026-11')).find((l) => l.categoryId === 'food')?.limitInCents).toBe(12_345);
    expect(await listBudgetLimits(db, '2026-10')).toEqual([]);
  });

  it('traz metas com aportes e restaurar não duplica nem desfaz o que o usuário registrou', async () => {
    const { db } = await createTestDatabase();
    await importSampleData(db, TODAY);
    const goals = await listGoals(db);
    expect(goals.map((g) => g.name)).toEqual(['Viagem de fim de ano', 'Reserva de emergência']);
    const viagem = goals.find((g) => g.id === 'sample-goal-viagem')!;
    expect(viagem.savedInCents).toBeGreaterThan(0);
    await addContribution(db, viagem.id, 'DEPOSIT', 10_000, TODAY);
    await importSampleData(db, TODAY);
    expect(await listGoals(db)).toHaveLength(2);
    expect((await listContributions(db, viagem.id)).some((c) => c.amountInCents === 10_000)).toBe(true);
  });

  it('importar de novo não duplica nada', async () => {
    const { db, sqlite } = await createTestDatabase();
    await importSampleData(db, TODAY);
    const before = count(sqlite, 'transactions');
    await importSampleData(db, TODAY);
    expect(count(sqlite, 'transactions')).toBe(before);
    expect(count(sqlite, 'accounts')).toBe(2);
    expect(count(sqlite, 'connections')).toBe(1);
  });

  it('importar de novo preserva categoria manual e observação', async () => {
    const { db } = await createTestDatabase();
    await importSampleData(db, TODAY);
    const [first] = await listTransactionsByMonth(db, '2026-11');
    await updateTransactionCategory(db, first?.id as string, 'other');
    await updateTransactionNote(db, first?.id as string, 'conferir');
    await importSampleData(db, TODAY);
    const again = (await listTransactionsByMonth(db, '2026-11')).find((t) => t.id === first?.id);
    expect(again).toMatchObject({ categoryId: 'other', categorySource: 'MANUAL', note: 'conferir' });
  });

  it('reimportar em outro mês mantém a âncora: sem duplicar nem mudar valores', async () => {
    const { db, sqlite } = await createTestDatabase();
    await importSampleData(db, TODAY);
    const before = sqlite.prepare('SELECT external_id, amount_in_cents, date FROM transactions ORDER BY external_id').all();
    await importSampleData(db, '2027-02-20');
    const after = sqlite.prepare('SELECT external_id, amount_in_cents, date FROM transactions ORDER BY external_id').all();
    expect(after).toEqual(before);
  });

  it('cada transação cai no mês do orçamento do seu dia', async () => {
    const { db } = await createTestDatabase();
    await importSampleData(db, TODAY);
    const december = await listTransactionsByMonth(db, '2026-12');
    expect(december).toHaveLength(1);
    expect(december[0]).toMatchObject({ budgetMonth: '2026-12', installmentNumber: 3, totalInstallments: 3 });
  });
});

describe('seedSampleDataIfNeeded', () => {
  it('só carrega na primeira abertura', async () => {
    const { db, sqlite } = await createTestDatabase();
    expect(await seedSampleDataIfNeeded(db, TODAY)).toBe(true);
    const total = count(sqlite, 'transactions');
    expect(await seedSampleDataIfNeeded(db, TODAY)).toBe(false);
    expect(count(sqlite, 'transactions')).toBe(total);
  });
});

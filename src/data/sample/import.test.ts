import { describe, expect, it } from 'vitest';

import { listAccounts, listTransactionsByMonth, updateTransactionCategory, updateTransactionNote } from '../repositories';
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

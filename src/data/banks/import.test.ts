import { describe, expect, it } from 'vitest';

import {
  listAccountsWithBalance,
  listConnections,
  listTransactionsByMonth,
  updateTransactionCategory,
  updateTransactionNote,
} from '../repositories';
import { createTestDatabase } from '../testing/createTestDatabase';
import { findBank } from './catalog';
import { generateBankTransactions } from './generate';
import { importBank } from './import';
import type { Bank } from './types';

const TODAY = '2026-11-14';
const pitanga = findBank('pitanga') as Bank;
const caju = findBank('caju') as Bank;

type TestSqlite = Awaited<ReturnType<typeof createTestDatabase>>['sqlite'];

const count = (sqlite: TestSqlite, table: string) =>
  (sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

describe('importBank', () => {
  it('conecta o banco: conexão, contas e transações, com o resumo do que veio', async () => {
    const { db, sqlite } = await createTestDatabase();
    const summary = await importBank(db, pitanga, TODAY);
    const total = generateBankTransactions(pitanga.script, TODAY).length;
    expect(summary).toEqual({
      accounts: 2,
      transactions: total,
      newAccounts: 2,
      newTransactions: total,
      newConnection: true,
    });
    const connections = await listConnections(db);
    expect(connections.map((c) => [c.institutionKey, c.institutionName])).toEqual([['pitanga', 'Banco Pitanga']]);
    expect(connections[0]?.lastSyncedAt).not.toBeNull();
    const accounts = await listAccountsWithBalance(db);
    expect(accounts.map((a) => [a.name, a.institutionName, a.source])).toEqual([
      ['Cartão Pitanga', 'Banco Pitanga', 'SIMULATED'],
      ['Conta Digital', 'Banco Pitanga', 'SIMULATED'],
    ]);
    expect(count(sqlite, 'transactions')).toBe(total);
  });

  it('importar duas vezes não duplica nada e a segunda vez não traz novidade', async () => {
    const { db, sqlite } = await createTestDatabase();
    const first = await importBank(db, pitanga, TODAY);
    const second = await importBank(db, pitanga, TODAY);
    expect(second).toEqual({
      accounts: 2,
      transactions: first.transactions,
      newAccounts: 0,
      newTransactions: 0,
      newConnection: false,
    });
    expect(count(sqlite, 'transactions')).toBe(first.transactions);
    expect(count(sqlite, 'accounts')).toBe(2);
    expect(count(sqlite, 'connections')).toBe(1);
  });

  it('preserva categoria manual e observação do usuário ao sincronizar de novo', async () => {
    const { db } = await createTestDatabase();
    await importBank(db, pitanga, TODAY);
    const [first, second] = await listTransactionsByMonth(db, '2026-11');
    await updateTransactionCategory(db, first?.id as string, 'other');
    await updateTransactionNote(db, first?.id as string, 'conferir com o banco');
    await importBank(db, pitanga, TODAY);
    const after = await listTransactionsByMonth(db, '2026-11');
    expect(after.find((t) => t.id === first?.id)).toMatchObject({
      categoryId: 'other',
      categorySource: 'MANUAL',
      note: 'conferir com o banco',
    });
    // quem o usuário não mexeu continua como veio do banco
    expect(after.find((t) => t.id === second?.id)).toMatchObject({ categorySource: 'IMPORT', note: null });
  });

  it('só a categoria importada volta ao valor do banco; a do usuário nunca', async () => {
    const { db, sqlite } = await createTestDatabase();
    await importBank(db, pitanga, TODAY);
    // simula um valor antigo da importação: ele é atualizado, a escolha do usuário não é
    sqlite.exec("UPDATE transactions SET category_id = 'other' WHERE category_source = 'IMPORT'");
    const [first] = await listTransactionsByMonth(db, '2026-11');
    await updateTransactionCategory(db, first?.id as string, 'leisure');
    await importBank(db, pitanga, TODAY);
    const after = await listTransactionsByMonth(db, '2026-11');
    expect(after.find((t) => t.id === first?.id)?.categoryId).toBe('leisure');
    const imported = after.filter((t) => t.id !== first?.id);
    expect(imported.some((t) => t.categoryId !== 'other')).toBe(true);
  });

  it('sincronizar em outro mês mantém a âncora: sem duplicar nem mudar valores', async () => {
    const { db, sqlite } = await createTestDatabase();
    await importBank(db, pitanga, TODAY);
    const rows = () =>
      sqlite.prepare('SELECT external_id, amount_in_cents, date FROM transactions ORDER BY account_id, external_id').all();
    const before = rows();
    const again = await importBank(db, pitanga, '2027-02-20');
    expect(again.newTransactions).toBe(0);
    expect(rows()).toEqual(before);
  });

  it('bancos diferentes convivem: cada um com a sua conexão, sem misturar contas', async () => {
    const { db, sqlite } = await createTestDatabase();
    await importBank(db, pitanga, TODAY);
    const before = count(sqlite, 'transactions');
    const summary = await importBank(db, caju, TODAY);
    expect(summary.newConnection).toBe(true);
    expect(summary.newAccounts).toBe(1);
    expect(count(sqlite, 'connections')).toBe(2);
    expect(count(sqlite, 'transactions')).toBe(before + summary.transactions);
    const accounts = await listAccountsWithBalance(db);
    expect(accounts.filter((a) => a.institutionName === 'Caju Digital')).toHaveLength(1);
  });

  it('é tudo ou nada: se algo falha no meio, o banco não fica conectado pela metade', async () => {
    const { db, sqlite } = await createTestDatabase();
    const broken: Bank = {
      ...pitanga,
      key: 'quebrado',
      name: 'Banco Quebrado',
      anchorSettingKey: 'bank_anchor:quebrado',
      script: {
        templates: [{ ...pitanga.script.templates[0]!, account: 'conta-que-nao-existe' }],
        installmentPurchases: [],
      },
    };
    await expect(importBank(db, broken, TODAY)).rejects.toThrow('conta-que-nao-existe');
    expect(count(sqlite, 'connections')).toBe(0);
    expect(count(sqlite, 'accounts')).toBe(0);
    expect(count(sqlite, 'transactions')).toBe(0);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM settings WHERE key = 'bank_anchor:quebrado'").get()).toEqual({ n: 0 });
  });
});

import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';

import { migrations, runMigrations, type MigrationDatabase } from './index';

// Usa o SQLite embutido do Node só para validar o SQL; no app o banco é o expo-sqlite.
function createDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  const db: MigrationDatabase = {
    execAsync: async (sql) => {
      sqlite.exec(sql);
    },
    getFirstAsync: async <T>(sql: string) => (sqlite.prepare(sql).get() as T | undefined) ?? null,
  };
  return { sqlite, db };
}

const userVersion = (sqlite: DatabaseSync) =>
  (sqlite.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;

describe('migrações', () => {
  it('têm versões 1, 2, 3... sem buracos', () => {
    expect(migrations.map((m) => m.version)).toEqual(migrations.map((_, i) => i + 1));
  });

  it('a migração 1 cria todas as tabelas do modelo de dados', async () => {
    const { sqlite, db } = createDatabase();
    await runMigrations(db);

    const tables = (
      sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]
    ).map((row) => row.name);
    expect(tables).toEqual([
      'accounts',
      'budgets',
      'categories',
      'connections',
      'goal_contributions',
      'goals',
      'settings',
      'transactions',
    ]);
    expect(userVersion(sqlite)).toBe(migrations.length);
  });

  it('cria as categorias fixas: 9 de despesa e 2 de receita', async () => {
    const { sqlite, db } = createDatabase();
    await runMigrations(db);

    const count = (kind: string) =>
      (sqlite.prepare('SELECT COUNT(*) AS n FROM categories WHERE kind = ?').get(kind) as { n: number }).n;
    expect(count('EXPENSE')).toBe(9);
    expect(count('INCOME')).toBe(2);
  });

  it('rodar de novo não refaz nada nem apaga dados', async () => {
    const { sqlite, db } = createDatabase();
    await runMigrations(db);
    sqlite.exec("INSERT INTO settings (key, value) VALUES ('theme', 'DARK')");

    await runMigrations(db);

    const setting = sqlite.prepare("SELECT value FROM settings WHERE key = 'theme'").get() as { value: string };
    expect(setting.value).toBe('DARK');
    expect(userVersion(sqlite)).toBe(migrations.length);
  });

  it('recusa um banco de versão mais nova que a do app', async () => {
    const { sqlite, db } = createDatabase();
    sqlite.exec('PRAGMA user_version = 99');
    await expect(runMigrations(db)).rejects.toThrow(/versão 99/);
  });

  it('uma migração que falha é desfeita por inteiro', async () => {
    const { sqlite, db } = createDatabase();
    const broken = [{ version: 1, statements: ['CREATE TABLE a (id TEXT)', 'CREATE TABLE a (id TEXT)'] }];

    await expect(runMigrations(db, broken)).rejects.toThrow();

    expect(userVersion(sqlite)).toBe(0);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'a'").get()).toEqual({ n: 0 });
  });

  it('impede duplicar transação importada (conta + external_id)', async () => {
    const { sqlite, db } = createDatabase();
    await runMigrations(db);
    sqlite.exec(`
      INSERT INTO accounts (id, source, name, type) VALUES ('acc', 'MANUAL', 'Conta', 'BANK');
      INSERT INTO transactions (id, account_id, source, external_id, description, amount_in_cents, date, budget_month, created_at)
        VALUES ('t1', 'acc', 'SIMULATED', 'ext-1', 'Mercado', -5000, '2026-11-01', '2026-11', '2026-11-01T10:00:00Z');
    `);

    expect(() =>
      sqlite.exec(`
        INSERT INTO transactions (id, account_id, source, external_id, description, amount_in_cents, date, budget_month, created_at)
        VALUES ('t2', 'acc', 'SIMULATED', 'ext-1', 'Mercado', -5000, '2026-11-01', '2026-11', '2026-11-01T10:00:00Z')`),
    ).toThrow(/UNIQUE/);
  });
});

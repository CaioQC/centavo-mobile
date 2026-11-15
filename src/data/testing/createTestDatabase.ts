import { DatabaseSync } from 'node:sqlite';

import type { Database, SqlValue } from '../database';
import { runMigrations } from '../migrations';

/** Banco em memória com as migrações aplicadas, usando o SQLite embutido do Node (só para testes). */
export async function createTestDatabase(): Promise<{ db: Database; sqlite: DatabaseSync }> {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  const db: Database = {
    execAsync: async (sql) => {
      sqlite.exec(sql);
    },
    getAllAsync: async <T>(sql: string, params: SqlValue[]) => sqlite.prepare(sql).all(...params) as T[],
    getFirstAsync: async <T>(sql: string, params: SqlValue[]) =>
      (sqlite.prepare(sql).get(...params) as T | undefined) ?? null,
    runAsync: async (sql, params) => {
      const result = sqlite.prepare(sql).run(...params);
      return { changes: Number(result.changes) };
    },
    withTransactionAsync: async (task) => {
      sqlite.exec('BEGIN');
      try {
        await task();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  await runMigrations({ execAsync: db.execAsync, getFirstAsync: (sql) => db.getFirstAsync(sql, []) });
  return { db, sqlite };
}

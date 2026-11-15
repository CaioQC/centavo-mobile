// O mínimo que os repositórios precisam do banco. O `SQLiteDatabase` do expo-sqlite satisfaz esta
// interface, e os testes usam o SQLite embutido do Node (src/data/testing).

export type SqlValue = string | number | null;

export interface Database {
  execAsync(sql: string): Promise<void>;
  getAllAsync<T>(sql: string, params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: SqlValue[]): Promise<T | null>;
  runAsync(sql: string, params: SqlValue[]): Promise<{ changes: number }>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

/** Uma migração do esquema: `version` sobe de 1 em 1, e cada statement é um comando SQL. */
export interface Migration {
  version: number;
  statements: string[];
}

/** O mínimo que o runner precisa do banco (o `SQLiteDatabase` do expo-sqlite satisfaz). */
export interface MigrationDatabase {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
}

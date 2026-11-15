import { initialMigration } from './001-initial';
import type { Migration, MigrationDatabase } from './types';

export type { Migration, MigrationDatabase } from './types';

/** Todas as migrações, em ordem. Esquema novo = migração nova; nunca edite uma já publicada. */
export const migrations: Migration[] = [initialMigration];

/**
 * Leva o banco à última versão, lendo e gravando `PRAGMA user_version`.
 * Cada migração roda numa transação (o `user_version` também é transacional no SQLite),
 * então uma falha no meio não deixa o banco pela metade e nunca apaga dados do usuário.
 */
export async function runMigrations(db: MigrationDatabase, available: Migration[] = migrations): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  const latest = available.reduce((max, migration) => Math.max(max, migration.version), 0);

  if (current > latest) {
    throw new Error(`Banco na versão ${current}, mas o app só conhece até a ${latest}.`);
  }

  for (const migration of [...available].sort((a, b) => a.version - b.version)) {
    if (migration.version <= current) continue;
    await db.execAsync(
      ['BEGIN', ...migration.statements, `PRAGMA user_version = ${migration.version}`, 'COMMIT'].join(';\n') + ';',
    ).catch(async (error: unknown) => {
      await db.execAsync('ROLLBACK').catch(() => undefined);
      throw error;
    });
  }
}

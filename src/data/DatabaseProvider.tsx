import { Suspense, type ReactNode } from 'react';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';
import { seedSampleDataIfNeeded } from './sample/import';

export const DATABASE_NAME = 'centavo.db';

async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  // Primeira abertura: já traz o banco fictício conectado e ~3 meses de transações (demo).
  await seedSampleDataIfNeeded(db);
}

/** Abre o SQLite do aparelho e aplica as migrações antes de renderizar o app. */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase} useSuspense>
        {children}
      </SQLiteProvider>
    </Suspense>
  );
}

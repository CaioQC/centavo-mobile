import { newId } from '../ids';
import type { Database } from '../database';
import type { Connection } from '../types';

const COLUMNS = `id, institution_key AS institutionKey, institution_name AS institutionName,
  connected_at AS connectedAt, last_synced_at AS lastSyncedAt`;

/** Bancos conectados, do mais antigo para o mais novo. */
export function listConnections(db: Database): Promise<Connection[]> {
  return db.getAllAsync<Connection>(`SELECT ${COLUMNS} FROM connections ORDER BY connected_at, id`, []);
}

export function findConnectionByKey(db: Database, institutionKey: string): Promise<Connection | null> {
  return db.getFirstAsync<Connection>(`SELECT ${COLUMNS} FROM connections WHERE institution_key = ?`, [
    institutionKey,
  ]);
}

export async function insertConnection(
  db: Database,
  data: { institutionKey: string; institutionName: string; connectedAt: string },
): Promise<string> {
  const id = newId();
  await db.runAsync(
    'INSERT INTO connections (id, institution_key, institution_name, connected_at, last_synced_at) VALUES (?, ?, ?, ?, ?)',
    [id, data.institutionKey, data.institutionName, data.connectedAt, data.connectedAt],
  );
  return id;
}

export async function markConnectionSynced(db: Database, id: string, syncedAt: string): Promise<void> {
  await db.runAsync('UPDATE connections SET last_synced_at = ? WHERE id = ?', [syncedAt, id]);
}

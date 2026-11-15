import { randomUUID } from 'expo-crypto';

/** Novo ID (UUID v4) para linhas do SQLite. */
export function newId(): string {
  return randomUUID();
}

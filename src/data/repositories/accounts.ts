import { newId } from '../ids';
import type { Database } from '../database';
import type { Account, AccountType, Source } from '../types';

const SELECT = `SELECT a.id, a.connection_id AS connectionId, a.source, a.external_id AS externalId, a.name, a.type,
    a.initial_balance_in_cents AS initialBalanceInCents, a.credit_limit_in_cents AS creditLimitInCents,
    c.institution_name AS institutionName
  FROM accounts a LEFT JOIN connections c ON c.id = a.connection_id`;

/** Contas não arquivadas: conectadas primeiro, depois as manuais; dentro de cada grupo, pelo nome. */
export function listAccounts(db: Database): Promise<Account[]> {
  return db.getAllAsync<Account>(
    `${SELECT} WHERE a.archived_at IS NULL ORDER BY (a.source = 'MANUAL'), a.name COLLATE NOCASE`,
    [],
  );
}

export function getAccount(db: Database, id: string): Promise<Account | null> {
  return db.getFirstAsync<Account>(`${SELECT} WHERE a.id = ?`, [id]);
}

export function findAccountByExternalId(
  db: Database,
  connectionId: string,
  externalId: string,
): Promise<Account | null> {
  return db.getFirstAsync<Account>(`${SELECT} WHERE a.connection_id = ? AND a.external_id = ?`, [
    connectionId,
    externalId,
  ]);
}

export interface NewAccount {
  connectionId: string | null;
  source: Source;
  externalId: string | null;
  name: string;
  type: AccountType;
  initialBalanceInCents: number;
  creditLimitInCents: number | null;
}

export async function insertAccount(db: Database, data: NewAccount): Promise<string> {
  const id = newId();
  await db.runAsync(
    `INSERT INTO accounts (id, connection_id, source, external_id, name, type, initial_balance_in_cents, credit_limit_in_cents)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.connectionId,
      data.source,
      data.externalId,
      data.name,
      data.type,
      data.initialBalanceInCents,
      data.creditLimitInCents,
    ],
  );
  return id;
}

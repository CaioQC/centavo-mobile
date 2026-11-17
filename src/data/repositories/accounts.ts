import { accountBalance, validateNewManualAccount, type NewManualAccountForm } from '../../core/accounts';
import { newId } from '../ids';
import type { Database } from '../database';
import type { Account, AccountType, AccountWithBalance, Source } from '../types';

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

/** Contas não arquivadas com o saldo (saldo inicial + soma das transações), na mesma ordem de `listAccounts`. */
export async function listAccountsWithBalance(db: Database): Promise<AccountWithBalance[]> {
  const rows = await db.getAllAsync<Account & { transactionsSumInCents: number }>(
    `SELECT a.id, a.connection_id AS connectionId, a.source, a.external_id AS externalId, a.name, a.type,
      a.initial_balance_in_cents AS initialBalanceInCents, a.credit_limit_in_cents AS creditLimitInCents,
      c.institution_name AS institutionName,
      COALESCE((SELECT SUM(t.amount_in_cents) FROM transactions t WHERE t.account_id = a.id), 0) AS transactionsSumInCents
    FROM accounts a LEFT JOIN connections c ON c.id = a.connection_id
    WHERE a.archived_at IS NULL ORDER BY (a.source = 'MANUAL'), a.name COLLATE NOCASE`,
    [],
  );
  return rows.map(({ transactionsSumInCents, ...account }) => ({
    ...account,
    balanceInCents: accountBalance(account.initialBalanceInCents, transactionsSumInCents),
  }));
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

/**
 * Cria uma conta manual (dinheiro ou conta fora da conexão simulada) com o saldo inicial informado.
 * Lança `RangeError` se o formulário for inválido (a tela valida antes). Devolve o ID.
 */
export async function createManualAccount(db: Database, form: NewManualAccountForm): Promise<string> {
  if (Object.keys(validateNewManualAccount(form)).length > 0) {
    throw new RangeError('Conta manual inválida.');
  }
  return insertAccount(db, {
    connectionId: null,
    source: 'MANUAL',
    externalId: null,
    name: form.name.trim(),
    type: form.type,
    initialBalanceInCents: form.initialBalanceInCents,
    creditLimitInCents: null,
  });
}

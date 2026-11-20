import { monthOf, todayLocal, type LocalDate } from '../../core/dates';
import type { Database } from '../database';
import {
  findAccountByExternalId,
  findConnectionByKey,
  getSetting,
  insertAccount,
  insertConnection,
  markConnectionSynced,
  setSetting,
  upsertImportedTransaction,
} from '../repositories';
import { generateBankTransactions } from './generate';
import type { Bank } from './types';

export interface BankImportSummary {
  /** contas do banco (novas ou já conhecidas) */
  accounts: number;
  /** transações do banco (novas ou já conhecidas) */
  transactions: number;
  /** o que esta sincronização trouxe de novo */
  newAccounts: number;
  newTransactions: number;
  /** a conexão foi criada agora (primeira vez deste banco) */
  newConnection: boolean;
}

/** O dia de referência do banco: o da primeira importação, que fica guardado e vale para as próximas. */
export async function resolveBankAnchor(db: Database, bank: Bank, today: LocalDate): Promise<LocalDate> {
  return (await getSetting(db, bank.anchorSettingKey)) ?? today;
}

/**
 * Importa o banco dentro da transação que o chamador já abriu (o SQLite não aninha transações):
 * conexão, contas e transações pelo `external_id`. Não duplica nada e não sobrescreve categoria
 * manual nem observação (ADR 07). Nunca apaga: o que já foi importado fica, mesmo que o banco deixe de mandar.
 */
export async function importBankInTransaction(
  db: Database,
  bank: Bank,
  anchor: LocalDate,
  now: string,
): Promise<BankImportSummary> {
  const transactions = generateBankTransactions(bank.script, anchor);

  const connection = await findConnectionByKey(db, bank.key);
  const connectionId =
    connection?.id ?? (await insertConnection(db, { institutionKey: bank.key, institutionName: bank.name, connectedAt: now }));

  const accountIds = new Map<string, string>();
  let newAccounts = 0;
  for (const account of bank.accounts) {
    const existing = await findAccountByExternalId(db, connectionId, account.externalId);
    if (!existing) newAccounts += 1;
    const id =
      existing?.id ??
      (await insertAccount(db, {
        connectionId,
        source: 'SIMULATED',
        externalId: account.externalId,
        name: account.name,
        type: account.type,
        initialBalanceInCents: account.initialBalanceInCents,
        creditLimitInCents: account.creditLimitInCents,
      }));
    accountIds.set(account.externalId, id);
  }

  let newTransactions = 0;
  for (const item of transactions) {
    const accountId = accountIds.get(item.accountExternalId);
    if (!accountId) throw new Error(`Conta desconhecida em ${bank.name}: ${item.accountExternalId}`);
    const isNew = await upsertImportedTransaction(db, {
      accountId,
      source: 'SIMULATED',
      externalId: item.externalId,
      description: item.description,
      amountInCents: item.amountInCents,
      date: item.date,
      // ADR 11: o banco data a parcela k no mês da compra + (k - 1), então o mês do orçamento é o do dia.
      budgetMonth: monthOf(item.date),
      categoryId: item.categoryId,
      categorySource: 'IMPORT',
      installmentNumber: item.installmentNumber,
      totalInstallments: item.totalInstallments,
    });
    if (isNew) newTransactions += 1;
  }

  await markConnectionSynced(db, connectionId, now);
  await setSetting(db, bank.anchorSettingKey, anchor);

  return {
    accounts: bank.accounts.length,
    transactions: transactions.length,
    newAccounts,
    newTransactions,
    newConnection: connection === null,
  };
}

/**
 * Conecta (ou sincroniza de novo) um banco do catálogo, tudo ou nada: se algo falhar, nada fica pela metade.
 * Pode rodar quantas vezes quiser.
 */
export async function importBank(db: Database, bank: Bank, today: LocalDate = todayLocal()): Promise<BankImportSummary> {
  const anchor = await resolveBankAnchor(db, bank, today);
  const now = new Date().toISOString();
  const result: { summary?: BankImportSummary } = {};
  await db.withTransactionAsync(async () => {
    result.summary = await importBankInTransaction(db, bank, anchor, now);
  });
  if (!result.summary) throw new Error('A importação não terminou.');
  return result.summary;
}

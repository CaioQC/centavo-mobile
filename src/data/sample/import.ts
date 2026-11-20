import { monthOf, todayLocal, type LocalDate } from '../../core/dates';
import type { Database } from '../database';
import {
  findAccountByExternalId,
  findConnectionByKey,
  getSetting,
  insertAccount,
  insertBudgetLimitIfMissing,
  insertConnection,
  insertContributionIfMissing,
  insertGoalIfMissing,
  markConnectionSynced,
  setSetting,
  upsertImportedTransaction,
} from '../repositories';
import { SAMPLE_ACCOUNTS, SAMPLE_BUDGET_LIMITS, SAMPLE_INSTITUTION } from './catalog';
import { generateSampleTransactions } from './generate';
import { generateSampleGoals } from './goals';

/** Chave em `settings` que marca que os dados de exemplo já foram carregados. */
export const SAMPLE_DATA_VERSION_KEY = 'sample_data_version';
export const SAMPLE_DATA_VERSION = '1';
/**
 * Chave em `settings` com o dia que ancora os dados de exemplo (o "hoje" da primeira importação).
 * Reimportar usa sempre a mesma âncora: as chaves e os valores não mudam, então restaurar os
 * dados em outro mês não duplica a compra parcelada nem altera valores já gravados.
 */
export const SAMPLE_DATA_ANCHOR_KEY = 'sample_data_anchor';

export interface ImportSummary {
  accounts: number;
  transactions: number;
}

/**
 * Importa o banco fictício: conexão, contas e ~3 meses de transações (até a âncora), tudo pelo `external_id`.
 * Pode rodar quantas vezes quiser: não duplica nada e não sobrescreve categoria manual nem observação.
 */
export async function importSampleData(db: Database, today: LocalDate = todayLocal()): Promise<ImportSummary> {
  const anchor = (await getSetting(db, SAMPLE_DATA_ANCHOR_KEY)) ?? today;
  const transactions = generateSampleTransactions(anchor);
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    const connection = await findConnectionByKey(db, SAMPLE_INSTITUTION.key);
    const connectionId =
      connection?.id ??
      (await insertConnection(db, {
        institutionKey: SAMPLE_INSTITUTION.key,
        institutionName: SAMPLE_INSTITUTION.name,
        connectedAt: now,
      }));

    const accountIds = new Map<string, string>();
    for (const sample of SAMPLE_ACCOUNTS) {
      const existing = await findAccountByExternalId(db, connectionId, sample.externalId);
      const id =
        existing?.id ??
        (await insertAccount(db, {
          connectionId,
          source: 'SIMULATED',
          externalId: sample.externalId,
          name: sample.name,
          type: sample.type,
          initialBalanceInCents: sample.initialBalanceInCents,
          creditLimitInCents: sample.creditLimitInCents,
        }));
      accountIds.set(sample.externalId, id);
    }

    for (const item of transactions) {
      const accountId = accountIds.get(item.accountExternalId);
      if (!accountId) throw new Error(`Conta de exemplo desconhecida: ${item.accountExternalId}`);
      await upsertImportedTransaction(db, {
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
    }

    // Limites do mês corrente: só entram onde ainda não há limite, então restaurar não desfaz o que o usuário mudou.
    for (const [categoryId, limit] of Object.entries(SAMPLE_BUDGET_LIMITS)) {
      await insertBudgetLimitIfMissing(db, monthOf(anchor), categoryId, limit);
    }

    // Metas de exemplo: IDs fixos, então restaurar não duplica nem desfaz o que o usuário registrou.
    const sampleGoals = generateSampleGoals(anchor);
    for (const goal of sampleGoals.goals) await insertGoalIfMissing(db, goal, now);
    for (const contribution of sampleGoals.contributions) await insertContributionIfMissing(db, contribution);

    await markConnectionSynced(db, connectionId, now);
    await setSetting(db, SAMPLE_DATA_ANCHOR_KEY, anchor);
    await setSetting(db, SAMPLE_DATA_VERSION_KEY, SAMPLE_DATA_VERSION);
  });

  return { accounts: SAMPLE_ACCOUNTS.length, transactions: transactions.length };
}

/** Primeira abertura do app: carrega os dados de exemplo uma única vez. */
export async function seedSampleDataIfNeeded(db: Database, today: LocalDate = todayLocal()): Promise<boolean> {
  if ((await getSetting(db, SAMPLE_DATA_VERSION_KEY)) !== null) return false;
  await importSampleData(db, today);
  return true;
}

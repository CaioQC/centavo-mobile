import { monthOf, todayLocal, type LocalDate } from '../../core/dates';
import { BANCO_JABUTICABA } from '../banks/catalog';
import { importBankInTransaction, resolveBankAnchor } from '../banks/import';
import type { Database } from '../database';
import { getSetting, insertBudgetLimitIfMissing, insertContributionIfMissing, insertGoalIfMissing, setSetting } from '../repositories';
import { SAMPLE_BUDGET_LIMITS, SAMPLE_DATA_ANCHOR_KEY } from './catalog';
import { generateSampleGoals } from './goals';

export { SAMPLE_DATA_ANCHOR_KEY };

/** Chave em `settings` que marca que os dados de exemplo já foram carregados. */
export const SAMPLE_DATA_VERSION_KEY = 'sample_data_version';
export const SAMPLE_DATA_VERSION = '1';

export interface ImportSummary {
  accounts: number;
  transactions: number;
}

/**
 * Importa os dados de exemplo: o Banco Jabuticaba (conexão, contas e ~3 meses de transações, até a âncora),
 * mais limites do orçamento e metas. A importação do banco é a mesma da conexão simulada
 * (`importBankInTransaction`): pode rodar quantas vezes quiser, não duplica nada e não sobrescreve
 * categoria manual nem observação.
 */
export async function importSampleData(db: Database, today: LocalDate = todayLocal()): Promise<ImportSummary> {
  const anchor = await resolveBankAnchor(db, BANCO_JABUTICABA, today);
  const now = new Date().toISOString();
  let summary: ImportSummary = { accounts: 0, transactions: 0 };

  await db.withTransactionAsync(async () => {
    const bank = await importBankInTransaction(db, BANCO_JABUTICABA, anchor, now);
    summary = { accounts: bank.accounts, transactions: bank.transactions };

    // Limites do mês corrente: só entram onde ainda não há limite, então restaurar não desfaz o que o usuário mudou.
    for (const [categoryId, limit] of Object.entries(SAMPLE_BUDGET_LIMITS)) {
      await insertBudgetLimitIfMissing(db, monthOf(anchor), categoryId, limit);
    }

    // Metas de exemplo: IDs fixos, então restaurar não duplica nem desfaz o que o usuário registrou.
    const sampleGoals = generateSampleGoals(anchor);
    for (const goal of sampleGoals.goals) await insertGoalIfMissing(db, goal, now);
    for (const contribution of sampleGoals.contributions) await insertContributionIfMissing(db, contribution);

    await setSetting(db, SAMPLE_DATA_VERSION_KEY, SAMPLE_DATA_VERSION);
  });

  return summary;
}

/** Primeira abertura do app: carrega os dados de exemplo uma única vez. */
export async function seedSampleDataIfNeeded(db: Database, today: LocalDate = todayLocal()): Promise<boolean> {
  if ((await getSetting(db, SAMPLE_DATA_VERSION_KEY)) !== null) return false;
  await importSampleData(db, today);
  return true;
}

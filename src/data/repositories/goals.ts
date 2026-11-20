import { signedContributionAmount, validateContribution, validateNewGoal, parseGoalTargetDate, type ContributionKind } from '../../core/goals';
import { isValidLocalDate, todayLocal, type LocalDate } from '../../core/dates';
import { newId } from '../ids';
import type { Database } from '../database';
import type { Goal, GoalContribution } from '../types';

const SELECT = `SELECT g.id, g.name, g.target_in_cents AS targetInCents, g.target_date AS targetDate, g.icon, g.color,
    g.created_at AS createdAt,
    COALESCE((SELECT SUM(c.amount_in_cents) FROM goal_contributions c WHERE c.goal_id = g.id), 0) AS savedInCents
  FROM goals g`;

/** Metas não arquivadas, da mais antiga para a mais nova, com o total guardado (aportes menos retiradas). */
export function listGoals(db: Database): Promise<Goal[]> {
  return db.getAllAsync<Goal>(`${SELECT} WHERE g.archived_at IS NULL ORDER BY g.created_at, g.rowid`, []);
}

export function getGoal(db: Database, id: string): Promise<Goal | null> {
  return db.getFirstAsync<Goal>(`${SELECT} WHERE g.id = ? AND g.archived_at IS NULL`, [id]);
}

/** Aportes e retiradas da meta, do mais recente para o mais antigo (retirada com valor negativo). */
export function listContributions(db: Database, goalId: string): Promise<GoalContribution[]> {
  return db.getAllAsync<GoalContribution>(
    `SELECT id, goal_id AS goalId, amount_in_cents AS amountInCents, date
     FROM goal_contributions WHERE goal_id = ? ORDER BY date DESC, rowid DESC`,
    [goalId],
  );
}

export interface NewGoalData {
  name: string;
  targetInCents: number;
  /** data-alvo como digitada (DD/MM/AAAA); vazia = sem data */
  targetDateText: string;
  icon: string;
  color: string;
}

/** Retirada acima do que a meta tem guardado. */
export class ContributionExceedsBalanceError extends Error {
  constructor(public readonly savedInCents: number) {
    super('A retirada é maior que o valor guardado na meta.');
    this.name = 'ContributionExceedsBalanceError';
  }
}

/**
 * Cria uma meta. Lança `RangeError` se o formulário for inválido (a tela valida antes). Devolve o ID.
 */
export async function createGoal(db: Database, data: NewGoalData, today: LocalDate = todayLocal()): Promise<string> {
  if (Object.keys(validateNewGoal(data, today)).length > 0) throw new RangeError('Meta inválida.');
  const id = newId();
  await db.runAsync(
    'INSERT INTO goals (id, name, target_in_cents, target_date, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, data.name.trim(), data.targetInCents, parseGoalTargetDate(data.targetDateText), data.icon, data.color, new Date().toISOString()],
  );
  return id;
}

/**
 * Registra um aporte ou uma retirada (valor negativo) na meta. A retirada não passa do que a meta tem guardado:
 * lança `ContributionExceedsBalanceError`. Lança `RangeError` se o valor ou a data forem inválidos
 * ou se a meta não existir (a tela valida antes). Devolve o ID.
 */
export async function addContribution(
  db: Database,
  goalId: string,
  kind: ContributionKind,
  amountInCents: number,
  date: LocalDate,
): Promise<string> {
  // Ler o saldo e gravar na mesma transação: duas retiradas seguidas não passam juntas do que está guardado.
  const id = newId();
  await db.withTransactionAsync(async () => {
    const goal = await getGoal(db, goalId);
    if (!goal) throw new RangeError('Meta não encontrada.');
    const errors = validateContribution({
      kind,
      amountInCents,
      date: isValidLocalDate(date) ? date : null,
      savedInCents: goal.savedInCents,
    });
    if (errors.date) throw new RangeError('Data inválida.');
    if (errors.amount) {
      if (kind === 'WITHDRAWAL' && Number.isSafeInteger(amountInCents) && amountInCents > 0) {
        throw new ContributionExceedsBalanceError(goal.savedInCents);
      }
      throw new RangeError('Valor inválido.');
    }
    await db.runAsync('INSERT INTO goal_contributions (id, goal_id, amount_in_cents, date) VALUES (?, ?, ?, ?)', [
      id,
      goalId,
      signedContributionAmount(kind, amountInCents),
      date,
    ]);
  });
  return id;
}

/** Dados de exemplo: grava a meta só se o ID ainda não existe (restaurar não duplica nem desfaz). */
export async function insertGoalIfMissing(
  db: Database,
  goal: { id: string; name: string; targetInCents: number; targetDate: LocalDate | null; icon: string; color: string },
  createdAt: string,
): Promise<void> {
  await db.runAsync(
    'INSERT OR IGNORE INTO goals (id, name, target_in_cents, target_date, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [goal.id, goal.name, goal.targetInCents, goal.targetDate, goal.icon, goal.color, createdAt],
  );
}

export async function insertContributionIfMissing(
  db: Database,
  contribution: { id: string; goalId: string; amountInCents: number; date: LocalDate },
): Promise<void> {
  await db.runAsync('INSERT OR IGNORE INTO goal_contributions (id, goal_id, amount_in_cents, date) VALUES (?, ?, ?, ?)', [
    contribution.id,
    contribution.goalId,
    contribution.amountInCents,
    contribution.date,
  ]);
}

// Metas de economia: progresso, validação e aportes/retiradas. Funções puras; valores em centavos (ADR 01).
// Aportes não movimentam as contas: a meta é um acompanhamento à parte (modelo de dados do app).

import { parseDateInput } from './dateInput';
import type { LocalDate } from './dates';
import { formatCents } from './money';

export interface GoalProgress {
  /** quanto já foi guardado (soma dos aportes menos as retiradas) */
  savedInCents: number;
  targetInCents: number;
  /** quanto falta para o alvo; zero quando a meta foi batida */
  remainingInCents: number;
  /** guardado ÷ alvo, de 0 em diante (acima de 1 quando passa do alvo); 0 se o alvo não for positivo */
  ratio: number;
  /** percentual inteiro, arredondado para baixo: 52,9% → 52 */
  percent: number;
  /** o guardado chegou ao alvo */
  completed: boolean;
}

/** Progresso de uma meta. Alvo zero ou negativo não divide por zero: progresso 0 e meta não concluída. */
export function goalProgress(savedInCents: number, targetInCents: number): GoalProgress {
  const saved = Math.max(savedInCents, 0);
  if (!Number.isFinite(targetInCents) || targetInCents <= 0) {
    return { savedInCents: saved, targetInCents, remainingInCents: 0, ratio: 0, percent: 0, completed: false };
  }
  return {
    savedInCents: saved,
    targetInCents,
    remainingInCents: Math.max(targetInCents - saved, 0),
    ratio: saved / targetInCents,
    percent: Math.floor((saved * 100) / targetInCents),
    completed: saved >= targetInCents,
  };
}

export type ContributionKind = 'DEPOSIT' | 'WITHDRAWAL';

/** Valor gravado em `goal_contributions.amount_in_cents`: aporte positivo, retirada negativa. */
export function signedContributionAmount(kind: ContributionKind, amountInCents: number): number {
  return kind === 'WITHDRAWAL' && amountInCents !== 0 ? -amountInCents : amountInCents;
}

export const MAX_GOAL_NAME_LENGTH = 40;

/** Ícones e cores que a meta pode ter (nomes Lucide e chaves de cor do tema). */
export const GOAL_APPEARANCES = [
  { icon: 'PiggyBank', color: 'health', label: 'Cofrinho' },
  { icon: 'Plane', color: 'transport', label: 'Viagem' },
  { icon: 'House', color: 'housing', label: 'Casa' },
  { icon: 'Car', color: 'food', label: 'Carro' },
  { icon: 'GraduationCap', color: 'education', label: 'Estudos' },
  { icon: 'Gift', color: 'leisure', label: 'Presente' },
  { icon: 'Target', color: 'subscriptions', label: 'Outro' },
] as const;

export type GoalIconName = (typeof GOAL_APPEARANCES)[number]['icon'];

export const DEFAULT_GOAL_APPEARANCE = GOAL_APPEARANCES[0];

export interface NewGoalForm {
  name: string;
  /** valor-alvo digitado, em centavos e sem sinal */
  targetInCents: number;
  /** data-alvo como digitada (DD/MM/AAAA); vazia = sem data */
  targetDateText: string;
  icon: string;
}

export type NewGoalField = 'name' | 'target' | 'targetDate' | 'icon';
export type NewGoalErrors = Partial<Record<NewGoalField, string>>;

/** Data-alvo do texto digitado: `null` se estiver vazio, incompleto ou inválido (veja `validateNewGoal`). */
export function parseGoalTargetDate(text: string): LocalDate | null {
  return parseDateInput(text);
}

/** Erros do formulário de meta por campo (objeto vazio = pode salvar). A data-alvo é opcional, mas não pode ser passada. */
export function validateNewGoal(form: NewGoalForm, today: LocalDate): NewGoalErrors {
  const errors: NewGoalErrors = {};
  const name = form.name.trim();
  if (name === '') errors.name = 'Informe o nome da meta.';
  else if (name.length > MAX_GOAL_NAME_LENGTH) errors.name = `O nome pode ter até ${MAX_GOAL_NAME_LENGTH} letras.`;
  if (!Number.isSafeInteger(form.targetInCents) || form.targetInCents <= 0) {
    errors.target = 'Informe um valor-alvo maior que zero.';
  }
  if (form.targetDateText.trim() !== '') {
    const date = parseGoalTargetDate(form.targetDateText);
    if (date === null) errors.targetDate = 'Informe uma data válida, como 14/11/2027, ou deixe em branco.';
    else if (date < today) errors.targetDate = 'A data-alvo precisa ser hoje ou depois.';
  }
  if (!GOAL_APPEARANCES.some((option) => option.icon === form.icon)) errors.icon = 'Escolha um ícone.';
  return errors;
}

export interface ContributionForm {
  kind: ContributionKind;
  /** valor digitado, em centavos e sempre positivo; o sinal vem de `kind` */
  amountInCents: number;
  /** dia do aporte; nulo quando a digitação é inválida ou está incompleta */
  date: LocalDate | null;
  /** quanto a meta tem guardado agora */
  savedInCents: number;
}

export type ContributionField = 'amount' | 'date';
export type ContributionErrors = Partial<Record<ContributionField, string>>;

/** Erros do aporte ou da retirada por campo. A retirada não pode passar do que a meta tem guardado. */
export function validateContribution(form: ContributionForm): ContributionErrors {
  const errors: ContributionErrors = {};
  if (!Number.isSafeInteger(form.amountInCents) || form.amountInCents <= 0) {
    errors.amount = 'Informe um valor maior que zero.';
  } else if (form.kind === 'WITHDRAWAL' && form.amountInCents > Math.max(form.savedInCents, 0)) {
    errors.amount =
      form.savedInCents > 0
        ? `Você só pode retirar até ${formatCents(form.savedInCents)}.`
        : 'Esta meta não tem nada guardado para retirar.';
  }
  if (form.date === null) errors.date = 'Informe uma data válida, como 14/11/2026.';
  return errors;
}

import { addMonths, monthOf, type LocalDate } from '../../core/dates';

// Metas e aportes fictícios para a demo. IDs fixos: restaurar os dados de exemplo não duplica nada.

export interface SampleGoal {
  id: string;
  name: string;
  targetInCents: number;
  targetDate: LocalDate | null;
  icon: string;
  color: string;
}

export interface SampleContribution {
  id: string;
  goalId: string;
  amountInCents: number;
  date: LocalDate;
}

interface GoalTemplate extends Omit<SampleGoal, 'targetDate'> {
  /** meses depois da âncora (null = sem data-alvo) */
  targetMonthsAhead: number | null;
  /** aportes: meses em relação ao mês corrente (0 = corrente), dia e valor */
  contributions: { offset: number; day: number; amountInCents: number }[];
}

const TEMPLATES: GoalTemplate[] = [
  {
    id: 'sample-goal-viagem',
    name: 'Viagem de fim de ano',
    targetInCents: 450000,
    targetMonthsAhead: 2,
    icon: 'Plane',
    color: 'transport',
    contributions: [
      { offset: -2, day: 6, amountInCents: 80000 },
      { offset: -1, day: 6, amountInCents: 80000 },
      { offset: 0, day: 6, amountInCents: 80000 },
    ],
  },
  {
    id: 'sample-goal-reserva',
    name: 'Reserva de emergência',
    targetInCents: 1500000,
    targetMonthsAhead: null,
    icon: 'PiggyBank',
    color: 'health',
    contributions: [
      { offset: -2, day: 7, amountInCents: 100000 },
      { offset: -1, day: 7, amountInCents: 100000 },
      { offset: -1, day: 20, amountInCents: -20000 },
      { offset: 0, day: 7, amountInCents: 100000 },
    ],
  },
];

const pad = (day: number) => String(day).padStart(2, '0');

/** Metas e aportes de exemplo até `today`: nenhum aporte com data futura. Determinístico: mesmo `today`, mesma saída. */
export function generateSampleGoals(today: LocalDate): { goals: SampleGoal[]; contributions: SampleContribution[] } {
  const thisMonth = monthOf(today);
  const goals: SampleGoal[] = [];
  const contributions: SampleContribution[] = [];
  for (const { contributions: items, targetMonthsAhead, ...goal } of TEMPLATES) {
    goals.push({
      ...goal,
      targetDate: targetMonthsAhead === null ? null : `${addMonths(thisMonth, targetMonthsAhead)}-28`,
    });
    items.forEach((item, index) => {
      const date = `${addMonths(thisMonth, item.offset)}-${pad(item.day)}`;
      if (date > today) return;
      contributions.push({ id: `${goal.id}-${index + 1}`, goalId: goal.id, amountInCents: item.amountInCents, date });
    });
  }
  return { goals, contributions };
}

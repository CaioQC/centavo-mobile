import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GOAL_APPEARANCE,
  GOAL_APPEARANCES,
  MAX_GOAL_NAME_LENGTH,
  goalProgress,
  parseGoalTargetDate,
  signedContributionAmount,
  validateContribution,
  validateNewGoal,
  type ContributionForm,
  type NewGoalForm,
} from './goals';
import { formatCents } from './money';

describe('goalProgress', () => {
  it('sem aportes: 0% e falta o alvo inteiro', () => {
    expect(goalProgress(0, 500000)).toEqual({
      savedInCents: 0,
      targetInCents: 500000,
      remainingInCents: 500000,
      ratio: 0,
      percent: 0,
      completed: false,
    });
  });

  it('progresso parcial: 25% e falta o resto', () => {
    const progress = goalProgress(125000, 500000);
    expect(progress.ratio).toBe(0.25);
    expect(progress.percent).toBe(25);
    expect(progress.remainingInCents).toBe(375000);
    expect(progress.completed).toBe(false);
  });

  it('exatamente 100%: concluída e falta 0', () => {
    expect(goalProgress(500000, 500000)).toEqual({
      savedInCents: 500000,
      targetInCents: 500000,
      remainingInCents: 0,
      ratio: 1,
      percent: 100,
      completed: true,
    });
  });

  it('acima de 100%: ratio e percent passam de 1 e 100, falta 0 e concluída', () => {
    const progress = goalProgress(750000, 500000);
    expect(progress.ratio).toBe(1.5);
    expect(progress.percent).toBe(150);
    expect(progress.remainingInCents).toBe(0);
    expect(progress.completed).toBe(true);
  });

  it('1 centavo abaixo do alvo: não concluída, percent arredondado para baixo e falta 1', () => {
    const progress = goalProgress(499999, 500000);
    expect(progress.completed).toBe(false);
    expect(progress.percent).toBe(99);
    expect(progress.remainingInCents).toBe(1);
    expect(progress.ratio).toBeLessThan(1);
  });

  it('percent arredonda para baixo, nunca para cima (52,9% → 52)', () => {
    expect(goalProgress(529, 1000).percent).toBe(52);
    expect(goalProgress(1, 1000).percent).toBe(0);
  });

  it('1 centavo guardado de um alvo de 1 centavo conclui a meta', () => {
    const progress = goalProgress(1, 1);
    expect(progress.completed).toBe(true);
    expect(progress.percent).toBe(100);
    expect(progress.remainingInCents).toBe(0);
  });

  it('alvo zero não divide por zero: progresso 0 e não concluída', () => {
    const progress = goalProgress(10000, 0);
    expect(progress.ratio).toBe(0);
    expect(progress.percent).toBe(0);
    expect(progress.remainingInCents).toBe(0);
    expect(progress.completed).toBe(false);
    expect(Number.isNaN(progress.ratio)).toBe(false);
  });

  it('alvo zero sem nada guardado também não conclui', () => {
    const progress = goalProgress(0, 0);
    expect(progress.completed).toBe(false);
    expect(progress.ratio).toBe(0);
    expect(progress.percent).toBe(0);
  });

  it('alvo negativo: progresso 0 e não concluída', () => {
    const progress = goalProgress(10000, -50000);
    expect(progress.ratio).toBe(0);
    expect(progress.percent).toBe(0);
    expect(progress.remainingInCents).toBe(0);
    expect(progress.completed).toBe(false);
  });

  it('alvo NaN: sem NaN no progresso, não concluída', () => {
    const progress = goalProgress(10000, Number.NaN);
    expect(progress.ratio).toBe(0);
    expect(progress.percent).toBe(0);
    expect(progress.remainingInCents).toBe(0);
    expect(progress.completed).toBe(false);
  });

  it('alvo infinito é tratado como inválido', () => {
    const progress = goalProgress(10000, Number.POSITIVE_INFINITY);
    expect(progress.ratio).toBe(0);
    expect(progress.completed).toBe(false);
  });

  it('guardado negativo é tratado como 0', () => {
    const progress = goalProgress(-5000, 100000);
    expect(progress.savedInCents).toBe(0);
    expect(progress.ratio).toBe(0);
    expect(progress.percent).toBe(0);
    expect(progress.remainingInCents).toBe(100000);
    expect(progress.completed).toBe(false);
  });

  it('guardado negativo com alvo inválido continua em 0', () => {
    expect(goalProgress(-1, 0).savedInCents).toBe(0);
  });

  it('valores grandes (R$ 1.000.000,00) sem perder precisão', () => {
    const progress = goalProgress(50000000, 100000000);
    expect(progress.ratio).toBe(0.5);
    expect(progress.percent).toBe(50);
    expect(progress.remainingInCents).toBe(50000000);
    expect(goalProgress(100000000, 100000000).completed).toBe(true);
    expect(goalProgress(99999999, 100000000).percent).toBe(99);
  });

  it('devolve o alvo recebido', () => {
    expect(goalProgress(100, 300).targetInCents).toBe(300);
  });
});

describe('signedContributionAmount', () => {
  it('aporte fica positivo', () => {
    expect(signedContributionAmount('DEPOSIT', 25000)).toBe(25000);
  });

  it('retirada fica negativa', () => {
    expect(signedContributionAmount('WITHDRAWAL', 25000)).toBe(-25000);
  });

  it('1 centavo e valores grandes', () => {
    expect(signedContributionAmount('DEPOSIT', 1)).toBe(1);
    expect(signedContributionAmount('WITHDRAWAL', 1)).toBe(-1);
    expect(signedContributionAmount('WITHDRAWAL', 100000000)).toBe(-100000000);
  });

  it('retirada de 0 não vira -0 distinguível de 0 na soma', () => {
    expect(signedContributionAmount('WITHDRAWAL', 0) + 0).toBe(0);
  });
});

describe('parseGoalTargetDate', () => {
  it('converte DD/MM/AAAA em AAAA-MM-DD', () => {
    expect(parseGoalTargetDate('14/11/2027')).toBe('2027-11-14');
  });

  it('texto vazio, incompleto ou com dia inexistente dá null', () => {
    expect(parseGoalTargetDate('')).toBeNull();
    expect(parseGoalTargetDate('14/11/20')).toBeNull();
    expect(parseGoalTargetDate('31/02/2027')).toBeNull();
  });

  it('29/02 só existe em ano bissexto', () => {
    expect(parseGoalTargetDate('29/02/2028')).toBe('2028-02-29');
    expect(parseGoalTargetDate('29/02/2027')).toBeNull();
  });
});

describe('GOAL_APPEARANCES', () => {
  it('tem opções com ícones únicos e o padrão é a primeira', () => {
    expect(GOAL_APPEARANCES.length).toBeGreaterThan(0);
    const icons = GOAL_APPEARANCES.map((option) => option.icon);
    expect(new Set(icons).size).toBe(icons.length);
    expect(DEFAULT_GOAL_APPEARANCE).toBe(GOAL_APPEARANCES[0]);
  });

  it('toda opção tem ícone, cor e rótulo preenchidos', () => {
    for (const option of GOAL_APPEARANCES) {
      expect(option.icon).not.toBe('');
      expect(option.color).not.toBe('');
      expect(option.label).not.toBe('');
    }
  });
});

describe('validateNewGoal', () => {
  const today = '2026-11-20';
  const valid: NewGoalForm = {
    name: 'Viagem',
    targetInCents: 500000,
    targetDateText: '',
    icon: 'Plane',
  };

  it('formulário válido, com data vazia, não tem erros', () => {
    expect(validateNewGoal(valid, today)).toEqual({});
  });

  describe('nome', () => {
    it('vazio ou só espaços dá erro', () => {
      expect(validateNewGoal({ ...valid, name: '' }, today).name).toBeDefined();
      expect(validateNewGoal({ ...valid, name: '     ' }, today).name).toBeDefined();
    });

    it('40 letras é aceito e 41 dá erro', () => {
      expect(validateNewGoal({ ...valid, name: 'a'.repeat(MAX_GOAL_NAME_LENGTH) }, today).name).toBeUndefined();
      expect(validateNewGoal({ ...valid, name: 'a'.repeat(MAX_GOAL_NAME_LENGTH + 1) }, today).name).toBeDefined();
    });

    it('espaços nas pontas não contam para o limite', () => {
      const name = `  ${'a'.repeat(MAX_GOAL_NAME_LENGTH)}  `;
      expect(validateNewGoal({ ...valid, name }, today).name).toBeUndefined();
    });

    it('o limite é 40', () => {
      expect(MAX_GOAL_NAME_LENGTH).toBe(40);
    });
  });

  describe('valor-alvo', () => {
    it('0 e negativo dão erro', () => {
      expect(validateNewGoal({ ...valid, targetInCents: 0 }, today).target).toBeDefined();
      expect(validateNewGoal({ ...valid, targetInCents: -100 }, today).target).toBeDefined();
    });

    it('decimal, NaN e infinito dão erro (só centavos inteiros)', () => {
      expect(validateNewGoal({ ...valid, targetInCents: 10.5 }, today).target).toBeDefined();
      expect(validateNewGoal({ ...valid, targetInCents: Number.NaN }, today).target).toBeDefined();
      expect(validateNewGoal({ ...valid, targetInCents: Number.POSITIVE_INFINITY }, today).target).toBeDefined();
    });

    it('1 centavo e R$ 1.000.000,00 são aceitos', () => {
      expect(validateNewGoal({ ...valid, targetInCents: 1 }, today).target).toBeUndefined();
      expect(validateNewGoal({ ...valid, targetInCents: 100000000 }, today).target).toBeUndefined();
    });
  });

  describe('data-alvo', () => {
    it('vazia ou só espaços é válida (a data é opcional)', () => {
      expect(validateNewGoal({ ...valid, targetDateText: '' }, today).targetDate).toBeUndefined();
      expect(validateNewGoal({ ...valid, targetDateText: '   ' }, today).targetDate).toBeUndefined();
    });

    it('inválida (31/02/2027) ou incompleta dá erro', () => {
      expect(validateNewGoal({ ...valid, targetDateText: '31/02/2027' }, today).targetDate).toBeDefined();
      expect(validateNewGoal({ ...valid, targetDateText: '14/11/20' }, today).targetDate).toBeDefined();
      expect(validateNewGoal({ ...valid, targetDateText: '14/1' }, today).targetDate).toBeDefined();
    });

    it('data passada dá erro', () => {
      expect(validateNewGoal({ ...valid, targetDateText: '19/11/2026' }, today).targetDate).toBeDefined();
      expect(validateNewGoal({ ...valid, targetDateText: '20/11/2025' }, today).targetDate).toBeDefined();
    });

    it('hoje é aceito, e amanhã também', () => {
      expect(validateNewGoal({ ...valid, targetDateText: '20/11/2026' }, today).targetDate).toBeUndefined();
      expect(validateNewGoal({ ...valid, targetDateText: '21/11/2026' }, today).targetDate).toBeUndefined();
    });

    it('virada de ano: 01/01 do ano seguinte é futuro', () => {
      expect(validateNewGoal({ ...valid, targetDateText: '01/01/2027' }, '2026-12-31').targetDate).toBeUndefined();
      expect(validateNewGoal({ ...valid, targetDateText: '31/12/2026' }, '2027-01-01').targetDate).toBeDefined();
    });
  });

  describe('ícone', () => {
    it('todo ícone de GOAL_APPEARANCES é aceito', () => {
      for (const option of GOAL_APPEARANCES) {
        expect(validateNewGoal({ ...valid, icon: option.icon }, today).icon).toBeUndefined();
      }
    });

    it('ícone fora da lista ou vazio dá erro', () => {
      expect(validateNewGoal({ ...valid, icon: 'Rocket' }, today).icon).toBeDefined();
      expect(validateNewGoal({ ...valid, icon: '' }, today).icon).toBeDefined();
    });
  });

  it('acumula os erros de vários campos de uma vez', () => {
    const errors = validateNewGoal({ name: '', targetInCents: 0, targetDateText: '31/02/2027', icon: 'x' }, today);
    expect(Object.keys(errors).sort()).toEqual(['icon', 'name', 'target', 'targetDate']);
  });
});

describe('validateContribution', () => {
  const deposit: ContributionForm = {
    kind: 'DEPOSIT',
    amountInCents: 10000,
    date: '2026-11-20',
    savedInCents: 50000,
  };
  const withdrawal: ContributionForm = { ...deposit, kind: 'WITHDRAWAL' };

  it('aporte válido não tem erros', () => {
    expect(validateContribution(deposit)).toEqual({});
  });

  it('retirada válida não tem erros', () => {
    expect(validateContribution(withdrawal)).toEqual({});
  });

  it('valor 0, negativo, decimal ou NaN dá erro, em aporte e retirada', () => {
    for (const base of [deposit, withdrawal]) {
      expect(validateContribution({ ...base, amountInCents: 0 }).amount).toBeDefined();
      expect(validateContribution({ ...base, amountInCents: -100 }).amount).toBeDefined();
      expect(validateContribution({ ...base, amountInCents: 10.5 }).amount).toBeDefined();
      expect(validateContribution({ ...base, amountInCents: Number.NaN }).amount).toBeDefined();
    }
  });

  it('retirada igual ao saldo é aceita', () => {
    expect(validateContribution({ ...withdrawal, amountInCents: 50000 }).amount).toBeUndefined();
  });

  it('retirada de saldo + 1 centavo dá erro com o valor guardado formatado em reais', () => {
    const errors = validateContribution({ ...withdrawal, amountInCents: 50001 });
    expect(errors.amount).toBeDefined();
    expect(errors.amount).toContain(formatCents(50000));
  });

  it('a mensagem formata valores grandes (R$ 1.000.000,00)', () => {
    const errors = validateContribution({ ...withdrawal, amountInCents: 100000001, savedInCents: 100000000 });
    expect(errors.amount).toContain(formatCents(100000000));
    expect(errors.amount).toContain('1.000.000,00');
  });

  it('retirada com saldo 0 avisa que não há nada guardado', () => {
    const errors = validateContribution({ ...withdrawal, savedInCents: 0, amountInCents: 1 });
    expect(errors.amount).toContain('nada guardado');
  });

  it('retirada com saldo negativo também avisa que não há nada guardado', () => {
    const errors = validateContribution({ ...withdrawal, savedInCents: -5000, amountInCents: 1 });
    expect(errors.amount).toContain('nada guardado');
  });

  it('aporte não tem limite de saldo', () => {
    expect(validateContribution({ ...deposit, amountInCents: 999999999, savedInCents: 0 })).toEqual({});
    expect(validateContribution({ ...deposit, amountInCents: 1, savedInCents: -5000 })).toEqual({});
  });

  it('data nula (digitação inválida ou incompleta) dá erro', () => {
    const errors = validateContribution({ ...deposit, date: null });
    expect(errors.date).toBeDefined();
    expect(errors.amount).toBeUndefined();
  });

  it('retirada acima do saldo e data nula acumulam os dois erros', () => {
    const errors = validateContribution({ ...withdrawal, amountInCents: 60000, date: null });
    expect(Object.keys(errors).sort()).toEqual(['amount', 'date']);
  });

  it('valor inválido não gera a mensagem de saldo (só a de valor)', () => {
    const errors = validateContribution({ ...withdrawal, amountInCents: 0, savedInCents: 0 });
    expect(errors.amount).not.toContain('nada guardado');
  });
});

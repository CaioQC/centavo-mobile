import { describe, expect, it } from 'vitest';

import { generateSampleGoals } from './goals';

describe('generateSampleGoals', () => {
  it('é determinístico e nunca traz aporte com data futura', () => {
    for (const today of ['2026-11-01', '2026-11-14', '2026-12-31', '2027-01-06']) {
      const a = generateSampleGoals(today);
      expect(generateSampleGoals(today)).toEqual(a);
      expect(a.contributions.every((c) => c.date <= today)).toBe(true);
    }
  });

  it('IDs únicos; data-alvo só na meta que a tem, no futuro', () => {
    const { goals, contributions } = generateSampleGoals('2026-11-14');
    expect(new Set(contributions.map((c) => c.id)).size).toBe(contributions.length);
    expect(goals.find((g) => g.id === 'sample-goal-reserva')?.targetDate).toBeNull();
    expect(goals.find((g) => g.id === 'sample-goal-viagem')?.targetDate).toBe('2027-01-28');
  });

  it('a retirada de exemplo nunca deixa a meta negativa', () => {
    for (const today of ['2026-11-14', '2026-12-08', '2027-01-31']) {
      const { contributions } = generateSampleGoals(today);
      let saved = 0;
      for (const c of [...contributions].sort((a, b) => (a.date < b.date ? -1 : 1))) {
        saved += c.amountInCents;
        expect(saved).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

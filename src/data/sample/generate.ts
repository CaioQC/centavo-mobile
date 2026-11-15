import { addMonths, budgetMonth, monthOf, type LocalDate } from '../../core/dates';
import { SAMPLE_CARD_ID, SAMPLE_CHECKING_ID } from './catalog';

/** Quantos meses os dados de exemplo cobrem: o mês corrente e os dois anteriores. */
export const SAMPLE_MONTHS = 3;

export interface SampleTransaction {
  accountExternalId: string;
  /** ID da transação no banco fictício; é a chave que impede duplicar na importação */
  externalId: string;
  description: string;
  /** negativo para despesa */
  amountInCents: number;
  date: LocalDate;
  categoryId: string;
  installmentNumber: number | null;
  totalInstallments: number | null;
}

interface Template {
  slug: string;
  account: string;
  description: string;
  /** valor em centavos, positivo; o sinal vem de `income` */
  amountInCents: number;
  income?: boolean;
  categoryId: string;
  /** dias do mês em que acontece (todos ≤ 28, valem em qualquer mês) */
  days: number[];
  /** se o valor varia de mês a mês e de ocorrência a ocorrência */
  varies?: boolean;
  /** só em alguns meses, em relação ao mês corrente (0 = corrente, -1 = anterior...) */
  onlyOffsets?: number[];
}

const TEMPLATES: Template[] = [
  { slug: 'salario', account: SAMPLE_CHECKING_ID, description: 'Salário - Estúdio Lumen', amountInCents: 520000, income: true, categoryId: 'salary', days: [5] },
  { slug: 'freela', account: SAMPLE_CHECKING_ID, description: 'Projeto avulso - Casa Verde Design', amountInCents: 85000, income: true, categoryId: 'other-income', days: [20], onlyOffsets: [-1] },
  { slug: 'aluguel', account: SAMPLE_CHECKING_ID, description: 'Aluguel', amountInCents: 145000, categoryId: 'housing', days: [6] },
  { slug: 'condominio', account: SAMPLE_CHECKING_ID, description: 'Condomínio Edifício Ipê', amountInCents: 38000, categoryId: 'housing', days: [8] },
  { slug: 'energia', account: SAMPLE_CHECKING_ID, description: 'Conta de energia', amountInCents: 14000, categoryId: 'housing', days: [10], varies: true },
  { slug: 'internet', account: SAMPLE_CHECKING_ID, description: 'Internet fibra Conecta+', amountInCents: 9990, categoryId: 'housing', days: [10] },
  { slug: 'mercado', account: SAMPLE_CHECKING_ID, description: 'Mercado Boa Compra', amountInCents: 21000, categoryId: 'food', days: [3, 12, 19, 26], varies: true },
  { slug: 'padaria', account: SAMPLE_CHECKING_ID, description: 'Padaria Pão Quente', amountInCents: 2200, categoryId: 'food', days: [4, 15, 23], varies: true },
  { slug: 'combustivel', account: SAMPLE_CHECKING_ID, description: 'Posto Estrela', amountInCents: 20000, categoryId: 'transport', days: [9, 24], varies: true },
  { slug: 'farmacia', account: SAMPLE_CHECKING_ID, description: 'Farmácia Vida', amountInCents: 7500, categoryId: 'health', days: [14], varies: true },
  { slug: 'streaming', account: SAMPLE_CARD_ID, description: 'Streaming Cine+', amountInCents: 3990, categoryId: 'subscriptions', days: [11] },
  { slug: 'musica', account: SAMPLE_CARD_ID, description: 'Música Ritmo', amountInCents: 2190, categoryId: 'subscriptions', days: [11] },
  { slug: 'restaurante', account: SAMPLE_CARD_ID, description: 'Restaurante Sabor da Casa', amountInCents: 8500, categoryId: 'food', days: [7, 21], varies: true },
  { slug: 'cinema', account: SAMPLE_CARD_ID, description: 'Cine Aurora', amountInCents: 5600, categoryId: 'leisure', days: [16], varies: true },
  { slug: 'roupas', account: SAMPLE_CARD_ID, description: 'Moda Viva', amountInCents: 19990, categoryId: 'shopping', days: [18], onlyOffsets: [-2, 0] },
  { slug: 'curso', account: SAMPLE_CARD_ID, description: 'Curso online Aprende+', amountInCents: 12900, categoryId: 'education', days: [2] },
  { slug: 'corrida', account: SAMPLE_CARD_ID, description: 'App de corrida Vai', amountInCents: 2400, categoryId: 'transport', days: [13, 27], varies: true },
];

/** Compra parcelada que o banco lança de uma vez (parcelas futuras com data futura; ADR 11). */
const INSTALLMENT_PURCHASE = {
  slug: 'notebook',
  account: SAMPLE_CARD_ID,
  description: 'Notebook TechMais',
  totalInCents: 150000,
  count: 3,
  categoryId: 'shopping',
  day: 12,
  /** mês da compra em relação ao mês corrente */
  offset: -1,
};

/** Variação determinística (sem Math.random): os mesmos dados de exemplo a cada importação. */
function vary(base: number, seed: number): number {
  const steps = ((seed * 7919) % 11) - 5; // -5 a +5
  return base + steps * Math.round(base / 50);
}

const pad = (day: number) => String(day).padStart(2, '0');

/**
 * Transações fictícias dos últimos três meses até `today`: nada com data depois de hoje, exceto as
 * parcelas futuras da compra parcelada. Determinístico: mesmo `today`, mesma saída.
 */
export function generateSampleTransactions(today: LocalDate): SampleTransaction[] {
  const thisMonth = monthOf(today);
  const result: SampleTransaction[] = [];

  for (let offset = -(SAMPLE_MONTHS - 1); offset <= 0; offset += 1) {
    const month = addMonths(thisMonth, offset);
    TEMPLATES.forEach((template, templateIndex) => {
      if (template.onlyOffsets && !template.onlyOffsets.includes(offset)) return;
      template.days.forEach((day, occurrence) => {
        const date = `${month}-${pad(day)}`;
        if (date > today) return;
        const absolute = template.varies
          ? vary(template.amountInCents, offset * 101 + templateIndex * 13 + occurrence * 3 + 400)
          : template.amountInCents;
        result.push({
          accountExternalId: template.account,
          externalId: `${month}-${template.slug}-${occurrence + 1}`,
          description: template.description,
          amountInCents: template.income ? absolute : -absolute,
          date,
          categoryId: template.categoryId,
          installmentNumber: null,
          totalInstallments: null,
        });
      });
    });
  }

  const purchase = INSTALLMENT_PURCHASE;
  const purchaseMonth = addMonths(thisMonth, purchase.offset);
  const purchaseDate = `${purchaseMonth}-${pad(purchase.day)}`;
  const base = Math.floor(purchase.totalInCents / purchase.count);
  for (let number = 1; number <= purchase.count; number += 1) {
    const installmentMonth = budgetMonth(purchaseDate, number);
    result.push({
      accountExternalId: purchase.account,
      externalId: `${purchaseMonth}-${purchase.slug}-${number}`,
      description: purchase.description,
      // a diferença de centavo fica na primeira parcela
      amountInCents: -(number === 1 ? purchase.totalInCents - base * (purchase.count - 1) : base),
      date: `${installmentMonth}-${pad(purchase.day)}`,
      categoryId: purchase.categoryId,
      installmentNumber: number,
      totalInstallments: purchase.count,
    });
  }

  return result;
}

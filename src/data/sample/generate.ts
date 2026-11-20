import type { LocalDate } from '../../core/dates';
import {
  BANK_MONTHS,
  generateBankTransactions,
  type BankScript,
  type BankTransaction,
} from '../banks/generate';
import { SAMPLE_CARD_ID, SAMPLE_CHECKING_ID } from './catalog';

/** Quantos meses os dados de exemplo cobrem: o mês corrente e os dois anteriores. */
export const SAMPLE_MONTHS = BANK_MONTHS;

export type SampleTransaction = BankTransaction;

/** Roteiro do Banco Jabuticaba, o banco dos dados de exemplo (valores e IDs iguais desde a etapa 1). */
export const JABUTICABA_SCRIPT: BankScript = {
  templates: [
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
  ],
  installmentPurchases: [
    {
      slug: 'notebook',
      account: SAMPLE_CARD_ID,
      description: 'Notebook TechMais',
      totalInCents: 150000,
      count: 3,
      categoryId: 'shopping',
      day: 12,
      offset: -1,
    },
  ],
};

/** Transações fictícias do Banco Jabuticaba até `today`. Determinístico: mesmo `today`, mesma saída. */
export function generateSampleTransactions(today: LocalDate): SampleTransaction[] {
  return generateBankTransactions(JABUTICABA_SCRIPT, today);
}

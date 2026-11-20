import type { Bank } from './types';

// Bancos, contas, estabelecimentos e valores 100% inventados: nenhum nome imita instituição real (CLAUDE.md).

const PITANGA_CHECKING = 'cd-4410';
const PITANGA_CARD = 'cartao-4410';

export const BANCO_PITANGA: Bank = {
  key: 'pitanga',
  name: 'Banco Pitanga',
  tagline: 'Conta digital e cartão, sem tarifa.',
  anchorSettingKey: 'bank_anchor:pitanga',
  accounts: [
    { externalId: PITANGA_CHECKING, name: 'Conta Digital', type: 'BANK', initialBalanceInCents: 62000, creditLimitInCents: null },
    { externalId: PITANGA_CARD, name: 'Cartão Pitanga', type: 'CREDIT_CARD', initialBalanceInCents: 0, creditLimitInCents: 450000 },
  ],
  script: {
    templates: [
      { slug: 'consultoria', account: PITANGA_CHECKING, description: 'Consultoria - Oficina Brisa', amountInCents: 120000, income: true, categoryId: 'other-income', days: [15] },
      { slug: 'plano-saude', account: PITANGA_CHECKING, description: 'Plano de saúde Vitalis', amountInCents: 31500, categoryId: 'health', days: [7] },
      { slug: 'academia', account: PITANGA_CHECKING, description: 'Academia Movimento', amountInCents: 8900, categoryId: 'leisure', days: [9] },
      { slug: 'delivery', account: PITANGA_CHECKING, description: 'Delivery Come Bem', amountInCents: 4200, categoryId: 'food', days: [5, 14, 22, 28], varies: true },
      { slug: 'transporte', account: PITANGA_CHECKING, description: 'Corrida Vamos', amountInCents: 1800, categoryId: 'transport', days: [3, 11, 17, 25], varies: true },
      { slug: 'livraria', account: PITANGA_CARD, description: 'Livraria Página Viva', amountInCents: 7400, categoryId: 'education', days: [8], varies: true, onlyOffsets: [-1, 0] },
      { slug: 'casa', account: PITANGA_CARD, description: 'Loja Casa & Cia', amountInCents: 15900, categoryId: 'shopping', days: [19], varies: true },
      { slug: 'pet', account: PITANGA_CARD, description: 'Pet Amigo', amountInCents: 9800, categoryId: 'other', days: [12] },
    ],
    installmentPurchases: [
      { slug: 'bicicleta', account: PITANGA_CARD, description: 'Bicicleta Pedal Forte', totalInCents: 90000, count: 3, categoryId: 'transport', day: 20, offset: -2 },
    ],
  },
};

const CAJU_CARD = 'cartao-7702';

export const CAJU_DIGITAL: Bank = {
  key: 'caju',
  name: 'Caju Digital',
  tagline: 'Só o cartão de crédito, sem anuidade.',
  anchorSettingKey: 'bank_anchor:caju',
  accounts: [
    { externalId: CAJU_CARD, name: 'Cartão Caju', type: 'CREDIT_CARD', initialBalanceInCents: 0, creditLimitInCents: 300000 },
  ],
  script: {
    templates: [
      { slug: 'supermercado', account: CAJU_CARD, description: 'Supermercado Bom Preço', amountInCents: 18000, categoryId: 'food', days: [6, 20], varies: true },
      { slug: 'cafeteria', account: CAJU_CARD, description: 'Cafeteria Grão Dourado', amountInCents: 2800, categoryId: 'food', days: [4, 13, 24], varies: true },
      { slug: 'posto', account: CAJU_CARD, description: 'Posto Rota 7', amountInCents: 14000, categoryId: 'transport', days: [10], varies: true },
      { slug: 'teatro', account: CAJU_CARD, description: 'Teatro Palco Aberto', amountInCents: 7200, categoryId: 'leisure', days: [15], onlyOffsets: [-1, 0] },
      { slug: 'leitura', account: CAJU_CARD, description: 'Leitura Diária+', amountInCents: 1990, categoryId: 'subscriptions', days: [2] },
      { slug: 'farmacia', account: CAJU_CARD, description: 'Farmácia Bem-Estar', amountInCents: 6400, categoryId: 'health', days: [17], varies: true },
    ],
    installmentPurchases: [
      { slug: 'fogao', account: CAJU_CARD, description: 'Fogão Lar Doce', totalInCents: 120000, count: 4, categoryId: 'housing', day: 9, offset: -1 },
    ],
  },
};

const CAMBUCI_CHECKING = 'cc-9031';

export const COOPERATIVA_CAMBUCI: Bank = {
  key: 'cambuci',
  name: 'Cooperativa Cambuci',
  tagline: 'Conta cooperada para o dia a dia.',
  anchorSettingKey: 'bank_anchor:cambuci',
  accounts: [
    { externalId: CAMBUCI_CHECKING, name: 'Conta Cooperada', type: 'BANK', initialBalanceInCents: 250000, creditLimitInCents: null },
  ],
  script: {
    templates: [
      { slug: 'salario', account: CAMBUCI_CHECKING, description: 'Salário - Instituto Horizonte', amountInCents: 380000, income: true, categoryId: 'salary', days: [5] },
      { slug: 'taxa-cooperativa', account: CAMBUCI_CHECKING, description: 'Mensalidade da cooperativa', amountInCents: 2500, categoryId: 'other', days: [1] },
      { slug: 'aluguel', account: CAMBUCI_CHECKING, description: 'Aluguel', amountInCents: 110000, categoryId: 'housing', days: [7] },
      { slug: 'energia', account: CAMBUCI_CHECKING, description: 'Conta de energia', amountInCents: 11000, categoryId: 'housing', days: [10], varies: true },
      { slug: 'agua', account: CAMBUCI_CHECKING, description: 'Conta de água Aquaviva', amountInCents: 6200, categoryId: 'housing', days: [12], varies: true },
      { slug: 'escola', account: CAMBUCI_CHECKING, description: 'Mensalidade Escola Pequeno Aprendiz', amountInCents: 45000, categoryId: 'education', days: [10] },
      { slug: 'seguro-auto', account: CAMBUCI_CHECKING, description: 'Seguro Auto Proteja', amountInCents: 19000, categoryId: 'transport', days: [15] },
      { slug: 'armazem', account: CAMBUCI_CHECKING, description: 'Armazém Tio Zeca', amountInCents: 17000, categoryId: 'food', days: [2, 9, 16, 23], varies: true },
    ],
    installmentPurchases: [],
  },
};

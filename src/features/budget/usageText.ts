import type { BudgetUsage } from '../../core/spending';

/** Texto do estado ao lado da barra: "Atenção · 82%", "Estourou · 112%", "62%" ou "Sem limite". */
export function usageText(usage: BudgetUsage): string {
  switch (usage.status) {
    case 'NONE':
      return 'Sem limite';
    case 'OVER':
      return `Estourou · ${usage.percent}%`;
    case 'WARNING':
      return `Atenção · ${usage.percent}%`;
    default:
      return `${usage.percent}%`;
  }
}

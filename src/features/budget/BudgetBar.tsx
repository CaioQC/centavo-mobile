import { StyleSheet, View } from 'react-native';

import type { BudgetUsage } from '../../core/spending';
import { radius, useTheme } from '../../shared/theme';

interface BudgetBarProps {
  usage: BudgetUsage;
  /** cor da categoria; a barra passa a âmbar (Atenção) ou laranja (Estourou) quando o limite aperta */
  color: string;
}

/** Barra de gasto contra limite. O estado também aparece em texto ao lado (nunca só por cor). */
export function BudgetBar({ usage, color }: BudgetBarProps) {
  const { colors } = useTheme();
  const fill = usage.status === 'OVER' ? colors.over : usage.status === 'WARNING' ? colors.warn : color;
  const width = `${Math.round(Math.min(Math.max(usage.ratio, 0), 1) * 100)}%` as const;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.track, { backgroundColor: colors.track }]}
    >
      {usage.status !== 'NONE' && usage.ratio > 0 ? <View style={[styles.fill, { width, backgroundColor: fill }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.pill },
});

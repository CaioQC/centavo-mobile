import { StyleSheet, View } from 'react-native';

import { radius, useTheme } from '../../shared/theme';

interface GoalProgressBarProps {
  /** guardado ÷ alvo; acima de 1 a barra fica cheia */
  ratio: number;
  /** cor da meta; a barra fica verde (`income`) quando a meta é batida */
  color: string;
  completed: boolean;
  height?: number;
}

/** Barra de progresso da meta. O estado também aparece em texto ao lado ("Meta batida", "52%"). */
export function GoalProgressBar({ ratio, color, completed, height = 8 }: GoalProgressBarProps) {
  const { colors } = useTheme();
  const width = `${Math.round(Math.min(Math.max(ratio, 0), 1) * 100)}%` as const;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.track, { height, backgroundColor: colors.track }]}
    >
      {ratio > 0 ? (
        <View style={{ width, height, borderRadius: radius.pill, backgroundColor: completed ? colors.income : color }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: 'hidden' },
});

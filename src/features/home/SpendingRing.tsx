import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '../../shared/components';
import { useTheme } from '../../shared/theme';

interface SpendingRingProps {
  /** gasto ÷ limite; acima de 1 o anel fica cheio */
  ratio: number;
  /** cor do arco (accent, warn ou over) */
  color: string;
  /** texto no centro ("82%"); vazio quando não há orçamento */
  label: string;
  size?: number;
}

const STROKE = 10;

/** Anel de progresso do gasto do mês. O estado também aparece em texto ao lado (nunca só por cor). */
export function SpendingRing({ ratio, color, label, size = 96 }: SpendingRingProps) {
  const { colors } = useTheme();
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(Math.max(ratio, 0), 1);
  return (
    <View style={{ width: size, height: size }} accessible={false} importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.track} strokeWidth={STROKE} fill="none" />
        {filled > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference * filled} ${circumference}`}
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        ) : null}
      </Svg>
      <View style={styles.center}>
        <AppText variant="bodyStrong">{label}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});

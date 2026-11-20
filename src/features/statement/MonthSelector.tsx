import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { addMonths, type YearMonth } from '../../core/dates';
import { formatMonthLabel } from '../../core/labels';
import { AppText } from '../../shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../../shared/theme';

interface MonthSelectorProps {
  month: YearMonth;
  onChange: (month: YearMonth) => void;
}

/** Seletor de mês: setas para o mês anterior e o seguinte, com o nome do mês no meio. */
export function MonthSelector({ month, onChange }: MonthSelectorProps) {
  const { colors } = useTheme();
  const label = formatMonthLabel(month);
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mês anterior, ${formatMonthLabel(addMonths(month, -1))}`}
        onPress={() => onChange(addMonths(month, -1))}
        style={styles.arrow}
      >
        <ChevronLeft size={22} color={colors.text} />
      </Pressable>
      <AppText variant="heading" accessibilityRole="header" accessibilityLiveRegion="polite">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Próximo mês, ${formatMonthLabel(addMonths(month, 1))}`}
        onPress={() => onChange(addMonths(month, 1))}
        style={styles.arrow}
      >
        <ChevronRight size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
  },
  arrow: { width: MIN_TOUCH_SIZE, height: MIN_TOUCH_SIZE, alignItems: 'center', justifyContent: 'center' },
});

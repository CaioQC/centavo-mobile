import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { GOAL_APPEARANCES } from '../../core/goals';
import { CategoryBadge } from '../../shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../../shared/theme';

interface GoalIconPickerProps {
  /** nome do ícone escolhido */
  value: string;
  onChange: (icon: string) => void;
}

/** Escolha do ícone (e da cor) da meta. */
export function GoalIconPicker({ value, onChange }: GoalIconPickerProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {GOAL_APPEARANCES.map((option) => {
        const selected = option.icon === value;
        return (
          <Pressable
            key={option.icon}
            accessibilityRole="radio"
            accessibilityLabel={`Ícone ${option.label}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.icon)}
            style={[styles.option, { borderColor: selected ? colors.accent : colors.cardBorder, backgroundColor: colors.card }]}
          >
            <CategoryBadge icon={option.icon} color={option.color} size={36} />
            {selected ? (
              <View style={[styles.check, { backgroundColor: colors.accent }]}>
                <Check size={12} color={colors.onAccent} strokeWidth={3} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  check: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  option: {
    minWidth: MIN_TOUCH_SIZE + spacing.sm,
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    borderWidth: 2,
  },
});

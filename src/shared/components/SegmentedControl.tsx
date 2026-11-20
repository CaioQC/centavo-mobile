import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../theme';
import { AppText } from './AppText';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Texto lido pelo leitor de tela, quando `label` sozinho não basta ("Tema Claro"). */
  accessibilityLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Alternador de uma escolha entre poucas opções (Despesa / Receita, Sistema / Claro / Escuro). */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && { backgroundColor: colors.accent }]}
          >
            <AppText variant="bodyStrong" style={{ color: selected ? colors.onAccent : colors.muted }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', padding: spacing.xs, borderRadius: radius.pill, borderWidth: 1 },
  option: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

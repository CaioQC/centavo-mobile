import { Pressable, StyleSheet, View } from 'react-native';

import type { TransactionKind } from '../../core/newTransaction';
import { AppText } from '../../shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../../shared/theme';

interface KindSwitchProps {
  value: TransactionKind;
  onChange: (kind: TransactionKind) => void;
}

const OPTIONS: { kind: TransactionKind; label: string }[] = [
  { kind: 'EXPENSE', label: 'Despesa' },
  { kind: 'INCOME', label: 'Receita' },
];

/** Alternador Despesa / Receita. */
export function KindSwitch({ value, onChange }: KindSwitchProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {OPTIONS.map((option) => {
        const selected = option.kind === value;
        return (
          <Pressable
            key={option.kind}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.kind)}
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

import { Pressable, StyleSheet, View } from 'react-native';

import { THEME_PREFERENCE_LABELS, THEME_PREFERENCES, type ThemePreference } from '../../core/themePreference';
import { AppText } from '../../shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../../shared/theme';

interface ThemeSwitchProps {
  value: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}

/** Alternador Sistema / Claro / Escuro. */
export function ThemeSwitch({ value, onChange }: ThemeSwitchProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {THEME_PREFERENCES.map((preference) => {
        const selected = preference === value;
        return (
          <Pressable
            key={preference}
            accessibilityRole="button"
            accessibilityLabel={`Tema ${THEME_PREFERENCE_LABELS[preference]}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(preference)}
            style={[styles.option, selected && { backgroundColor: colors.accent }]}
          >
            <AppText variant="bodyStrong" style={{ color: selected ? colors.onAccent : colors.muted }}>
              {THEME_PREFERENCE_LABELS[preference]}
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

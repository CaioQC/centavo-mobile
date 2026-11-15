import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown } from 'lucide-react-native';

import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../theme';
import { AppText } from './AppText';
import { CategoryBadge } from './CategoryBadge';

export interface SelectOption {
  /** `null` é a opção "todas" dos filtros */
  value: string | null;
  label: string;
  /** quando é uma categoria: ícone e cor dela */
  categoryIcon?: string;
  categoryColor?: string;
}

interface SelectFieldProps {
  /** nome do campo, lido pelo leitor de tela ("Conta", "Categoria") */
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string | null) => void;
  /** título da folha de opções; padrão: `label` */
  sheetTitle?: string;
}

/** Campo que mostra a opção escolhida e abre uma folha de opções por cima da tela. */
export function SelectField({ label, value, options, onChange, sheetTitle }: SelectFieldProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? ''}`}
        onPress={() => setOpen(true)}
        style={[styles.field, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      >
        <View style={styles.fieldText}>
          <AppText variant="caption" tone="muted">
            {label}
          </AppText>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {selected?.label}
          </AppText>
        </View>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={() => setOpen(false)}
        />
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + spacing.lg }]}>
          <AppText variant="heading" accessibilityRole="header" style={styles.sheetTitle}>
            {sheetTitle ?? label}
          </AppText>
          <FlatList
            data={options}
            keyExtractor={(option) => option.value ?? '__all__'}
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={styles.option}
                >
                  {item.categoryIcon ? (
                    <CategoryBadge icon={item.categoryIcon} color={item.categoryColor} size={32} />
                  ) : null}
                  <AppText variant={isSelected ? 'bodyStrong' : 'body'} style={styles.optionLabel}>
                    {item.label}
                  </AppText>
                  {isSelected ? <Check size={20} color={colors.accentText} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  fieldText: { flex: 1 },
  backdrop: { flex: 1 },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: radius.cardLarge,
    borderTopRightRadius: radius.cardLarge,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sheetTitle: { marginBottom: spacing.sm },
  option: {
    minHeight: MIN_TOUCH_SIZE + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionLabel: { flex: 1 },
});

import { useMemo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';

import type { Account, Category } from '../../data/types';
import { SelectField, type SelectOption } from '../../shared/components';
import { MIN_TOUCH_SIZE, fontFamily, radius, spacing, useTheme } from '../../shared/theme';

interface StatementFiltersProps {
  accounts: Account[];
  categories: Category[];
  accountId: string | null;
  categoryId: string | null;
  query: string;
  onAccountChange: (accountId: string | null) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onQueryChange: (query: string) => void;
}

/** Busca pela descrição e filtros de conta e categoria do extrato. */
export function StatementFilters({
  accounts,
  categories,
  accountId,
  categoryId,
  query,
  onAccountChange,
  onCategoryChange,
  onQueryChange,
}: StatementFiltersProps) {
  const { colors } = useTheme();

  const accountOptions = useMemo<SelectOption[]>(
    () => [{ value: null, label: 'Todas as contas' }, ...accounts.map((account) => ({ value: account.id, label: account.name }))],
    [accounts],
  );
  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      { value: null, label: 'Todas as categorias' },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
      })),
    ],
    [categories],
  );

  return (
    <View style={styles.root}>
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Search size={18} color={colors.muted} />
        <TextInput
          accessibilityLabel="Buscar pela descrição"
          placeholder="Buscar pela descrição"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={onQueryChange}
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: colors.text }]}
        />
        {query !== '' ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => onQueryChange('')} style={styles.clear}>
            <X size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.selects}>
        <SelectField label="Conta" sheetTitle="Filtrar por conta" value={accountId} options={accountOptions} onChange={onAccountChange} />
        <SelectField label="Categoria" sheetTitle="Filtrar por categoria" value={categoryId} options={categoryOptions} onChange={onCategoryChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  search: {
    minHeight: MIN_TOUCH_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  input: { flex: 1, minHeight: MIN_TOUCH_SIZE, fontFamily: fontFamily.regular, fontSize: 15 },
  clear: { width: MIN_TOUCH_SIZE, height: MIN_TOUCH_SIZE, alignItems: 'center', justifyContent: 'center' },
  selects: { flexDirection: 'row', gap: spacing.sm },
});

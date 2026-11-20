import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { formatDateInput, maskDateInput } from '../../core/dateInput';
import { todayLocal } from '../../core/dates';
import { formatCents, parseDigitsToCents } from '../../core/money';
import { MIN_TOUCH_SIZE, fontFamily, radius, spacing, useTheme } from '../theme';
import { AppText } from './AppText';
import { SelectField, type SelectOption } from './SelectField';

interface FieldProps {
  label: string;
  /** mensagem de erro do campo, em português */
  error?: string;
  /** texto de apoio abaixo do campo (quando não há erro) */
  hint?: string;
  children: ReactNode;
}

/** Rótulo, campo e mensagem de erro (ou dica) de um formulário. Envolve qualquer controle (`TextField`, `SelectField`, ...). */
export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="bodyStrong">{label}</AppText>
      {children}
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="captionMoney" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/** Caixa de texto com as cores do tema; a base de todos os campos digitados. `amount` usa o corpo grande dos valores. */
export function Input({ amount = false, style, ...props }: TextInputProps & { amount?: boolean }) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[
        styles.input,
        amount && styles.amount,
        { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text },
        style,
      ]}
    />
  );
}

interface FieldBase {
  label: string;
  error?: string;
  hint?: string;
}

interface TextFieldProps extends Pick<FieldBase, 'label' | 'error'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
}

/** Campo de texto com rótulo, erro e dica. */
export function TextField({ label, error, value, onChangeText, placeholder, maxLength }: TextFieldProps) {
  return (
    <Field label={label} error={error}>
      <Input
        accessibilityLabel={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
      />
    </Field>
  );
}

interface MoneyFieldProps extends FieldBase {
  valueInCents: number;
  onChangeCents: (valueInCents: number) => void;
}

/** Campo de valor em reais: só aceita dígitos (que entram como centavos) e mostra "R$ 1.234,56"; zero fica vazio. */
export function MoneyField({ label, error, hint, valueInCents, onChangeCents }: MoneyFieldProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <Input
        amount
        accessibilityLabel={label}
        keyboardType="number-pad"
        placeholder="R$ 0,00"
        value={valueInCents === 0 ? '' : formatCents(valueInCents)}
        onChangeText={(text) => onChangeCents(parseDigitsToCents(text))}
      />
    </Field>
  );
}

interface SelectFormFieldProps extends FieldBase {
  value: string | null;
  options: SelectOption[];
  onChange: (value: string | null) => void;
  /** título da folha de opções; padrão: `label` */
  sheetTitle?: string;
}

/** Campo de escolha (conta, categoria, parcelas): rótulo, erro e dica em volta do `SelectField`. */
export function SelectFormField({ label, error, hint, value, options, onChange, sheetTitle }: SelectFormFieldProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <View style={styles.selectRow}>
        <SelectField label={label} sheetTitle={sheetTitle} value={value} options={options} onChange={onChange} />
      </View>
    </Field>
  );
}

interface DateFieldProps extends FieldBase {
  /** Texto lido pelo leitor de tela, quando o rótulo visível é mais longo ("Data-alvo (opcional)"); padrão: `label`. */
  accessibilityLabel?: string;
  /** texto digitado, no formato DD/MM/AAAA */
  value: string;
  onChangeText: (text: string) => void;
  /** Mostra o atalho "Hoje", que preenche a data de hoje (fuso de São Paulo). */
  showToday?: boolean;
}

/** Campo de data DD/MM/AAAA com máscara; com `showToday`, ganha o atalho "Hoje". */
export function DateField({ label, error, hint, accessibilityLabel, value, onChangeText, showToday = false }: DateFieldProps) {
  const input = (
    <Input
      accessibilityLabel={accessibilityLabel ?? label}
      keyboardType="number-pad"
      placeholder="DD/MM/AAAA"
      value={value}
      onChangeText={(text) => onChangeText(maskDateInput(text))}
      maxLength={10}
      style={showToday ? styles.dateInput : undefined}
    />
  );
  return (
    <Field label={label} error={error} hint={hint}>
      {showToday ? (
        <View style={styles.dateRow}>
          {input}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Usar a data de hoje"
            onPress={() => onChangeText(formatDateInput(todayLocal()))}
            style={styles.today}
          >
            <AppText tone="accent" variant="bodyStrong">
              Hoje
            </AppText>
          </Pressable>
        </View>
      ) : (
        input
      )}
    </Field>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  input: {
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
  },
  amount: { fontFamily: fontFamily.extrabold, fontSize: 24, fontVariant: ['tabular-nums'] },
  selectRow: { flexDirection: 'row' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateInput: { flex: 1 },
  today: { minHeight: MIN_TOUCH_SIZE, minWidth: MIN_TOUCH_SIZE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
});

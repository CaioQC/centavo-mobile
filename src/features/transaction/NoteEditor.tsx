import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../shared/components';
import { MIN_TOUCH_SIZE, fontFamily, radius, spacing, useTheme } from '../../shared/theme';

interface NoteEditorProps {
  /** observação já gravada ('' quando não há) */
  initial: string;
  /** grava a observação; deve lançar erro se não conseguir (o botão volta a ficar disponível) */
  onSave: (note: string) => Promise<void>;
}

/** Campo de observação com botão "Salvar observação" (ativo só quando o texto mudou). */
export function NoteEditor({ initial, onSave }: NoteEditorProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(initial.trim());
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const dirty = text.trim() !== saved;

  const save = async () => {
    setSaving(true);
    setFailed(false);
    try {
      await onSave(text);
      setSaved(text.trim());
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppText variant="bodyStrong">Observação</AppText>
      <TextInput
        accessibilityLabel="Observação"
        placeholder="Escreva uma observação sobre este lançamento"
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
        textAlignVertical="top"
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
      />
      {failed ? (
        <AppText variant="caption" style={{ color: colors.over }} accessibilityLiveRegion="polite">
          Não foi possível salvar a observação. Tente de novo.
        </AppText>
      ) : null}
      <View style={styles.footer}>
        <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
          {!dirty && saved !== '' ? 'Observação salva.' : ''}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Salvar observação"
          accessibilityState={{ disabled: !dirty || saving }}
          disabled={!dirty || saving}
          onPress={save}
          style={[styles.button, { backgroundColor: dirty ? colors.accent : colors.track }]}
        >
          {saving ? (
            <ActivityIndicator accessibilityLabel="Salvando" color={colors.onAccent} />
          ) : (
            <AppText variant="bodyStrong" style={{ color: dirty ? colors.onAccent : colors.muted }}>
              Salvar observação
            </AppText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  input: {
    minHeight: 96,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  button: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

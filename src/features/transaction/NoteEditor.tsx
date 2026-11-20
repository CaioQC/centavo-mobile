import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Input } from '../../shared/components';
import { spacing } from '../../shared/theme';

interface NoteEditorProps {
  /** observação já gravada ('' quando não há) */
  initial: string;
  /** grava a observação; deve lançar erro se não conseguir (o botão volta a ficar disponível) */
  onSave: (note: string) => Promise<void>;
}

/** Campo de observação com botão "Salvar observação" (ativo só quando o texto mudou). */
export function NoteEditor({ initial, onSave }: NoteEditorProps) {
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
      <AppText variant="bodyStrong" accessibilityRole="header">
        Observação
      </AppText>
      <Input
        accessibilityLabel="Observação"
        placeholder="Escreva uma observação sobre este lançamento"
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
        textAlignVertical="top"
        style={styles.input}
      />
      {failed ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          Não foi possível salvar a observação. Tente de novo.
        </AppText>
      ) : null}
      <View style={styles.footer}>
        <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite" style={styles.caption}>
          {!dirty && saved !== '' ? 'Observação salva.' : ''}
        </AppText>
        <Button label="Salvar observação" disabled={!dirty} loading={saving} onPress={save} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  input: { minHeight: 96, padding: spacing.md, lineHeight: 22 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caption: { flexShrink: 1 },
});

import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Info, Landmark, Receipt, ShieldCheck, type LucideProps } from 'lucide-react-native';

import { findBank } from '@/data/banks/catalog';
import { AppText, Button, Card, EmptyState, Screen, Section } from '@/shared/components';
import { spacing, useTheme } from '@/shared/theme';

const READS: { icon: ComponentType<LucideProps>; title: string; text: string }[] = [
  { icon: Landmark, title: 'Contas', text: 'Nome, tipo, saldo inicial e, no cartão, o limite.' },
  { icon: Receipt, title: 'Transações dos últimos 3 meses', text: 'Descrição, valor, data, categoria sugerida e parcelas.' },
];

const GUARANTEES = [
  'Só leitura: o Centavo não movimenta dinheiro.',
  'Tudo fica no seu aparelho.',
  'Categorias e observações que você mudar nunca são sobrescritas.',
];

export default function ConnectBankConsentScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { colors } = useTheme();
  const bank = findBank(key);
  const goBack = () => router.back();

  if (!bank) {
    return (
      <Screen title="Consentimento" onBack={goBack}>
        <EmptyState
          icon={Landmark}
          title="Banco não encontrado"
          message="Volte à lista e escolha um dos bancos disponíveis."
          actionLabel="Voltar"
          onAction={goBack}
        />
      </Screen>
    );
  }

  const authorize = () => router.replace({ pathname: '/connect-bank-sync', params: { key: bank.key } });

  return (
    <Screen title="Consentimento" onBack={goBack} scroll>
      <AppText variant="heading" accessibilityRole="header">
        Conectar {bank.name}?
      </AppText>

      <Card
        accessibilityLabel="Atenção: isto é uma simulação. O banco é fictício e os dados são inventados. Nenhum dado bancário real é lido ou enviado."
        style={[styles.panel, styles.notice, { borderColor: colors.accentText }]}
      >
        <Info size={20} color={colors.accentText} strokeWidth={2} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong" style={{ color: colors.accentText }}>
            Isto é uma simulação
          </AppText>
          <AppText variant="caption" tone="muted">
            O banco é fictício e os dados são inventados. Nenhum dado bancário real é lido ou enviado.
          </AppText>
        </View>
      </Card>

      <Section title="O que será lido">
        <Card style={styles.panel}>
          {READS.map(({ icon: Icon, title, text }) => (
            <View key={title} style={styles.item}>
              <Icon size={20} color={colors.muted} strokeWidth={1.75} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{title}</AppText>
                <AppText variant="caption" tone="muted">
                  {text}
                </AppText>
              </View>
            </View>
          ))}
          <AppText variant="caption" tone="muted">
            Contas deste banco: {bank.accounts.map((account) => account.name).join(', ')}.
          </AppText>
        </Card>
      </Section>

      <Section title="Suas garantias">
        <Card style={styles.panel}>
          {GUARANTEES.map((text) => (
            <View key={text} style={styles.item}>
              <ShieldCheck size={20} color={colors.income} strokeWidth={1.75} />
              <AppText style={styles.flex}>{text}</AppText>
            </View>
          ))}
        </Card>
      </Section>

      <View style={styles.actions}>
        <Button label="Autorizar e conectar" onPress={authorize} />
        <Button label="Cancelar" variant="tonal" onPress={goBack} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: { gap: spacing.md, padding: spacing.md },
  notice: { flexDirection: 'row', alignItems: 'flex-start' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  actions: { gap: spacing.sm },
});

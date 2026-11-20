import type { ComponentType } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Info, Landmark, Receipt, ShieldCheck, type LucideProps } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { findBank } from '@/data/banks/catalog';
import { AppText, Button, EmptyState, Screen } from '@/shared/components';
import { radius, spacing, useTheme } from '@/shared/theme';

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
  const insets = useSafeAreaInsets();
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
    <Screen title="Consentimento" onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <AppText variant="heading" accessibilityRole="header">
          Conectar {bank.name}?
        </AppText>

        <View
          accessible
          accessibilityLabel="Atenção: isto é uma simulação. O banco é fictício e os dados são inventados. Nenhum dado bancário real é lido ou enviado."
          style={[styles.card, styles.notice, { backgroundColor: colors.card, borderColor: colors.accentText }]}
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
        </View>

        <View style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            O que será lido
          </AppText>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
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
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            Suas garantias
          </AppText>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {GUARANTEES.map((text) => (
              <View key={text} style={styles.item}>
                <ShieldCheck size={20} color={colors.income} strokeWidth={1.75} />
                <AppText style={styles.flex}>{text}</AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button label="Autorizar e conectar" onPress={authorize} />
          <Button label="Cancelar" variant="tonal" onPress={goBack} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  section: { gap: spacing.sm },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radius.card, borderWidth: 1 },
  notice: { flexDirection: 'row', alignItems: 'flex-start' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  actions: { gap: spacing.sm },
});

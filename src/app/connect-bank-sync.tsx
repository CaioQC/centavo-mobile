import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { CircleCheck, Landmark, TriangleAlert } from 'lucide-react-native';

import { pluralize, syncSummaryText } from '@/core/connections';
import { findBank } from '@/data/banks/catalog';
import { importBank, type BankImportSummary } from '@/data/banks/import';
import { useDatabase } from '@/data/useDbQuery';
import { AppText, Button, Card, EmptyState, Screen } from '@/shared/components';
import { spacing, useTheme } from '@/shared/theme';

/** A importação local é instantânea; este tempo mínimo deixa a etapa "Sincronizando…" visível. */
const MIN_SYNC_MS = 1500;

type Phase = { status: 'syncing' } | { status: 'done'; summary: BankImportSummary } | { status: 'error' };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function ConnectBankSyncScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const db = useDatabase();
  const bank = findBank(key);
  const [phase, setPhase] = useState<Phase>({ status: 'syncing' });
  const [attempt, setAttempt] = useState(0);
  const startedAttempt = useRef(-1);

  useEffect(() => {
    // Uma importação por tentativa, mesmo que o efeito rode duas vezes (modo de desenvolvimento).
    if (!bank || startedAttempt.current === attempt) return;
    startedAttempt.current = attempt;
    Promise.all([importBank(db, bank), wait(MIN_SYNC_MS)]).then(
      ([summary]) => setPhase({ status: 'done', summary }),
      () => setPhase({ status: 'error' }),
    );
  }, [bank, db, attempt]);

  // Enquanto sincroniza não dá para voltar (nem pelo botão do Android nem pelo gesto).
  const syncing = phase.status === 'syncing';
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !syncing });
    if (!syncing) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [navigation, syncing]);

  const retry = () => {
    setPhase({ status: 'syncing' });
    setAttempt((value) => value + 1);
  };
  const backToAccounts = () => router.dismissTo('/accounts');
  const openStatement = () => {
    router.dismissAll();
    router.navigate('/statement');
  };

  if (!bank) {
    return (
      <Screen title="Sincronização" onBack={() => router.back()}>
        <EmptyState
          icon={Landmark}
          title="Banco não encontrado"
          message="Volte à lista e escolha um dos bancos disponíveis."
          actionLabel="Voltar"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (phase.status === 'syncing') {
    return (
      <Screen title="Sincronizando…">
        <View style={styles.centered} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" accessibilityLabel="Sincronizando" color={colors.accentText} />
          <AppText variant="heading" accessibilityRole="header" style={styles.text}>
            Lendo contas e transações
          </AppText>
          <AppText tone="muted" style={styles.text}>
            {bank.name} · simulação, com dados inventados.
          </AppText>
        </View>
      </Screen>
    );
  }

  if (phase.status === 'error') {
    return (
      <Screen title="Sincronização" onBack={backToAccounts}>
        <EmptyState
          icon={TriangleAlert}
          title="Não foi possível sincronizar"
          message="Nada foi importado pela metade e seus dados continuam como estavam. Tente de novo."
          actionLabel="Tentar de novo"
          onAction={retry}
        />
      </Screen>
    );
  }

  const { summary } = phase;
  const title = summary.newConnection ? `${bank.name} conectado` : `${bank.name} sincronizado`;
  const summaryText = syncSummaryText(summary);

  return (
    <Screen title="Resumo" scroll>
      <Card accessibilityLabel={`${title}. ${summaryText}`} accessibilityLiveRegion="polite" style={styles.panel}>
        <CircleCheck size={32} color={colors.income} strokeWidth={1.75} />
        <AppText variant="heading" accessibilityRole="header" style={styles.text}>
          {title}
        </AppText>
        <AppText style={styles.text}>{summaryText}</AppText>
      </Card>

      <Card style={[styles.panel, styles.stats]}>
        <StatRow label="Contas" value={pluralize(summary.accounts, 'conta', 'contas')} extra={summary.newAccounts} />
        <StatRow
          label="Transações"
          value={pluralize(summary.transactions, 'transação', 'transações')}
          extra={summary.newTransactions}
        />
      </Card>

      <AppText variant="caption" tone="muted" style={styles.text}>
        Simulação: bancos e valores são fictícios.
        {summary.newConnection ? '' : ' Suas categorias e observações foram mantidas.'}
      </AppText>

      <View style={styles.actions}>
        <Button label="Ver extrato" onPress={openStatement} />
        <Button label="Concluir" variant="tonal" onPress={backToAccounts} />
      </View>
    </Screen>
  );
}

function StatRow({ label, value, extra }: { label: string; value: string; extra: number }) {
  const { colors } = useTheme();
  const extraText = extra > 0 ? `+${extra} ${extra === 1 ? 'nova' : 'novas'}` : 'nenhuma nova';
  return (
    <View style={styles.statRow} accessible accessibilityLabel={`${label}: ${value}, ${extraText}`}>
      <AppText tone="muted">{label}</AppText>
      <View style={styles.statValues}>
        <AppText variant="bodyStrong">{value}</AppText>
        <AppText variant="caption" style={{ color: extra > 0 ? colors.income : colors.muted }}>
          {extraText}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingBottom: spacing.xxl },
  text: { textAlign: 'center' },
  panel: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  stats: { alignItems: 'stretch', gap: spacing.md },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValues: { alignItems: 'flex-end' },
  actions: { gap: spacing.sm },
});

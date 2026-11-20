import { Pressable, StyleSheet, View } from 'react-native';
import { Check, ChevronRight, Landmark, RefreshCw } from 'lucide-react-native';

import { lastSyncText, type BankListItem } from '../../core/connections';
import type { Bank } from '../../data/banks/types';
import { AppText, Button } from '../../shared/components';
import { MIN_TOUCH_SIZE, radius, spacing, useTheme } from '../../shared/theme';

interface BankRowProps {
  bank: BankListItem<Bank>;
  /** Banco ainda não conectado: abre o consentimento. */
  onConnect: (bank: Bank) => void;
  /** Banco já conectado: sincroniza de novo. */
  onSync: (bank: Bank) => void;
}

/** Linha da lista de bancos fictícios: nome, contas e, se já conectado, quando foi sincronizado. */
export function BankRow({ bank, onConnect, onSync }: BankRowProps) {
  const { colors } = useTheme();
  const accountNames = bank.accounts.map((account) => account.name).join(' · ');
  const status = bank.connected ? `Conectado · ${lastSyncText(bank.lastSyncedAt)}` : null;

  const content = (
    <View style={styles.header}>
      <View style={[styles.icon, { backgroundColor: colors.track }]}>
        <Landmark size={20} color={colors.muted} strokeWidth={1.75} />
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {bank.name}
        </AppText>
        <AppText variant="caption" tone="muted">
          {bank.tagline}
        </AppText>
        <AppText variant="caption" tone="muted">
          {accountNames}
        </AppText>
        {status ? (
          <View style={styles.status}>
            <Check size={14} color={colors.income} strokeWidth={2.25} />
            <AppText variant="caption" style={{ color: colors.income }}>
              {status}
            </AppText>
          </View>
        ) : null}
      </View>
      {bank.connected ? null : <ChevronRight size={20} color={colors.muted} />}
    </View>
  );

  if (bank.connected) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View accessible accessibilityLabel={`${bank.name}, ${bank.tagline} Contas: ${accountNames}. ${status}`}>{content}</View>
        <Button label="Sincronizar de novo" icon={RefreshCw} variant="tonal" onPress={() => onSync(bank)} />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conectar ${bank.name}. ${bank.tagline} Contas: ${accountNames}`}
      onPress={() => onConnect(bank)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: MIN_TOUCH_SIZE + spacing.lg,
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: radius.categoryIcon, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
});

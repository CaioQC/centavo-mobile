import { StyleSheet, View } from 'react-native';
import { Check, ChevronRight, Landmark, RefreshCw } from 'lucide-react-native';

import { lastSyncText, type BankListItem } from '../../core/connections';
import type { Bank } from '../../data/banks/types';
import { AppText, Button, ListRow } from '../../shared/components';
import { spacing, useTheme } from '../../shared/theme';

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

  const subtitle = (
    <View style={styles.lines}>
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
  );

  return (
    <ListRow
      icon={Landmark}
      title={bank.name}
      subtitle={subtitle}
      trailing={bank.connected ? null : <ChevronRight size={20} color={colors.muted} />}
      accessibilityLabel={
        bank.connected
          ? `${bank.name}, ${bank.tagline} Contas: ${accountNames}. ${status}`
          : `Conectar ${bank.name}. ${bank.tagline} Contas: ${accountNames}`
      }
      onPress={bank.connected ? undefined : () => onConnect(bank)}
    >
      {bank.connected ? <Button label="Sincronizar de novo" icon={RefreshCw} variant="tonal" onPress={() => onSync(bank)} /> : null}
    </ListRow>
  );
}

const styles = StyleSheet.create({
  lines: { gap: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
});

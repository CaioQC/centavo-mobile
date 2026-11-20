import type { ComponentType } from 'react';
import { ActivityIndicator } from 'react-native';
import { TriangleAlert, type LucideProps } from 'lucide-react-native';

import { useTheme } from '../theme';
import { EmptyState } from './EmptyState';

interface QueryFallbackProps {
  /** `status` do `useDbQuery`: carregando mostra o indicador; erro, o aviso com "Tentar de novo". */
  status: 'loading' | 'ready' | 'error';
  /** Título do erro, no formato "Não foi possível carregar o extrato". */
  errorTitle: string;
  /** Padrão: "Algo deu errado ao ler os dados do aparelho. Tente de novo." */
  errorMessage?: string;
  onRetry: () => void;
  /** Telas de um item só: com a consulta pronta e o item ausente (removido), mostra este aviso com "Voltar". */
  notFound?: { icon?: ComponentType<LucideProps>; title: string; message: string; onBack: () => void };
}

/** O que mostrar no lugar da tela enquanto os dados não chegaram: carregamento, erro ou item não encontrado. */
export function QueryFallback({
  status,
  errorTitle,
  errorMessage = 'Algo deu errado ao ler os dados do aparelho. Tente de novo.',
  onRetry,
  notFound,
}: QueryFallbackProps) {
  const { colors } = useTheme();
  if (status === 'error') {
    return (
      <EmptyState icon={TriangleAlert} title={errorTitle} message={errorMessage} actionLabel="Tentar de novo" onAction={onRetry} />
    );
  }
  if (status === 'ready' && notFound) {
    return (
      <EmptyState
        icon={notFound.icon ?? TriangleAlert}
        title={notFound.title}
        message={notFound.message}
        actionLabel="Voltar"
        onAction={notFound.onBack}
      />
    );
  }
  return <ActivityIndicator accessibilityLabel="Carregando" color={colors.muted} />;
}

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import type { Database } from './database';

export type QueryState<T> =
  | { status: 'loading'; data: T | null }
  | { status: 'ready'; data: T }
  | { status: 'error'; data: T | null };

type Query<T> = (db: Database) => Promise<T>;

interface Stored<T> {
  status: QueryState<T>['status'];
  data: T | null;
  /** consulta que produziu `data`: resultado de outra consulta (outro mês, por ex.) não vale */
  source: Query<T> | null;
}

/**
 * Carrega dados pelos repositórios e recarrega toda vez que a tela volta ao foco (por exemplo,
 * depois de fechar o "Novo lançamento"). Enquanto recarrega a MESMA consulta, mantém o resultado
 * anterior para a lista não piscar; quando a consulta muda (outro mês), o resultado antigo é descartado.
 * `query` precisa ser estável (`useCallback`): ao mudar, a consulta roda de novo.
 * A tela nunca escreve SQL: `query` só chama funções de `src/data/repositories`.
 */
export function useDbQuery<T>(query: Query<T>): QueryState<T> & { reload: () => void } {
  const db = useSQLiteContext();
  const [stored, setStored] = useState<Stored<T>>({ status: 'loading', data: null, source: null });
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setStored((previous) => ({
        status: 'loading',
        data: previous.source === query ? previous.data : null,
        source: query,
      }));
      query(db).then(
        (data) => {
          if (active) setStored({ status: 'ready', data, source: query });
        },
        () => {
          if (active) {
            setStored((previous) => ({
              status: 'error',
              data: previous.source === query ? previous.data : null,
              source: query,
            }));
          }
        },
      );
      return () => {
        active = false;
      };
      // `attempt` só existe para "Tentar de novo" refazer a consulta.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, query, attempt]),
  );

  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  // Na renderização logo após a consulta mudar, o efeito ainda não rodou: não mostre o resultado antigo.
  const data = stored.source === query ? stored.data : null;
  const status = stored.source === query ? stored.status : 'loading';
  return { status, data, reload } as QueryState<T> & { reload: () => void };
}

/** O banco do aparelho, para a tela chamar os repositórios ao gravar (a tela não escreve SQL). */
export function useDatabase(): Database {
  return useSQLiteContext();
}

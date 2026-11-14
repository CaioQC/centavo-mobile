---
tags: [adr]
status: aceita
data: 2026-11-14
---

# ADR 05: Offline-first no mobile

> **Histórico:** suspensa em 2026-11-04, quando o app mobile saiu do roadmap do Centavo. Reativada em 2026-11-14 no **centavo-mobile** (app da disciplina), com outra regra: lá não há API, então o aparelho é a fonte da verdade, não um cache ([registro de decisões](../decisoes/registro.md)). A versão anterior previa TanStack Query com persistência local (MMKV / Async Storage) sobre a API, em *Stale-While-Revalidate*; ela volta a valer se o mobile um dia consumir a API do Centavo completo.

**Contexto:** o app mobile da disciplina é avaliado num vídeo curto e numa apresentação em sala. Não tem back-end ([escopo](../mobile/escopo.md)), e a demo não pode depender de rede nem de servidor no ar.

**Decisão:** os dados ficam no aparelho, num banco SQLite, que é a fonte da verdade. O app responde na hora ao abrir e funciona sem internet.

**Regra:**
- Toda leitura e escrita passa por `src/data` (repositórios sobre o `expo-sqlite`); telas não escrevem SQL.
- O esquema muda só por migração versionada (`PRAGMA user_version`), nunca apagando o banco do usuário.
- A conexão bancária simulada também grava no SQLite: importar é inserir contas e transações fictícias pelo `external_id`, sem duplicar ([modelo de dados do app](../mobile/modelo-de-dados.md)).
- Regras de cálculo (orçamento, metas, centavos, datas) ficam em `src/core`, puras, e recebem os dados prontos.

**Consequências:** a demo não quebra por rede; não há sincronização entre aparelhos nem backup (desinstalar o app apaga os dados, aceitável para a disciplina). Ligar o app ao Centavo completo depois exigiria trocar `src/data` por chamadas à API e voltar à regra anterior desta ADR.

Relacionadas: [ADR 01](adr-01-valores-em-centavos.md), [ADR 10](adr-10-datas-e-fuso-horario.md), [ADR 11](adr-11-orcamento-cartao-parcelado.md)

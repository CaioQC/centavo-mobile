# Centavo Mobile

App mobile (Expo + React Native + TypeScript) de finanças pessoais, **versão reduzida do Centavo** feita para a atividade AT2-N2 da disciplina de Programação de App (UCB). Avaliado por um vídeo de ~30 s e uma apresentação em sala; prazo de 1 a 2 semanas a partir de 14/11/2026. **Estado atual: etapas 0 (fundação), 1 (dados e extrato), 2 (início e desbloqueio), 3 (orçamento) e 4 (metas) prontas: extrato, lançamentos com parcelas, Início, contas, biometria, ajustes, orçamento por categoria e metas com aportes e retiradas; faltam a conexão simulada (etapa 5) e o polimento (etapa 6).**

Este repositório nasceu da `main` do [Centavo](https://github.com/CaioQC/Centavo) (remote `upstream`), que é Backend + Web com a Pluggy. O vault em `docs/` veio junto: **o que vale para o app está em `docs/mobile/`**; o resto descreve o Centavo completo e serve de referência para as regras de negócio. Comece por [docs/mobile/escopo.md](docs/mobile/escopo.md); o índice geral é [docs/inicio.md](docs/inicio.md).

## O app em resumo
- **Sem back-end:** dados num SQLite no aparelho, que é a fonte da verdade ([ADR 05](docs/adr/adr-05-offline-first-mobile.md)). Sem Pluggy real: a conexão bancária é **simulada**, com bancos e dados fictícios.
- **Entra:** desbloqueio por biometria, início, extrato com recategorização, lançamentos manuais (parcelas no cartão), contas manuais, orçamento por categoria, metas com aportes manuais, conexão simulada e dados de exemplo.
- **Fica de fora:** projeção de fatura, assinaturas, regras de categorização, IA, transferências internas, login com senha/TOTP.
- Telas e roteiro do vídeo: `docs/mobile/telas-e-demo.md`. Etapas: `docs/mobile/roadmap.md`.

## Sobre o dono do projeto
- Caio, dev **back-end** (Java/Spring no trabalho). Mobile/front não é o foco dele: neste app o Claude tende a escrever boa parte do código, então explique as escolhas de React Native quando não forem óbvias.
- Conversa em **português**. Código (classes, campos, rotas) em inglês; textos para o usuário e documentação em português.
- Trabalha no projeto pelo PC e, no celular, por sessões do Claude Code na nuvem (planejamento).

## Onde está cada assunto
| Para… | Leia |
|---|---|
| **O app mobile: escopo, stack, dados, telas, roadmap, git** | `docs/mobile/` |
| Entender o produto (Centavo completo) e o que foi decidido | `docs/produto/decisoes-de-produto.md` |
| Saber **por que** algo foi decidido | `docs/decisoes/registro.md` |
| Regras de arquitetura | `docs/adr/` (uma ADR por arquivo; índice em `docs/inicio.md`) |
| Tabelas e campos | `docs/mobile/modelo-de-dados.md` (app); `docs/dominio/modelo-de-dados.md` (Centavo completo) |
| Fluxos (conexão, reconciliação, pipeline, fatura, orçamento) | `docs/fluxos/` |
| O que a Pluggy faz de verdade | `docs/pluggy/fatos-verificados.md` |
| O que ainda falta confirmar | `docs/pluggy/pendencias.md` |
| Próximos passos | `docs/mobile/roadmap.md` (etapas) e as Issues do GitHub do centavo-mobile (uma Milestone por etapa, critérios na própria Issue) |
| Nomes de branch, commits e PRs | `docs/mobile/fluxo-de-git.md` (diferenças do app) e `docs/arquitetura/convencoes-de-git.md` (o resto) |
| Uso do Claude no desenvolvimento (co-autoria, revisão, dados) | `docs/arquitetura/uso-de-ia-no-desenvolvimento.md` |

Leia só as notas do assunto da tarefa; não é preciso ler o vault inteiro.

## Regras de trabalho
- **Git no PC:** nunca fazer commit, push nem abrir PR sem perguntar antes. O padrão é deixar as alterações sem commitar e entregar o texto da mensagem de commit.
- **Branches:** só a `main` (padrão) e branches de trabalho criadas dela, de volta por PR com squash. Não há `develop`, `homolog` nem hotfix. Detalhes em `docs/mobile/fluxo-de-git.md`.
- **Git na nuvem (sessão do Claude Code):** pode commitar e dar push **na branch da sessão**. Nunca fazer merge na `main` nem abrir PR sem pedido explícito; PR de trabalho vai para a `main`, aberto como **rascunho**, com o Caio como assignee e a label `claude`. Só o Caio tira de rascunho, depois de revisar. No PC não se usa branch `claude/...`.
- **Autoria na nuvem:** a sessão começa com o git configurado como Claude. Antes do primeiro commit, rode `git config user.name "CaioQC"` e `git config user.email "129068301+CaioQC@users.noreply.github.com"` (e-mail *noreply* do GitHub, ligado à conta do Caio), para que o commit saia com a autoria do Caio.
- Commits e títulos de PR em Conventional Commits com escopo `app`, `core` ou `data` (`feat(app): ...`); branches `tipo/N-descricao` (número da Issue obrigatório em `feat` e `fix`). Detalhes em `docs/mobile/fluxo-de-git.md`.
- **Co-autoria do Claude:** commit em que o Claude escreveu parte relevante do diff termina com `Co-Authored-By: Claude <noreply@anthropic.com>` (sem nome de modelo); se ele só revisou, explicou ou redigiu a mensagem, sem a linha. No PC, proponha a linha e diga por quê; o Caio decide. PR com commits co-autorados termina a descrição com essa linha. Trabalho relevante do Caio e do Claude vai em PRs separados (mesmo na mesma Issue); PR misto inevitável explica a divisão na descrição. Nenhum PR leva o rodapé "Generated with Claude Code" nem outra atribuição, mesmo que a ferramenta sugira (a label `claude` cumpre o papel).
- **Dados bancários reais nunca vêm para a conversa nem para o app:** bancos, contas e valores do app (dados de exemplo e conexão simulada) são inventados; bancos fictícios não imitam marca de instituição real.
- **Quando o Claude é o agente:** PRs pequenos, um assunto por PR, com as mesmas exigências de teste do código do Caio. Política completa em `docs/arquitetura/uso-de-ia-no-desenvolvimento.md`.
- **Uma sessão por tarefa:** ao mudar de tarefa, depois de um merge ou depois que a conversa for compactada, sugira ao Caio continuar numa sessão nova. Ao encerrar no meio do trabalho, deixe na Issue o que foi feito, o que falta e onde parou. Detalhes em `docs/arquitetura/uso-de-ia-no-desenvolvimento.md`.
- **Subagentes do projeto** (`.claude/agents/`): `revisor-de-regras` uma vez por PR com código, antes de propor o commit; `testador-do-core` quando uma função de `src/core` muda ou para o teste de regressão de um bug; `auditor-de-design` depois de mexer numa tela. Mostre ao Caio o que eles apontaram. Detalhes em `docs/arquitetura/uso-de-ia-no-desenvolvimento.md`.
- Não decida sozinho o que é escolha de produto: pergunte. Ao propor algo que contradiz uma ADR ou o registro de decisões, diga qual e por quê.

## Regras do vault (`docs/`)
- **Links Markdown relativos** (`[ADR 09](../adr/adr-09-....md)`), nunca wikilinks `[[...]]`. Link para a nota inteira, não para seções (Obsidian e GitHub geram âncoras diferentes).
- **Nomes de arquivo** em kebab-case, sem acento nem espaço; o título bonito vai no `#` dentro da nota.
- **Ao mover ou renomear uma nota, atualize todos os links para ela** (procure pelo nome do arquivo em `docs/`). O Obsidian só faz isso sozinho quando a mudança é feita dentro dele.
- Uma ideia por nota; não duplique conteúdo entre notas, linke.
- **Toda decisão nova** entra no topo de `docs/decisoes/registro.md` (data, decisão, motivo, alternativas descartadas) e é aplicada na nota afetada. ADR nova usa `docs/templates/adr.md` e entra na tabela de `docs/inicio.md`.
- Fato novo sobre a Pluggy vai em `docs/pluggy/fatos-verificados.md`, com a fonte.
- Tarefa nova vira Issue do GitHub (não use outra ferramenta de tarefas); o `docs/roadmap/backlog.md` vale só até a migração. Diagramas são em Mermaid dentro das notas, nunca imagem exportada.
- Nunca ponha dados bancários reais no repositório. O repositório é **público** (portfólio).
- Plugin da comunidade do Obsidian que guarde chave de API: `docs/.obsidian/plugins/` entra no `.gitignore` **antes** de qualquer commit.
- O backlog é só de tarefas do projeto; arrumação pessoal do repositório não entra no vault.

## Regras de código do app mobile
Stack e pastas em `docs/mobile/stack.md`. Comandos: `npm start` (Expo Go) e `npm run check` (typecheck + lint + Vitest).
1. **Strict TypeScript:** todo o código fortemente tipado. Evite `any`.
2. **`src/core` é puro:** nada de SQLite, Expo nem React nele. Regras de centavos, datas, orçamento e metas ficam lá, com testes em Vitest.
3. **SQLite só em `src/data`:** telas usam repositórios, nunca escrevem SQL. Esquema muda só por migração versionada (`PRAGMA user_version`).
4. **Valores monetários:** inteiros em centavos (`amountInCents`), circulando como `number`. O campo de valor recebe só dígitos; nunca há decimal, nem na digitação.
5. **Datas:** dia e mês sempre em `America/Sao_Paulo`, mesmo com o aparelho em outro fuso.
6. **Parcelas:** compra em N vezes no cartão grava as N parcelas na hora, cada uma no seu `budget_month` (ADR 11).
7. **Anotações do usuário são sagradas:** a importação simulada nunca sobrescreve categoria manual nem observação, e não duplica (chave `external_id`).
8. **Textos para o usuário em português**, com estado vazio e mensagem de erro em toda tela.
9. **Teste de regressão:** todo bug corrigido em `src/core` vem com um teste no mesmo PR, escrito antes da correção e visto falhando sem ela.

## Regras de código do Centavo completo (referência)
Valem para a API e o web do Centavo, não para este app. Ficam aqui porque o vault as cita.
1. **Strict TypeScript:** todo o código fortemente tipado. Evite `any`.
2. **`@centavo/core` é puro:** nada de `pluggy-sdk`, banco, `process.env` ou segredos nele. Tipos financeiros e DTOs vêm dele; não os reimplemente no back nem no front.
3. **Pluggy e banco só em `apps/api`.**
4. **Valores monetários:** inteiros em centavos (`amountInCents`), circulando como `number`. Converta decimais da Pluggy só na borda, com o sinal derivado do `type` (no cartão a Pluggy manda compras positivas).
5. **Datas:** dia e mês sempre em `America/Sao_Paulo`.
6. **Idempotência:** toda escrita vinda da Pluggy é *upsert* por ID externo; exclusões são **soft delete**. O ID da Pluggy não é identidade permanente: para reconhecer a mesma operação use `provider_id` e, sem ele, a impressão digital.
7. **Item sem sucesso não apaga nada:** resposta vazia de item com consentimento expirado ou em erro nunca gera soft delete.
8. **Anotações do usuário são sagradas:** reconciliação e regras nunca sobrescrevem categoria manual, marcação manual de transferência ou observação; ao recriar uma transação, transfira-as.
9. **Transferências internas** ficam fora de orçamento, relatórios e projeções.
10. **Projeções são calculadas,** nunca gravadas como transações.
11. **Erros:** endpoints HTTP tratam exceções e retornam respostas padronizadas em JSON.
12. **Estilo AdonisJS 7:** Lucid ORM, VineJS para validação, injeção de dependência.
13. **IA só local e só sugere:** Ollama só em `apps/api`, em job assíncrono; dado bancário nunca vai para IA na nuvem; a IA nunca grava categoria sem aceite, nunca faz conta e nunca gera chave. Ver `docs/arquitetura/ia-local.md`.
14. **Teste de regressão:** todo bug corrigido vem com um teste no mesmo PR, escrito antes da correção e visto falhando sem ela. Ver `docs/arquitetura/testes.md`.

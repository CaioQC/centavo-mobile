# Roadmap do app mobile

Prazo: **1 a 2 semanas** a partir de 14/11/2026, até o vídeo e a apresentação da AT2-N2. Substitui o [roadmap do Centavo completo](../roadmap/roadmap.md) no centavo-mobile. As etapas seguem a ordem do [roteiro da demo](telas-e-demo.md): se o prazo apertar, as últimas são as que saem mais simples, não as primeiras.

| Etapa | Status | Entrega |
|---|---|---|
| 0. Fundação | ✅ Concluída | Projeto Expo na raiz, Expo Router com as abas, tema (cores, tipografia, espaçamento), SQLite com a primeira migração e as categorias, `src/core` com centavos e datas e seus testes, `npm run check` e CI no GitHub Actions. Ver [stack](stack.md). |
| 1. Dados e extrato | ✅ Concluída | Dados de exemplo (banco fictício conectado e ~3 meses de transações), extrato com filtros e busca, detalhe com recategorização e observação, novo lançamento (com parcelas no cartão). |
| 2. Início e desbloqueio | ⬜ Não iniciada | Dashboard, contas e contas manuais, desbloqueio por biometria e ajustes. |
| 3. Orçamento | ⬜ Não iniciada | Limites por categoria e mês, cópia do mês anterior, "já comprometido" ([orçamento do mês](../fluxos/orcamento-do-mes.md)). |
| 4. Metas | ⬜ Não iniciada | Metas, aportes e retiradas. |
| 5. Conexão simulada | ⬜ Não iniciada | Catálogo de bancos fictícios, consentimento, importação sem duplicar e sem sobrescrever o que o usuário mudou. |
| 6. Polimento e vídeo | ⬜ Não iniciada | Ícone, splash, estados vazios, revisão de UX no aparelho, gravação do vídeo de ~30 s e ensaio da apresentação. |

Status: ⬜ não iniciada · 🟨 em andamento · ✅ concluída. Cada etapa vira uma Milestone no GitHub do centavo-mobile, com uma Issue por entrega ([fluxo de git do app](fluxo-de-git.md)).

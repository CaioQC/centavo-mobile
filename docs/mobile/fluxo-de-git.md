# Fluxo de git do app mobile

No centavo-mobile **não** vale o fluxo `develop` → `homolog` → `main` de [ambientes, branches e releases](../arquitetura/ambientes-e-branches.md): não há produção nem instância de homologação. O resto das [convenções de branch, commit e PR](../arquitetura/convencoes-de-git.md) continua, com as diferenças abaixo.

## Branches
- **`main`** é a branch padrão e só recebe PR, com **squash**.
- Trabalho em `tipo/N-descricao`, criada a partir da `main` e de volta para ela (ex.: `feat/3-extrato-com-filtros`).
- Não há `develop`, `homolog`, `hotfix/` nem PRs de promoção.

## Escopos dos commits
Os escopos `api`, `web` e `infra` dão lugar a:

| Escopo | Parte |
|---|---|
| `app` | telas, navegação e componentes (`src/app`, `src/features`, `src/shared`) |
| `core` | regras puras (`src/core`) |
| `data` | SQLite, migrações, dados de exemplo e bancos simulados (`src/data`) |

Exemplos: `feat(app): adiciona tela de orçamento`, `fix(core): corrige mês da parcela em dezembro`, `docs: descreve roteiro da demo`.

## Tarefas
Etapas do [roadmap do app](roadmap.md) viram Milestones; entregas viram Issues. Sem `fase-N.md`: o prazo é curto e os critérios cabem na própria Issue.

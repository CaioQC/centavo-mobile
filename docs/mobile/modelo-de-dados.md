# Modelo de dados do app mobile

Versão reduzida do [modelo de dados do Centavo](../dominio/modelo-de-dados.md), em SQLite no aparelho ([ADR 05](../adr/adr-05-offline-first-mobile.md)). Nomes de tabela e campo iguais aos do Centavo sempre que o conceito é o mesmo.

- **IDs:** UUID em `TEXT`.
- **Valores:** `INTEGER` em centavos ([ADR 01](../adr/adr-01-valores-em-centavos.md)). O SQLite guarda inteiros de 64 bits, e o `expo-sqlite` os devolve como `number`.
- **Datas:** `TEXT` no formato `YYYY-MM-DD`, já em `America/Sao_Paulo` ([ADR 10](../adr/adr-10-datas-e-fuso-horario.md)). Meses em `YYYY-MM`. Timestamps em ISO 8601.
- **Sem `users`:** um único usuário, e não há login ([escopo](escopo.md)).

```text
[Connection] 1 ─── N [Account] 1 ─── N [Transaction] N ─── 1 [Category]
[Category] 1 ─── N [Budget]
[Goal] 1 ─── N [GoalContribution]
```

## `connections` (bancos conectados pela simulação)
- `id`: TEXT (PK)
- `institution_key`: TEXT (identifica o banco fictício no catálogo de `src/data`)
- `institution_name`: TEXT
- `connected_at` / `last_synced_at`: TEXT (timestamp)

## `accounts`
- `id`: TEXT (PK)
- `connection_id`: TEXT (FK -> connections.id, nulável para contas manuais)
- `source`: TEXT (`SIMULATED`, `MANUAL`)
- `external_id`: TEXT (nulável; ID da conta no banco fictício, único por conexão)
- `name`: TEXT
- `type`: TEXT (`BANK`, `CREDIT_CARD`, `CASH`)
- `initial_balance_in_cents`: INTEGER (saldo antes da primeira transação conhecida)
- `credit_limit_in_cents`: INTEGER (nulável; só cartão)
- `archived_at`: TEXT (nulável)

**Saldo** = `initial_balance_in_cents` + soma de `amount_in_cents` das transações da conta. É calculado, não gravado. No cartão, o resultado negativo é o saldo devedor.

## `transactions`
- `id`: TEXT (PK)
- `account_id`: TEXT (FK -> accounts.id)
- `source`: TEXT (`SIMULATED`, `MANUAL`)
- `external_id`: TEXT (nulável; ID no banco fictício, único por conta, para a importação não duplicar)
- `description`: TEXT
- `amount_in_cents`: INTEGER (positivo para receitas e estornos, negativo para despesas)
- `date`: TEXT (`YYYY-MM-DD`)
- `budget_month`: TEXT (`YYYY-MM`; [ADR 11](../adr/adr-11-orcamento-cartao-parcelado.md))
- `category_id`: TEXT (FK -> categories.id, nulável)
- `category_source`: TEXT (`IMPORT`, `MANUAL`; [ADR 07](../adr/adr-07-categorizacao-em-camadas.md))
- `installment_group_id`: TEXT (nulável; liga as parcelas de uma compra lançada no app)
- `installment_number` / `total_installments`: INTEGER (nuláveis)
- `note`: TEXT (nulável)
- `created_at`: TEXT (timestamp)

Índices em (`budget_month`, `category_id`), (`account_id`, `date`) e único em (`account_id`, `external_id`).

## `categories`
- `id`: TEXT (PK)
- `name`: TEXT
- `kind`: TEXT (`EXPENSE`, `INCOME`)
- `icon`: TEXT
- `color`: TEXT

Lista fixa e enxuta, criada na primeira migração (ex.: Moradia, Alimentação, Transporte, Saúde, Lazer, Compras, Assinaturas, Educação, Outros; Salário, Outras receitas).

## `budgets`
- `id`: TEXT (PK)
- `month`: TEXT (`YYYY-MM`)
- `category_id`: TEXT (FK -> categories.id)
- `limit_in_cents`: INTEGER
- Único em (`month`, `category_id`)

## `goals`
- `id`: TEXT (PK)
- `name`: TEXT
- `target_in_cents`: INTEGER
- `target_date`: TEXT (nulável)
- `icon` / `color`: TEXT
- `created_at`: TEXT (timestamp)
- `archived_at`: TEXT (nulável)

## `goal_contributions`
- `id`: TEXT (PK)
- `goal_id`: TEXT (FK -> goals.id)
- `amount_in_cents`: INTEGER (negativo para retirada)
- `date`: TEXT (`YYYY-MM-DD`)

**Progresso** = soma dos aportes ÷ `target_in_cents`. Aportes não movimentam as contas: a meta é um acompanhamento à parte.

## `settings`
- `key`: TEXT (PK) — ex.: `biometric_lock_enabled`, `sample_data_version`
- `value`: TEXT

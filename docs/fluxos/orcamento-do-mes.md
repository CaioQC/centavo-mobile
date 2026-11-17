# Orçamento do mês

Para cada categoria do mês *M*:

- **Gasto** = soma de `amount_in_cents` das transações com `budget_month = M`, sem `deleted_at` e sem `is_internal_transfer`.
- **Já comprometido** (exibido à parte) = parcelas futuras projetadas que caem em *M* ([ADR 11](../adr/adr-11-orcamento-cartao-parcelado.md)).
- **Limite** = `budgets.limit_in_cents` de *M*. Ao abrir um mês novo, os limites do mês anterior são copiados ([decisões de produto](../produto/decisoes-de-produto.md)).

Estornos (valores positivos numa categoria de despesa) abatem o gasto. Transações com `budget_month_estimated = true` aparecem como valor aproximado.

## No app mobile
O app não projeta parcelas: grava as N de uma vez, cada uma com o seu `budget_month`. **Já comprometido** em *M* = parcelas (a partir da 2ª) de *M* cuja `date` ainda é futura; elas não entram no **gasto** até a data chegar. Decisão em [registro de decisões](../decisoes/registro.md).

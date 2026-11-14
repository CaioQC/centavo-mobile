# Escopo do app mobile

O que o app da disciplina faz, o que fica de fora e quais regras do Centavo completo ele segue. O porquê está no [registro de decisões](../decisoes/registro.md); a visão está em [visão do app mobile](visao.md).

## Entra
| Funcionalidade | Resumo |
|---|---|
| **Desbloqueio por biometria** | Digital ou rosto ao abrir o app, com o PIN do aparelho como alternativa. Sem cadastro nem login: um único usuário, como no Centavo. Pode ser desligado nos ajustes. |
| **Início (dashboard)** | Saldo somado das contas, gasto do mês contra o orçamento, categorias que mais gastaram e últimas transações. |
| **Extrato** | Todas as contas numa lista só, por dia, com filtro por mês, conta e categoria e busca pela descrição. |
| **Recategorização e observação** | O usuário troca a categoria de qualquer transação e escreve uma observação. |
| **Lançamentos manuais** | Receita ou despesa em qualquer conta; no cartão, a compra pode ser parcelada em N vezes. |
| **Contas manuais** | Dinheiro em espécie ou conta fora da conexão simulada, com saldo inicial. |
| **Orçamento por categoria** | Limite por categoria e mês, barra de gasto contra limite, "já comprometido" das parcelas e cópia dos limites do mês anterior ao abrir um mês novo ([orçamento do mês](../fluxos/orcamento-do-mes.md)). |
| **Metas de economia** | Meta com valor-alvo e data opcional; o progresso vem de **aportes manuais**. |
| **Conexão bancária simulada** | O usuário escolhe um banco fictício, passa por uma tela de consentimento marcada como simulação e o app importa contas e transações fictícias. |
| **Tema claro e escuro** | Segue o tema do sistema; em Ajustes dá para fixar Claro ou Escuro ([design](design.md)). |
| **Dados de exemplo** | O app já abre com um banco fictício conectado e cerca de três meses de transações, para a demo ter o que mostrar. Nos ajustes dá para restaurar esses dados. |

## Fica de fora
| Do Centavo completo | Por quê |
|---|---|
| Pluggy real, Meu Pluggy, webhook, reconciliação, filas | Exigem back-end (o *client secret* não pode ficar no app) e trariam dado bancário real para uma apresentação em sala. |
| Back-end AdonisJS, PostgreSQL, Redis, Docker | Sem back-end: os dados ficam no aparelho ([ADR 05](../adr/adr-05-offline-first-mobile.md)). |
| Login com senha e 2FA TOTP | Substituídos pelo desbloqueio por biometria do aparelho. |
| Projeção de fatura, faturas, assinaturas | Fora do prazo de 1 a 2 semanas. O cartão aparece como conta, com o gasto do mês. |
| Regras de categorização e IA local | Só a categoria da importação e a manual. |
| Transferências internas ([ADR 08](../adr/adr-08-transferencias-internas.md)) | Os dados fictícios não têm transferências entre contas nem pagamento de fatura, então nada conta duas vezes. Lançamento de transferência não existe. |
| Metas vinculadas a conta ou investimento, investimentos | Só aportes manuais. |
| Imposto de Renda, backup, homologação | Pós-MVP no Centavo completo; não fazem sentido aqui. |

## Regras do Centavo que continuam valendo
- **Centavos** ([ADR 01](../adr/adr-01-valores-em-centavos.md)): todo valor é inteiro em centavos. O campo de valor recebe só dígitos ("4990" vira R$ 49,90), então nunca há número decimal, nem na digitação.
- **Datas em `America/Sao_Paulo`** ([ADR 10](../adr/adr-10-datas-e-fuso-horario.md)), mesmo com o aparelho em outro fuso.
- **Cartão parcelado no orçamento** ([ADR 11](../adr/adr-11-orcamento-cartao-parcelado.md)): uma compra em N vezes conta uma parcela por mês, a partir do mês da compra. O app grava as N parcelas já na hora do lançamento (como os bancos que lançam todas de uma vez); as dos meses seguintes aparecem como "já comprometido" no orçamento de cada mês.
- **Categoria manual vence** ([ADR 07](../adr/adr-07-categorizacao-em-camadas.md)): uma nova importação simulada nunca sobrescreve categoria nem observação que o usuário mudou.
- **O que veio do banco não se apaga:** transação importada não pode ser excluída pelo usuário (só recategorizada e anotada). Lançamento manual pode ser excluído; numa compra parcelada, a exclusão leva todas as parcelas. Por isso o app não precisa de *soft delete*.

## Sem dado real
Bancos, pessoas e valores são fictícios. Os bancos simulados têm nomes inventados e não imitam a marca de nenhuma instituição real.

Veja também: [design](design.md), [telas e roteiro da demo](telas-e-demo.md), [modelo de dados do app](modelo-de-dados.md).

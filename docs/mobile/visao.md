# Visão do app mobile (disciplina)

## De onde vem
O **centavo-mobile** é uma versão reduzida do Centavo, feita como app React Native para a atividade **AT2-N2 de Programação de App** (UCB). O resto deste vault é a especificação do Centavo completo (API + web com Pluggy) e continua valendo para ele. As notas desta pasta dizem o que o app mobile pega dessa especificação, o que deixa de fora e o que muda. O porquê está no [registro de decisões](../decisoes/registro.md).

## Problema
Quem tem conta em mais de um banco e usa cartão de crédito não sabe, no meio do mês, quanto ainda pode gastar:
- o dinheiro fica espalhado em vários apps de banco, e nenhum mostra o todo;
- compras parceladas comprometem os meses seguintes sem que a pessoa perceba;
- guardar dinheiro para um objetivo fica sem acompanhamento.

## Proposta
Um app que junta as contas num lugar só e responde três perguntas:
1. **Para onde foi o meu dinheiro este mês?** Extrato único com categorias.
2. **Quanto ainda posso gastar em cada categoria?** Orçamento do mês, contando as parcelas do cartão no mês em que caem ([ADR 11](../adr/adr-11-orcamento-cartao-parcelado.md)).
3. **Quanto falta para a minha meta?** Metas de economia com aportes.

A conexão com os bancos é **simulada**, com bancos e dados fictícios, para mostrar a ideia de Open Finance sem dado bancário real ([escopo](escopo.md)).

## Como a atividade é avaliada
| Critério | Como o app responde |
|---|---|
| Resolução de um problema real | As três perguntas acima, mostradas logo no começo do vídeo. |
| UI/UX | Poucas telas, bem acabadas, navegação por abas ([telas e roteiro da demo](telas-e-demo.md)). |
| Funcionamento | Tudo o que aparece no vídeo funciona de verdade, com os dados gravados no aparelho ([ADR 05](../adr/adr-05-offline-first-mobile.md)). |

**Entrega:** vídeo de cerca de 30 segundos no AVA e apresentação em sala. O código-fonte não é entregue; o repositório é público como portfólio.

Veja também: [escopo](escopo.md), [roadmap do app](roadmap.md).

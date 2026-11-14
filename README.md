# 🪙 Centavo Mobile

App mobile de finanças pessoais, versão reduzida do [Centavo](https://github.com/CaioQC/Centavo), feito em React Native para a disciplina de Programação de App (UCB). Junta as contas num lugar só e responde três perguntas: **para onde foi o meu dinheiro, quanto ainda posso gastar em cada categoria e quanto falta para a minha meta.**

**Status:** em desenvolvimento. Especificação pronta em `docs/mobile/`; nenhum código ainda.

**Funcionalidades:** desbloqueio por biometria · dashboard · extrato com categorias · lançamentos manuais com parcelas no cartão · orçamento por categoria · metas de economia · conexão bancária simulada (Open Finance com bancos e dados fictícios).

**Stack:** Expo + React Native + TypeScript · Expo Router · SQLite no aparelho (`expo-sqlite`) · Vitest.

> Todos os bancos, contas e valores do app são fictícios. Nenhum dado bancário real é usado.

## Documentação
A especificação é um vault do [Obsidian](https://obsidian.md) em [`docs/`](docs/inicio.md). O que vale para o app mobile está em [`docs/mobile/`](docs/mobile/visao.md); o resto do vault descreve o Centavo completo (API + web com a Pluggy), de onde este app foi derivado.

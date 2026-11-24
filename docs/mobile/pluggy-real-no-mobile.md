# Pluggy real no app mobile (mapeado, não implementado)

**Status:** mapeado em 23/11/2026; **fora do escopo** da AT2-N2. O app segue com a [conexão simulada](escopo.md). Esta nota guarda o que a integração real exigiria, para retomar depois da entrega sem refazer a conversa. O porquê de ficar de fora está no [registro de decisões](../decisoes/registro.md).

## Por que não entrou
- **Exige servidor.** O *client secret* da Pluggy não pode ir para o app nem para o repositório (público); o app não tem back-end ([ADR 05](../adr/adr-05-offline-first-mobile.md)).
- **Traria dado bancário real** para um app de vídeo e apresentação, contra a regra de que dados reais nunca entram no app.
- **Risco na demo:** passaria a depender de internet, de serviço externo e de token.

## O que a integração exigiria
1. **Um servidor** (no Centavo completo seria a `apps/api`, que já planeja o [Pluggy Connect](../fluxos/conexao-meu-pluggy.md)) com dois passos do lado dele:
   - autenticar: `POST https://api.pluggy.ai/auth` com `clientId` e `clientSecret`, que devolve uma API key;
   - criar o *connect token*: `POST https://api.pluggy.ai/connect_token`, com o cabeçalho `X-API-KEY` e `{"options":{"clientUserId":"..."}}`.
2. **Credenciais só em variáveis de ambiente do servidor** (por exemplo `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`), nunca no app, no repositório ou na conversa.
3. **No app:** chamar o servidor para obter o *connect token*, abrir o widget Pluggy Connect e receber o `itemId`. O exemplo da Pluggy é para **navegador** (`<script src="https://cdn.pluggy.ai/connect/v2/pluggy-connect.js">` e `new window.PluggyConnect({ connectToken, includeSandbox: true, onSuccess, onError })`, com `onSuccess` devolvendo `itemData.item.id`); isso não roda direto no React Native. No app seria uma WebView ou um pacote próprio para React Native, o que pode exigir *development build* ou APK em vez do Expo Go. Confirmar na [documentação do Pluggy Connect](https://docs.pluggy.ai/docs/pluggy-connect). `includeSandbox: true` é a opção do exemplo para listar também os conectores de teste.
4. **Webhook (opcional, no servidor):** um endpoint público que recebe `item/created`, `item/updated` e `item/error` e **responde 2XX em até 5 segundos**, deixando o trabalho pesado para uma fila. Os fatos já verificados valem ([entrega com 3 tentativas e sem HMAC](../pluggy/fatos-verificados.md), [ADR 03](../adr/adr-03-reconciliacao-periodica.md) e [ADR 06](../adr/adr-06-seguranca-webhook-e-tunel.md)); o exemplo colado era de Next.js/Express e só serve como forma do endpoint. Sem servidor público, o app mobile não recebe webhook: teria de consultar o item.
5. **Importação real:** do `itemId` em diante vale o [pipeline](../fluxos/pipeline-de-transacao.md) e a [reconciliação](../fluxos/reconciliacao.md): upsert por ID externo, IDs que mudam (`provider_id` e impressão digital, [ADR 09](../adr/adr-09-anotacoes-sobrevivem-troca-de-id.md)), item sem sucesso sem apagar nada e anotações do usuário preservadas. Hoje o app só tem a versão simulada e determinística disso.
6. **Rede e erros:** estados de carregamento e de falha para token, widget e sincronização, mais o que fazer offline (o SQLite continua sendo a fonte da verdade).

## Cuidados
- Os trechos de código (os dois `POST`, o widget de navegador e o webhook) vieram colados pelo Caio e **ainda não foram conferidos** na documentação da Pluggy; eles não entraram em [fatos verificados](../pluggy/fatos-verificados.md). A conferência é uma [pendência](../pluggy/pendencias.md).
- Dado real, ou do sandbox, nunca vai para o git nem para a conversa; fixtures são anonimizadas ([testes](../arquitetura/testes.md)).

## Como retomar
Depois da entrega, como etapa nova: Issue e Milestone próprias, servidor primeiro (de preferência o do Centavo completo), app depois. Não fazer de última hora antes da apresentação.

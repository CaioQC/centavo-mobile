# Ensaio, vídeo e apresentação

Roteiro prático para gravar o vídeo de ~30 s e apresentar o app em sala. As cenas e o que cada uma prova vêm do [roteiro da demo](telas-e-demo.md); aqui estão os toques, a fala e o plano B. O app roda no celular como **APK** (gerado pelo EAS Build, ver abaixo) ou, para desenvolver, no Expo Go. A conferência final é do Caio.

## Gerar e instalar o APK
O APK é o app de verdade, sem Expo Go: funciona sem Wi-Fi nem PC e mostra o ícone e a splash do Centavo.

1. No terminal do projeto (PowerShell; use `npx.cmd`, porque `npx` é bloqueado pela política de scripts do Windows): `npx.cmd eas-cli login`, só na primeira vez.
2. `npx.cmd eas-cli build -p android --profile preview` (o perfil está no `eas.json`). Responda **n** à pergunta "Install and run the Android build on an emulator?".
3. O build roda na nuvem (10 a 30 min). Acompanhe em **expo.dev**, projeto **centavo-mobile**, aba **Builds**. Quando o status for **Finished**, abra a página no celular e baixe o `.apk`.
4. Instale (o Android pede para liberar "instalar de fontes desconhecidas" na primeira vez). Uma correção de código só chega ao celular com um **build novo**.

## Antes de gravar
1. **Estado limpo.** "Restaurar dados de exemplo" só **recoloca o que faltar**: não desconecta banco, não apaga lançamento, não desfaz categoria trocada nem aporte. Para repetir a demo do zero, **limpe os dados do app** (Android: Configurações → Apps → Centavo → Armazenamento → Limpar dados) e abra de novo; os dados de exemplo voltam sozinhos na primeira abertura, com a data do dia como referência.
2. **Limpe no dia da gravação e no da aula.** As datas dos dados de exemplo ficam ancoradas no dia da primeira abertura; instalar muito antes pode deixar o mês atual vazio. Depois de limpar, só abra o app: não percorra o roteiro antes de gravar.
3. Aparelho Android com digital, PIN, padrão ou senha cadastrada. A limpeza também apaga o ajuste do desbloqueio, que volta **ligado**.
4. Tema **Claro** (Ajustes → Tema), brilho alto, notificações desligadas (modo Não perturbe), bateria acima de 30 %.
5. Gravação de tela do próprio celular, na vertical. Ensaie 2 ou 3 vezes antes, limpando os dados entre as tentativas.

*Expo Go, só para desenvolver:* `npm.cmd start` e escaneie o QR code (celular e PC na mesma rede Wi-Fi). Ele mostra o próprio ícone e a própria splash, e o Face ID não funciona nele no iOS.

## Cena a cena
| Tempo | Toques | Fala sugerida |
|---|---|---|
| 0–3 s | Abrir o app → digital. | "O Centavo abre só com a minha digital." |
| 3–8 s | Início: mostrar o saldo e o gasto do mês (anel). | "Em um lugar só: o saldo de todas as contas e quanto já gastei no mês." |
| 8–13 s | **Contas e conexões** → **Conectar banco** → **Pitanga** → **Autorizar e conectar** → ao terminar, **Ver extrato**. | "Conecto um banco, de mentira por enquanto, e as transações dele já aparecem no extrato." |
| 13–17 s | No extrato, tocar numa transação → **Categoria** → escolher outra. | "E eu mando em como cada gasto é classificado." |
| 17–24 s | **+** → valor `30000` → descrição → conta **Cartão Pitanga** → categoria **Compras** → **Parcelas: 3x** → **Salvar lançamento**. Ir para **Orçamento** e tocar em **Próximo mês**. | "Uma compra de R$ 300 em 3x: R$ 100 conta neste mês e R$ 100 já aparece como comprometido no próximo." |
| 24–30 s | **Metas** → abrir uma meta → **Novo aporte** → valor → **Registrar aporte**; a barra avança. | "E cada aporte aproxima uma meta." |

Dicas: o campo de valor recebe só dígitos (`30000` vira R$ 300,00). Antes de gravar, confira que **Compras** tem limite no orçamento do mês, para a barra aparecer. O "Já comprometido" aparece no **mês seguinte** (a parcela 1 é do mês da compra, as outras caem nos meses depois). Corte e acelere no editor se passar de 30 s.

## Fala para a sala (3 a 4 minutos)
1. **Problema:** "Quem usa vários bancos e cartões não vê o dinheiro todo de uma vez, perde o controle das parcelas e não consegue guardar para um objetivo."
2. **Demo:** as seis cenas acima, em ritmo normal, com o que cada uma resolve.
3. **Por trás:** "Os dados ficam em um SQLite no aparelho, sem servidor. Valores são inteiros em centavos, as datas seguem o fuso de São Paulo, as regras ficam em funções puras testadas e a conexão bancária é simulada, com bancos e dados inventados." (O detalhe das decisões está em [stack](stack.md) e no [registro de decisões](../decisoes/registro.md).)
4. **Limites:** "Fora do escopo desta versão: Pluggy real, projeção de fatura, assinaturas e IA. Existem no Centavo completo."

## Plano B
| Se… | Faça |
|---|---|
| A digital falhar | O app aceita o PIN do aparelho. Se travar de vez, desligue o bloqueio no celular de teste antes de gravar (Ajustes → Desbloqueio por biometria). |
| O APK não instala | Libere "instalar de fontes desconhecidas" para o navegador ou o gerenciador de arquivos usado. Se o build falhou, abra o log na página do build e corrija; como reserva, use o Expo Go com `npm.cmd start`. |
| Banco Pitanga já conectado | Use **Caju** ou **Sincronizar de novo** (não duplica). Para a demo inédita, limpe os dados do app ("Antes de gravar", passo 1). |
| Cartão sem parcela | A opção Parcelas só aparece com uma conta de **cartão** e tipo **despesa**. Troque a conta. |
| Algo quebrar ao vivo | Mostre o vídeo gravado e comente as telas. Mantenha o arquivo no celular e no PC. |

## Conferir no aparelho
Marque cada item no celular, nos dois temas (Ajustes → Tema) e, se der, em outro tamanho de tela:

- [ ] Abre, pede a digital, desbloqueia; ao ir para o segundo plano e voltar, pede de novo.
- [ ] Início mostra saldo, anel, três categorias e últimas transações; os atalhos abrem Contas e Ajustes.
- [ ] Conectar Pitanga: consentimento, "Sincronizando…", resumo com contas e transações novas; **Sincronizar de novo** importa 0 novas.
- [ ] As transações do banco aparecem no extrato; trocar a categoria de uma e conferir que continua trocada depois de sincronizar de novo.
- [ ] Lançamento de R$ 300 em 3x no cartão: três parcelas no extrato (1/3, 2/3, 3/3); orçamento do mês com R$ 100 e o próximo mês com "Já comprometido R$ 100".
- [ ] Aporte numa meta: a barra e o "falta" atualizam; retirar volta o valor.
- [ ] Nenhum texto cortado, botão menor que o dedo ou barra de abas cobrindo conteúdo; lista longa rola até o fim.
- [ ] Teclado não cobre o botão de salvar nos formulários.
- [ ] Leitor de tela (TalkBack): botões só com ícone têm nome e os títulos são anunciados como cabeçalhos.
- [ ] Sem erro vermelho nem aviso amarelo durante o roteiro inteiro.

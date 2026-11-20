# Ensaio, vídeo e apresentação

Roteiro prático para gravar o vídeo de ~30 s e apresentar o app em sala. As cenas e o que cada uma prova vêm do [roteiro da demo](telas-e-demo.md); aqui estão os toques, a fala e o plano B. O app **só roda no aparelho** (Expo Go): a conferência final é do Caio.

## Antes de gravar
1. No PC: `npm.cmd start` (abre o Expo Go; o celular precisa estar na mesma rede Wi-Fi do PC). Escaneie o QR code com o Expo Go.
2. **Estado limpo.** "Restaurar dados de exemplo" só **recoloca o que faltar**: não desconecta banco, não apaga lançamento e não desfaz categoria trocada. Para repetir a demo do zero, apague os dados do Expo Go (Android: Configurações → Apps → Expo Go → Armazenamento → Limpar dados) e abra o projeto de novo; os dados de exemplo voltam sozinhos na primeira abertura.
3. Aparelho Android com digital (ou PIN) cadastrada. No iOS o Face ID não funciona no Expo Go; ele cai no PIN do aparelho.
4. Tema **Claro** (Ajustes → Tema), brilho alto, notificações desligadas (modo Não perturbe), bateria acima de 30 %.
5. O Expo Go mostra o próprio ícone e a própria splash; o ícone e a splash do Centavo só aparecem num *development build* ou APK. Não filme a tela inicial do celular.
6. Gravação de tela do próprio celular, na vertical. Ensaie 2 ou 3 vezes antes (passos 1 a 2 entre as tentativas).

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
| Expo Go não conectar | Tente `npm.cmd start` com `--tunnel` (precisa do pacote `@expo/ngrok`) ou use o hotspot do celular. Último recurso: gravar o vídeo no emulador Android. |
| Banco Pitanga já conectado | Use **Caju** ou **Sincronizar de novo** (não duplica). Para a demo inédita, limpe os dados (passo 2 acima). |
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
- [ ] Listas vazias mostram a mensagem e a ação (use um banco de dados limpo e navegue sem os dados de exemplo).
- [ ] Teclado não cobre o botão de salvar nos formulários.
- [ ] Leitor de tela (TalkBack): botões só com ícone têm nome e os títulos são anunciados como cabeçalhos.
- [ ] Sem erro vermelho nem aviso amarelo durante o roteiro inteiro.

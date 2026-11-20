# Design do app mobile

Identidade visual do app mobile: direção **Caderneta**, com tema claro e escuro. O porquê está no [registro de decisões](../decisoes/registro.md); as telas estão em [telas e roteiro da demo](telas-e-demo.md).

**Protótipo:** [canvas "Centavo Mobile — Design"](https://claude.ai/artifact/FdhSqcD7SbSyxLPfAnCx5n) no claude.ai (privado; compartilhar pelo menu Share antes de mostrar a alguém), com as seis telas do [roteiro da demo](telas-e-demo.md) (desbloqueio, Início, Extrato, novo lançamento, Orçamento e Metas) nos dois temas, navegáveis no modo Play. A direção A (Cofre, escura e sóbria) ficou no canvas só como alternativa descartada. Ajustes finos de design ficam para os testes no celular.

## Tema
- **Segue o sistema** (`useColorScheme` do React Native). Em Ajustes, o usuário pode fixar **Sistema**, **Claro** ou **Escuro**; a escolha fica na tabela `settings` (chave `theme`).
- Toda cor vem de um conjunto de *tokens* com uma versão clara e uma escura em `src/shared`; nenhuma tela usa cor solta.

## Tipografia
**Plus Jakarta Sans** (pesos 400 a 800), carregada com `@expo-google-fonts/plus-jakarta-sans`. Valores monetários com algarismos tabulares (`fontVariant: ['tabular-nums']`), para os números não "dançarem" nas listas.

## Tokens
| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `bg` | `#F3F5F9` | `#0F1218` | fundo das telas |
| `card` | `#FFFFFF` | `#1A1F29` | cartões, barra de abas |
| `text` | `#151A24` | `#EEF1F6` | texto principal |
| `muted` | `#5B6474` | `#A3ACBB` | texto secundário |
| `track` | `#E9EDF3` | `#2A3140` | fundo das barras de progresso |
| `accent` | `#2F54EB` | `#2F54EB` | cartão do saldo, botão "+", barra do orçamento |
| `accentText` | `#2F54EB` | accent 45% mais claro | links e aba ativa (legível no escuro) |
| `warn` | `#A15C07` | `#FBBF24` | "Atenção" (a partir de 80% do limite) |
| `over` | `#C2410C` | `#FB923C` | "Estourou" (acima de 100%) |
| `income` | `#15803D` | `#86EFAC` | valor de receita |
| `shadow` | `#0F1218` | `#000000` | sombra da barra de abas flutuante |

No escuro, a sombra dos cartões vira um contorno de 1 px (`#232A36`).

## Categorias
Cada categoria tem uma cor: no claro, ícone na cor forte sobre fundo pastel; no escuro, ícone na cor clara sobre a mesma cor translúcida.

| Categoria | Claro (fundo / ícone) | Escuro (ícone) |
|---|---|---|
| Moradia | `#E0E7FF` / `#4338CA` | `#A5B4FC` |
| Alimentação | `#FFEDD5` / `#C2410C` | `#FDBA74` |
| Transporte | `#CCFBF1` / `#0F766E` | `#5EEAD4` |
| Lazer | `#FCE7F3` / `#BE185D` | `#F9A8D4` |
| Assinaturas | `#EDE9FE` / `#6D28D9` | `#C4B5FD` |
| Saúde | `#DCFCE7` / `#15803D` | `#86EFAC` |
| Compras | `#FEF3C7` / `#A15C07` | `#FCD34D` |
| Educação | `#E0F2FE` / `#0369A1` | `#7DD3FC` |

## Regras
- **Estado nunca só por cor:** "Atenção · 82%" e "Estourou" aparecem em texto ao lado da barra.
- **Contraste** mínimo de 4,5:1 para texto, nos dois temas.
- **Área de toque** mínima de 44 × 44 px.
- **Formas:** cartões com raio 18–24, ícones de categoria em quadrados de raio 11–13, barra de abas flutuante com o botão "+" no centro.
- **Sem emoji** na interface; ícones em traço (estilo Lucide).

## Ícone e splash
Marca própria, sem imitar instituição real: um **"C" branco** (a moeda do centavo) sobre o azul `accent`. Ícone, ícone adaptativo do Android (primeiro plano; fundo `#2F54EB`), splash (o mesmo quadrado arredondado da tela de desbloqueio, sobre `bg` claro `#F3F5F9` ou escuro `#0F1218`) e favicon ficam em `assets/` e são gerados por `npm run assets` ([scripts/generate-assets.mjs](../../scripts/generate-assets.mjs)), sem editor de imagem. As cores do `app.json` repetem os tokens porque a configuração nativa não lê `src/shared`. **O Expo Go mostra o próprio ícone e a própria splash:** a identidade só aparece num *development build* ou num APK.

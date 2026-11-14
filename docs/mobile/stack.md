# Stack do app mobile

Substitui a [stack do Centavo completo](../arquitetura/stack.md) no centavo-mobile. Sem back-end: tudo roda no aparelho ([ADR 05](../adr/adr-05-offline-first-mobile.md)).

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **App** | Expo SDK 57 + React Native + TypeScript (strict) | Pedido da disciplina (React Native); mesma base já usada pelo Caio no Garago. Roda no Expo Go para a demo. |
| **Navegação** | Expo Router (rotas por arquivo, abas) | Padrão do Expo; abas para as quatro áreas principais ([telas](telas-e-demo.md)). |
| **Dados** | `expo-sqlite` com SQL direto e migrações versionadas por `PRAGMA user_version` | Banco relacional no aparelho, com as mesmas tabelas simplificadas do Centavo ([modelo de dados do app](modelo-de-dados.md)). Sem ORM: poucas tabelas e consultas simples. |
| **Biometria** | `expo-local-authentication` | Digital ou rosto com o PIN do aparelho como alternativa. No iOS, o Face ID não funciona no Expo Go (precisa de *development build*); no Android, a digital funciona no Expo Go. |
| **IDs** | `expo-crypto` (`randomUUID`) | UUID como no Centavo completo. |
| **Tipografia** | Plus Jakarta Sans via `@expo-google-fonts/plus-jakarta-sans` | Fonte da identidade Caderneta ([design](design.md)). |
| **Ícones** | `lucide-react-native` | Ícones em traço, sobre o `react-native-svg`; funciona no Expo Go. |
| **Tema** | `useColorScheme` do React Native + *tokens* em `src/shared` | Claro e escuro seguindo o sistema, com opção de fixar em Ajustes ([design](design.md)). |
| **Gráficos** | `react-native-svg` | Anel e barras simples do dashboard e do orçamento, sem biblioteca de gráficos pesada. Funciona no Expo Go. |
| **Formatação** | `Intl.NumberFormat` (`pt-BR`, `BRL`) e `Intl.DateTimeFormat` com `timeZone: 'America/Sao_Paulo'` | Moeda e datas sem biblioteca extra ([ADR 10](../adr/adr-10-datas-e-fuso-horario.md)). |
| **Testes** | Vitest nas regras puras de `src/core` | Centavos, mês do orçamento, orçamento do mês e progresso de meta são funções puras, fáceis de testar. Telas são conferidas no aparelho. |
| **Qualidade** | ESLint (config do Expo) + `tsc --noEmit` | `npm run check` roda typecheck, lint e testes, como no Garago. |

## Estrutura de pastas
O app fica na raiz do repositório, ao lado de `docs/`. Não há monorepo: sem API, não há o que compartilhar.

```text
src/app/        rotas do Expo Router (telas)
src/core/       regras puras: centavos, datas, orçamento, metas (+ testes)
src/data/       SQLite: migrações, repositórios, dados de exemplo e bancos simulados
src/features/   componentes de cada funcionalidade (extrato, orçamento, metas, conexões)
src/shared/     tema (tokens claro e escuro, tipografia, espaçamento) e componentes base
```

`src/core` segue a regra do `@centavo/core`: **é puro**, sem SQLite, sem Expo e sem React. Se um dia o app mobile entrar no monorepo do Centavo completo, essas funções migram para o `@centavo/core`.

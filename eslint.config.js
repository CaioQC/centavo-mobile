const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', '.expo/*'] },
  {
    // src/core é puro: nada de React, Expo, SQLite nem módulos do app.
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'react-native-*', 'expo', 'expo-*', '@/*', '**/data/*', '**/shared/*', '**/features/*', '**/app/*'],
              message: 'src/core é puro: não importe React, Expo, SQLite nem outras camadas do app.',
            },
          ],
        },
      ],
    },
  },
  {
    // Só src/data conhece o SQLite; telas e features usam repositórios.
    files: ['src/app/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'expo-sqlite', message: 'SQLite só em src/data; telas usam repositórios.' }],
        },
      ],
    },
  },
]);

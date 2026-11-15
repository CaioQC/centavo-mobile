import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Módulo nativo: nos testes entra um stub em Node.
    alias: { 'expo-crypto': fileURLToPath(new URL('./src/data/testing/expo-crypto-stub.ts', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  splitting: false,
  sourcemap: false,
  clean: true,
  format: ['cjs'],
  target: 'es2022'
});

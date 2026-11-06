import { defineConfig } from 'vitest/config';

// Los ficheros de prueba comparten la base de pruebas (TEST_DATABASE_URL) y algunos la vacían con
// TRUNCATE, así que se ejecutan de uno en uno (specs/spec-005/research.md, R7).
export default defineConfig({
  test: {
    fileParallelism: false,
  },
});

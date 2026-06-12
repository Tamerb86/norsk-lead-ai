import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    // server/_core/env.ts validates required env vars at import time;
    // provide harmless defaults so unit tests run without a real .env.
    // A pre-set DATABASE_URL (e.g. pointing at a local test container) wins.
    env: {
      VITE_APP_ID: process.env.VITE_APP_ID ?? "test-app",
      JWT_SECRET: process.env.JWT_SECRET ?? "vitest-only-jwt-secret-not-used-in-real-environments",
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test",
    },
  },
});

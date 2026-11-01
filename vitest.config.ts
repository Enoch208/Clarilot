import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "core",
          root: "packages/core",
          include: ["tests/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "api",
          root: "apps/api",
          include: ["tests/**/*.test.ts"],
          environment: "node",
          fileParallelism: false,
          testTimeout: 30_000,
        },
      },
      {
        test: {
          name: "web",
          root: "apps/web",
          include: ["tests/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});

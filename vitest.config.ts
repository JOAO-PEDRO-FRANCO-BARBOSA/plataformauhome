import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      lines: 45,
      functions: 45,
      branches: 35,
      statements: 45,
      exclude: ["src/test/**", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

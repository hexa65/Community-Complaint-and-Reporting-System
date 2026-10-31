import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// defineConfig comes from "vitest/config" so one file configures both Vite and Vitest.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // "@/shared" resolves to src/shared once Member 1 adds it in M1-T2.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
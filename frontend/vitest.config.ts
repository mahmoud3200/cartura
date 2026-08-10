import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@cartura/contracts": fileURLToPath(
        new URL("../packages/contracts/src", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    restoreMocks: true,
  },
});

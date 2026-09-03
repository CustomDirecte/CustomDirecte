import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve("src/pages/bac/source"),
  base: "./",
  plugins: [react()],
  build: {
    outDir: resolve("src/pages/bac"),
    emptyOutDir: false,
    rollupOptions: {
      input: resolve("src/pages/bac/source/sidebar.html")
    }
  }
});

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, "github-pages"),
  base: "/discovery-to-architecture-workbench/",
  publicDir: resolve(projectRoot, "public"),
  plugins: [react()],
  resolve: {
    alias: {
      "@": projectRoot,
    },
  },
  build: {
    outDir: resolve(projectRoot, "docs"),
    emptyOutDir: true,
  },
});

import { defineConfig } from "vite";

export default defineConfig({
  base: "/rabbit-math/",
  resolve: { alias: { "@": "/src" } },
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});

import { defineConfig } from "vite";

declare const process: { env: { VERCEL?: string } };

const isVercel = !!process.env.VERCEL;

export default defineConfig({
  base: isVercel ? "/" : "/rabbit-math/",
  resolve: { alias: { "@": "/src" } },
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});

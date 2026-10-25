import { defineConfig } from "vite";
export default defineConfig({
  server: {
    middlewareMode: true,
    hmr: { port: Number(process.env.PORT ?? 3010) + 1000 },
  },
  build: { outDir: "dist" },
});

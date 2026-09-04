import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  optimizeDeps: {
    include: ["@axieinfinity/mixer"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
          mixer: ["@axieinfinity/mixer"],
        },
      },
    },
  },
});

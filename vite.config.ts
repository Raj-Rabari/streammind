import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [tailwindcss(), react()],

  // 1. Shift the Vite Root: Tell Vite where the web app actually lives
  root: path.resolve(__dirname, "src/renderer"),

  base: "./",

  resolve: {
    alias: {
      "@renderer": path.resolve(__dirname, "./src/renderer"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
  },

  build: {
    // 2. Absolute OutDir: Force Vite to put compiled files in the master dist folder
    //    instead of creating a dist folder inside src/renderer
    outDir: path.resolve(__dirname, "dist/renderer"),
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/renderer/index.html"),
      },
    },
  },
});

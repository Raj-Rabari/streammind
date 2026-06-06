import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // The React plugin handles JSX compilation and Fast Refresh
  plugins: [react()],

  // CRITICAL: The Base Path Trap
  base: "./",

  resolve: {
    alias: {
      // Clean imports: import { LogEvent } from '@shared/types'
      "@renderer": path.resolve(__dirname, "./src/renderer"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },

  server: {
    // Lock the port so our package.json 'wait-on' script doesn't fail
    port: 5173,
    // If 5173 is taken, crash. Do not auto-increment to 5174,
    // otherwise Electron will open a blank window looking for 5173.
    strictPort: true,
  },

  build: {
    // Output standard web assets into our dedicated renderer folder
    outDir: "dist/renderer",
    // Wipe the old build before creating a new one to prevent ghost files
    emptyOutDir: true,

    rollupOptions: {
      input: {
        // Explicitly point Vite to our React entry point
        main: path.resolve(__dirname, "src/renderer/index.html"),
      },
    },
  },
});

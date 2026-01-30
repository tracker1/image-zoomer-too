import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import process from "node:process";

export default defineConfig({
  base: process.env.CI ? "/simple-image-viewer/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname!, "src"),
      // Resolve eventemitter3 from demo's node_modules for parent src imports
      "eventemitter3": resolve(import.meta.dirname!, "node_modules/eventemitter3"),
    },
  },
});

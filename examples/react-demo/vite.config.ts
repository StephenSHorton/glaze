import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ["react", "react-dom"] },
  // Workspace packages ship ESM dist; keep them out of the dep pre-bundle so the
  // local source is used directly (html2canvas, a core optional dep, is bundled).
  optimizeDeps: { exclude: ["@kussetsu/core", "@kussetsu/react"] },
  server: { port: 5274 },
});

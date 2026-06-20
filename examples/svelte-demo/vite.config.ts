import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Project GitHub Pages serve under /<repo>/, so the production build needs a
// matching base. Local dev stays at root.
export default defineConfig(({ command }) => ({
  plugins: [svelte()],
  base: command === "build" ? "/kussetsu/" : "/",
  server: { port: 5273, open: false },
  // Workspace packages: @kussetsu/svelte ships .svelte/.ts source (let the svelte
  // plugin compile it); @kussetsu/core ships dist ESM. Keep both out of the
  // esbuild dep pre-bundler.
  optimizeDeps: { exclude: ["@kussetsu/core", "@kussetsu/svelte"] },
}));

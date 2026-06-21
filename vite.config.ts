import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Custom reconciler drives the JSX, but we still use the React JSX transform,
// so the React plugin stays (it just wires jsx-runtime + fast refresh).
export default defineConfig({
  plugins: [react()],
  server: { port: 5280 },
});

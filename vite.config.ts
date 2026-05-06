import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/** Local: run `npm run dev` alongside `python3 api/local_dev_server.py` (default backend :3010). */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    /** WSL2: Windows 브라우저에서 접속하려면 0.0.0.0 리슨 필요 */
    host: true,
    port: 8752,
    strictPort: true,
    proxy: {
      "/api": { target: "http://localhost:3010", changeOrigin: true },
    },
  },
});

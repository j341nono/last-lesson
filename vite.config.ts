import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const apiOrigin = "http://localhost:8787";
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: apiOrigin,
        changeOrigin: true,
        configure(proxy) {
          proxy.on("proxyReq", (proxyReq, request) => {
            // Rewrite only genuine same-origin requests from this local dev server.
            // Leave foreign Origin headers intact so the Worker still rejects them.
            if (request.headers.origin === `http://${request.headers.host}`)
              proxyReq.setHeader("Origin", apiOrigin);
          });
        },
      },
    },
  },
});

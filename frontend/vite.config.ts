import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()], // 1. React plugin
  server: {
    port: 3000, // 2. Dev server port
    proxy: {
      // 3. Proxy configuration
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});

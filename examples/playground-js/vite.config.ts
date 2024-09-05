import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@adaptai/realtime-react",
        replacement: fileURLToPath(new URL("../../index.ts", import.meta.url)),
      },
    ],
  },
});

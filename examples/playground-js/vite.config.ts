import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@adaptai/realtime",
        replacement: fileURLToPath(new URL("../../dist", import.meta.url)),
      },
    ],
  },
});

import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import { obfuscator } from 'rollup-obfuscator';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({ include: ["lib"], rollupTypes: true }),
    obfuscator(),
    sentryVitePlugin({
      org: "adapt-ai",
      project: "javascript-react",
      telemetry: false
    })
  ],
  build: {
    minify: 'terser',
    copyPublicDir: false,

    rollupOptions: {
      external: ["react", "react/jsx-runtime"],
    },

    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      formats: ["es"],
    },

    sourcemap: true
  },
});
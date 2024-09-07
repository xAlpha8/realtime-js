import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./index.ts",
    "./realtime-core/**/*.ts",
    "./realtime-react/**/*.(ts|tsx)",
    "./adaptai-global-style.css",
    "!**/*/__tests__/**/*",
    "!**/*/__mocks__/**/*",
  ],
  dts: true,
  format: ["cjs", "esm"],
  clean: true,
  outDir: "dist",
  tsconfig: "./tsconfig.json",
  sourcemap: true,
  minify: false,
  splitting: false,
});

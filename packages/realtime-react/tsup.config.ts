import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.(ts|tsx)"],
  dts: true,
  format: ["cjs", "esm"],
  clean: true,
  outDir: "dist",
  tsconfig: "./tsconfig.json",
  sourcemap: true,
  minify: false,
  splitting: false,
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.(ts|tsx)", "src/adaptai-global-style.css"],
  dts: true,
  format: ["cjs", "esm"],
  clean: true,
  outDir: "dist",
  tsconfig: "./tsconfig.json",
  sourcemap: true,
  minify: false,
  splitting: false,
});

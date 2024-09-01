import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./index.ts",
    "./realtime-core/**/*.ts",
    "./realtime-react/**/*.(ts|tsx)",
    "!**/*/__tests__/**/*",
    "!**/*/__mocks__/**/*",
    // TODO: Remove this line once we merged the branch
    // TODO: containing the implementation of useWebSocket.
    "!./realtime-react/hooks/useWebSocket.ts",
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

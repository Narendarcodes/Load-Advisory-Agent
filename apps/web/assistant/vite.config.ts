import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// The island is built on the host and committed under the Frappe app's public/ tree: the backend
// image has no Node, and the portal links the emitted files directly (no `bench build`).
const outDir = fileURLToPath(
  new URL("../../loan_advisory_portal/loan_advisory_portal/public/js/assistant", import.meta.url),
);

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    // CopilotKit lazily imports KaTeX's stylesheet and inlines its fonts. The island renders plain
    // answers, so swapping it for an empty stylesheet keeps ~1.4 MB of fonts out of the portal.
    alias: [
      {
        find: /^katex\/dist\/.*\.css$/,
        replacement: fileURLToPath(new URL("./src/empty.css", import.meta.url)),
      },
    ],
  },
  define: {
    // Library mode leaves dependency reads of `process.env.NODE_ENV` for the host to provide;
    // a browser has no `process`, so the bundle died before React mounted.
    "process.env.NODE_ENV": JSON.stringify(mode === "development" ? "development" : "production"),
  },
  build: {
    outDir,
    emptyOutDir: true,
    // Library mode inlines assets by default, which turns the KaTeX font faces into a 1.4 MB
    // stylesheet. Emit them as files instead; the CSS references them relatively.
    assetsInlineLimit: 0,
    lib: {
      entry: fileURLToPath(new URL("./src/main.tsx", import.meta.url)),
      formats: ["es"],
      fileName: () => "assistant.js",
      cssFileName: "assistant",
    },
    rollupOptions: {
      output: {
        chunkFileNames: "chunks/[name]-[hash].js",
        // One deterministic stylesheet the Frappe template can link; everything else is hashed.
        assetFileNames: (asset) => {
          const names = asset.names ?? (asset.name ? [asset.name] : []);
          return names.some((name) => name.endsWith(".css")) ? "assistant.css" : "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/test-setup.ts"],
  },
}));

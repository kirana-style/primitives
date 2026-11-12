import { createRequire, registerHooks } from "node:module"
import { pathToFileURL } from "node:url"

import { defineConfig } from "vite-plus"

// Analog's plugin imports `typescript` without declaring it, and Angular's compiler needs
// TypeScript 6's JavaScript API, which the workspace's TypeScript 7 does not have: this build's
// `typescript` is this fixture's own, for every importer, before Analog loads.
const typescript = pathToFileURL(createRequire(import.meta.url).resolve("typescript")).href
registerHooks({
  resolve: (specifier, context, next) =>
    specifier === "typescript"
      ? { url: typescript, format: "commonjs", shortCircuit: true }
      : next(specifier, context),
})
const { default: angular } = await import("@analogjs/vite-plugin-angular")

// The Angular fixture: the page every adapter draws, and the bench page beside it. The build
// script runs Angular's compiler first: on a type error Analog falls back to compiling in the
// browser, which a production bundle cannot.
export default defineConfig({
  base: "./",
  resolve: { mainFields: ["module"] },
  plugins: [angular({ tsconfig: "tsconfig.app.json" })],
  // The adapters are sources in this workspace: a server build compiles them too, and Angular
  // with them, so one copy of it runs.
  ssr: { noExternal: [/^@kirana-ui\//, /^@angular\//, "rxjs", "ng-primitives"] },
  build: {
    target: ["es2022"],
    rollupOptions: { input: { index: "index.html", ssr: "ssr.html", bench: "bench.html" } },
  },
})

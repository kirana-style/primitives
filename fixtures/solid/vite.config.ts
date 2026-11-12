import { defineConfig } from "vite-plus"
import solid from "vite-plugin-solid"

// The Solid fixture: the page every adapter draws, and the bench page beside it.
export default defineConfig({
  base: "./",
  // Compiled so a server can render it and the page can hydrate what the server sent.
  plugins: [solid({ ssr: true })],
  // The adapters are sources in this workspace: a server build compiles them too.
  ssr: { noExternal: true },
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        ssr: "ssr.html",
        open: "open.html",
        "open-ssr": "open-ssr.html",
        bench: "bench.html",
      },
    },
  },
})

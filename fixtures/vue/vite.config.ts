import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite-plus"

// The Vue fixture: the page every adapter draws, and the bench page beside it.
export default defineConfig({
  base: "./",
  plugins: [vue()],
  // The adapters are sources in this workspace: a server build compiles them too.
  ssr: { noExternal: [/^@kirana-ui\//] },
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

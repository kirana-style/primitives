import react from "@vitejs/plugin-react"
import { defineConfig } from "vite-plus"

// The React fixture: the page every adapter draws, and the bench pages beside it.
export default defineConfig({
  base: "./",
  plugins: [react()],
  // The adapters are sources in this workspace: a server build compiles them too.
  ssr: { noExternal: [/^@kirana-ui\//] },
  build: {
    rollupOptions: { input: { index: "index.html", ssr: "ssr.html", bench: "bench.html" } },
  },
})

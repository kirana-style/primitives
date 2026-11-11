import react from "@vitejs/plugin-react"
import { defineConfig } from "vite-plus"

// The React fixture: the page every adapter draws, and the bench pages beside it.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: { input: { index: "index.html", bench: "bench.html" } },
  },
})

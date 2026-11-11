import { defineConfig } from "vite-plus"
import solid from "vite-plugin-solid"

// The Solid fixture: the page every adapter draws, and the bench page beside it.
export default defineConfig({
  base: "./",
  plugins: [solid()],
  build: {
    rollupOptions: { input: { index: "index.html", bench: "bench.html" } },
  },
})

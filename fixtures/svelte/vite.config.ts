import { svelte } from "@sveltejs/vite-plugin-svelte"
import { defineConfig } from "vite-plus"

// The Svelte fixture: the page every adapter draws, and the bench page beside it.
export default defineConfig({
  base: "./",
  plugins: [svelte()],
  build: {
    rollupOptions: { input: { index: "index.html", bench: "bench.html" } },
  },
})

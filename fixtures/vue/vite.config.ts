import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite-plus"

// The Vue fixture: the page every adapter draws, and the bench page beside it.
export default defineConfig({
  base: "./",
  plugins: [vue()],
  build: {
    rollupOptions: { input: { index: "index.html", bench: "bench.html" } },
  },
})

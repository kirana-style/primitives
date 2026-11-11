/**
 * Puts a fixture's server-rendered page into its build: `dist-server/server.js` (the fixture's
 * `src/server.*`, built for a server) renders the page to HTML with no DOM, and that HTML goes
 * into `dist/ssr.html`, whose script hydrates it. The conformance run plays every scenario on
 * that page too.
 *
 *   bun scripts/prerender.ts <fixture>
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const fixture = process.argv[2]
if (!fixture) throw new Error("usage: bun scripts/prerender.ts <fixture>")
const root = join(import.meta.dirname, "../fixtures", fixture)

const server = (await import(join(root, "dist-server/server.js"))) as {
  render(): string | Promise<string>
  head?(): string
}
const html = await server.render()
if (!html.includes("<main")) throw new Error(`${fixture}: the server rendered no page`)

const page = join(root, "dist/ssr.html")
const template = readFileSync(page, "utf8")
if (!template.includes("<!--app-->")) throw new Error(`${fixture}: ssr.html has no <!--app-->`)
writeFileSync(
  page,
  template.replace("<!--app-->", html).replace("<!--head-->", server.head?.() ?? "")
)
console.log(`${fixture}: ssr.html holds ${html.length} bytes rendered on the server`)

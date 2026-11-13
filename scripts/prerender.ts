/**
 * Puts a fixture's server-rendered page into its build: `dist-server/server.js` (the fixture's
 * `src/server.*`, built for a server) renders the page to HTML with no DOM, and that HTML goes
 * into `dist/ssr.html` (and the second page into `dist/open-ssr.html`), whose script hydrates it. The conformance run plays every scenario on
 * that page too.
 *
 *   bun scripts/prerender.ts <fixture> [folder]
 *
 * `folder` is a second build of the fixture inside `dist` (React's `strict`, a development
 * build), which takes the same server's HTML.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const fixture = process.argv[2]
if (!fixture) throw new Error("usage: bun scripts/prerender.ts <fixture>")
const folder = process.argv[3] ?? ""
const root = join(import.meta.dirname, "../fixtures", fixture)

const server = (await import(join(root, "dist-server/server.js"))) as {
  render(page?: string): string | Promise<string>
  head?(): string
}

// The page every scenario walks, and the second one (`src/Open.*`): generated ids and a popup
// that is open when the page is first drawn.
for (const [file, which] of [
  ["ssr.html", undefined],
  ["open-ssr.html", "open"],
] as const) {
  const html = await server.render(which)
  if (!html.includes("<main")) throw new Error(`${fixture}: the server rendered no page`)
  const page = join(root, "dist", folder, file)
  const template = readFileSync(page, "utf8")
  if (!template.includes("<!--app-->")) throw new Error(`${fixture}: ${file} has no <!--app-->`)
  writeFileSync(
    page,
    template.replace("<!--app-->", html).replace("<!--head-->", server.head?.() ?? "")
  )
  console.log(`${fixture}: ${file} holds ${html.length} bytes rendered on the server`)
}

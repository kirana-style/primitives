/**
 * What a component costs a page: each entry bundled alone, minified and gzipped, with the
 * framework left out. The core's entries are the whole behaviour; the React entries add the
 * adapter; Base UI's are beside them for scale (its own dependencies bundled the same way).
 *
 *   bun scripts/budgets.ts
 */
import { gzipSync } from "node:zlib"

const COMPONENTS = ["collapsible", "dialog", "popover", "select"]
const EXTERNAL = ["react", "react-dom", "react/jsx-runtime", "react-dom/client"]

async function size(entry: string): Promise<number> {
  const built = await Bun.build({
    entrypoints: [entry],
    minify: true,
    external: EXTERNAL,
    target: "browser",
    define: { "process.env.NODE_ENV": '"production"' },
  })
  if (!built.success) throw new Error(`${entry}: ${built.logs.join("\n")}`)
  let bytes = 0
  for (const output of built.outputs) bytes += gzipSync(await output.arrayBuffer()).byteLength
  return bytes
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(2)} KB`
const rows: string[] = [
  "| component | core | core + React adapter | Base UI |",
  "| --- | --- | --- | --- |",
]
for (const component of COMPONENTS) {
  const core = await size(`packages/core/src/${component}.ts`)
  const react = await size(`packages/react/src/${component}.tsx`)
  const base = await size(
    Bun.resolveSync(`@base-ui/react/${component}`, `${import.meta.dirname}/../fixtures/react`)
  )
  rows.push(`| ${component} | ${kb(core)} | ${kb(react)} | ${kb(base)} |`)
}
const all = await size("packages/react/src/index.ts")
rows.push(`| all four | | ${kb(all)} | |`)
console.log(rows.join("\n"))

/**
 * What a component costs a page: each entry bundled alone, minified and gzipped, with the
 * framework left out. The core's entries are the whole behaviour; the React entries add the
 * adapter; Base UI's are beside them for scale (its own dependencies bundled the same way).
 *
 *   bun scripts/budgets.ts
 */
import { writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

// Each component, and the entries of Base UI's that make the same thing.
const COMPONENTS: Record<string, string[]> = {
  accordion: ["accordion"],
  checkbox: ["checkbox"],
  collapsible: ["collapsible"],
  dialog: ["dialog"],
  "hover-card": ["preview-card"],
  popover: ["popover"],
  "radio-group": ["radio-group", "radio"],
  select: ["select"],
  switch: ["switch"],
  tabs: ["tabs"],
  tooltip: ["tooltip"],
}
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
const fixture = `${import.meta.dirname}/../fixtures/react`
for (const [component, theirs] of Object.entries(COMPONENTS)) {
  const core = await size(`packages/core/src/${component}.ts`)
  const react = await size(`packages/react/src/${component}.tsx`)
  // One entry that imports them all, so what they share is counted once.
  const entry = join(tmpdir(), `kirana-ui-budget-${component}.ts`)
  writeFileSync(
    entry,
    theirs
      .map(
        (each) =>
          `export * from ${JSON.stringify(Bun.resolveSync(`@base-ui/react/${each}`, fixture))}`
      )
      .join("\n")
  )
  const base = await size(entry)
  rows.push(`| ${component} | ${kb(core)} | ${kb(react)} | ${kb(base)} |`)
}
const all = await size("packages/react/src/index.ts")
rows.push(`| all of them | | ${kb(all)} | |`)
console.log(rows.join("\n"))

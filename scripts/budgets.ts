/**
 * What a component costs a page: each entry bundled alone, minified and gzipped, with the
 * framework left out. The core's entries are the whole behaviour; the React entries add the
 * adapter; Base UI's are beside them for scale (its own dependencies bundled the same way).
 *
 *   bun scripts/budgets.ts            # the table, with Base UI
 *   bun scripts/budgets.ts --check    # against budgets.json, which fails when an entry is over
 *   bun scripts/budgets.ts --write    # new limits from what is measured
 */
import { readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

// Each component, and the entries of Base UI's that make the same thing.
const COMPONENTS: Record<string, string[]> = {
  accordion: ["accordion"],
  avatar: ["avatar"],
  button: ["button"],
  checkbox: ["checkbox"],
  collapsible: ["collapsible"],
  combobox: ["combobox"],
  "context-menu": ["context-menu"],
  dialog: ["dialog"],
  field: ["field"],
  fieldset: ["fieldset"],
  form: ["form"],
  "hover-card": ["preview-card"],
  listbox: [],
  menu: ["menu"],
  menubar: ["menubar"],
  meter: ["meter"],
  "navigation-menu": ["navigation-menu"],
  otp: [],
  popover: ["popover"],
  progress: ["progress"],
  "radio-group": ["radio-group", "radio"],
  resizable: [],
  "scroll-area": ["scroll-area"],
  select: ["select"],
  separator: ["separator"],
  slider: ["slider"],
  switch: ["switch"],
  tabs: ["tabs"],
  toggle: ["toggle"],
  "toggle-group": ["toggle-group"],
  toolbar: ["toolbar"],
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
const LIMITS = join(import.meta.dirname, "../budgets.json")
const mode = process.argv[2]

// `--check`: each entry against its limit in budgets.json, in bytes, gzip. `--write`: the limits
// set to what is measured now plus a twentieth, to the next 50 bytes, which is how a component
// that grew on purpose gets its new limit. Neither measures Base UI.
if (mode === "--check" || mode === "--write") {
  const measured: Record<string, number> = {}
  for (const component of Object.keys(COMPONENTS)) {
    measured[`core/${component}`] = await size(`packages/core/src/${component}.ts`)
    measured[`react/${component}`] = await size(`packages/react/src/${component}.tsx`)
  }
  measured["react"] = await size("packages/react/src/index.ts")
  if (mode === "--write") {
    const limits = Object.fromEntries(
      Object.entries(measured).map(([entry, bytes]) => [entry, Math.ceil((bytes * 1.05) / 50) * 50])
    )
    writeFileSync(LIMITS, `${JSON.stringify(limits, null, 2)}\n`)
    console.log(`budgets.json holds ${Object.keys(limits).length} limits`)
    process.exit(0)
  }
  const limits = JSON.parse(readFileSync(LIMITS, "utf8")) as Record<string, number>
  let over = 0
  for (const [entry, bytes] of Object.entries(measured)) {
    const limit = limits[entry]
    if (limit === undefined) {
      over++
      console.log(`FAIL  ${entry} has no limit in budgets.json (${kb(bytes)})`)
    } else if (bytes > limit) {
      over++
      console.log(`FAIL  ${entry} is ${kb(bytes)}, over its ${kb(limit)}`)
    }
  }
  for (const entry of Object.keys(limits)) {
    if (!(entry in measured)) {
      over++
      console.log(`FAIL  budgets.json has ${entry}, which is not measured`)
    }
  }
  console.log(
    over === 0
      ? `budgets: ${Object.keys(measured).length} entries within their limits, all of React's ${kb(measured["react"]!)}`
      : `budgets: ${over} failed`
  )
  process.exit(over === 0 ? 0 : 1)
}

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

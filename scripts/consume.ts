/**
 * Uses the packed packages as a project would: installs the tarballs `scripts/pack.ts` made into
 * an empty folder with React and Vue, loads every export in Node, renders a component on a
 * server with each adapter, and type-checks a file against the packages' declarations.
 *
 *   bun scripts/pack.ts && bun scripts/consume.ts
 */
import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const packed = path.join(root, "dist-packages")
const tarballs = readdirSync(packed).filter((file) => file.endsWith(".tgz"))
if (tarballs.length === 0) throw new Error("nothing is packed: run `bun scripts/pack.ts` first")

const catalog = (
  JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
    workspaces: { catalog: Record<string, string> }
  }
).workspaces.catalog
const names = tarballs.map((file) => {
  const stage = file.replace(/^kirana-ui-/, "").replace(/-\d.*$/, "")
  return { name: `@kirana-ui/${stage}`, file: path.join(packed, file), stage }
})

const project = mkdtempSync(path.join(tmpdir(), "kirana-ui-consume-"))
function run(command: string, args: string[]) {
  const done = spawnSync(command, args, { cwd: project, encoding: "utf8" })
  if (done.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${done.stdout}\n${done.stderr}`)
  }
  return done.stdout
}

try {
  writeFileSync(
    path.join(project, "package.json"),
    JSON.stringify(
      {
        name: "consumer",
        private: true,
        type: "module",
        dependencies: {
          ...Object.fromEntries(names.map((each) => [each.name, `file:${each.file}`])),
          react: catalog.react,
          "react-dom": catalog["react-dom"],
          vue: catalog.vue,
        },
        devDependencies: {
          "@types/react": catalog["@types/react"],
          "@types/react-dom": catalog["@types/react-dom"],
          typescript: catalog.typescript,
        },
        // A tarball's dependency on another package of the family is the tarball beside it.
        overrides: Object.fromEntries(names.map((each) => [each.name, `file:${each.file}`])),
      },
      null,
      2
    )
  )
  run("bun", ["install"])

  // Every export loads, in Node, by the name a project imports.
  const entries = names.flatMap((each) => {
    const manifest = JSON.parse(
      readFileSync(path.join(project, "node_modules", each.name, "package.json"), "utf8")
    ) as { exports: Record<string, unknown> }
    return Object.keys(manifest.exports)
      .filter((entry) => entry !== "./package.json" && !entry.endsWith(".json"))
      .map((entry) => path.posix.join(each.name, entry))
  })
  writeFileSync(
    path.join(project, "load.mjs"),
    `
import assert from "node:assert/strict"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { createSSRApp, h } from "vue"
import { renderToString as renderVue } from "vue/server-renderer"

for (const entry of ${JSON.stringify(entries)}) {
  const module = await import(entry)
  assert.ok(Object.keys(module).length > 0, entry + " exports nothing")
}

const { Collapsible } = await import("@kirana-ui/react/collapsible")
const react = renderToString(
  createElement(
    Collapsible.Root,
    { defaultOpen: true },
    createElement(Collapsible.Trigger, null, "Details"),
    createElement(Collapsible.Panel, null, "Content")
  )
)
assert.match(react, /aria-expanded="true"/)
assert.match(react, /data-open/)

const vue = await import("@kirana-ui/vue/collapsible")
const drawn = await renderVue(
  createSSRApp({
    render: () =>
      h(vue.Collapsible.Root, { defaultOpen: true }, () => [
        h(vue.Collapsible.Trigger, null, () => "Details"),
        h(vue.Collapsible.Panel, null, () => "Content"),
      ]),
  })
)
assert.match(drawn, /aria-expanded="true"/)

const { vocabulary } = await import("@kirana-ui/vocabulary")
assert.ok(vocabulary.components.collapsible, "the vocabulary has the collapsible")
console.log(${JSON.stringify(entries.length)} + " exports load; React and Vue render on a server")
`
  )
  process.stdout.write(run("node", ["load.mjs"]))

  // The declarations are the packages' own, checked too (`skipLibCheck` is off), and they refuse
  // a value of the wrong type.
  writeFileSync(
    path.join(project, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        lib: ["ES2023", "DOM", "DOM.Iterable"],
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        types: [],
      },
      include: ["use.tsx", "use-vue.ts"],
    })
  )
  writeFileSync(
    path.join(project, "use.tsx"),
    `
import { signal } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createDialog } from "@kirana-ui/core/dialog"
import { Dialog } from "@kirana-ui/react/dialog"
import { Slider, useDirection } from "@kirana-ui/react"
import { Dialog as states } from "@kirana-ui/vocabulary/keys"

const dialog = createDialog(signal({ id: "d" }))
export const open: boolean = dialog.open.get()
export const selector: string = states.Popup.open
export const direction: "ltr" | "rtl" = useDirection()

export const page = (
  <Dialog.Root onOpenChange={(next: boolean, details: ChangeDetails) => details.cancel()}>
    <Dialog.Trigger>Open</Dialog.Trigger>
    <Slider.Root defaultValue={40} min={0} />
    {/* @ts-expect-error a value is a number, or several */}
    <Slider.Root defaultValue="forty" />
  </Dialog.Root>
)
`
  )
  writeFileSync(
    path.join(project, "use-vue.ts"),
    `
import { Tabs, useDirection } from "@kirana-ui/vue"
import { h } from "vue"

export const direction: "ltr" | "rtl" = useDirection().value
export const tabs = h(Tabs.Root, { defaultValue: "one" })
`
  )
  run(path.join(project, "node_modules/.bin/tsc"), ["-p", "."])
  console.log("the declarations type-check in a project, their own files included")
} finally {
  rmSync(project, { recursive: true, force: true })
}

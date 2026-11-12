/**
 * Uses the packed packages as a project would: installs the tarballs `scripts/pack.ts` made into
 * an empty folder with the five frameworks, loads every export in Node, renders a component on a
 * server with each adapter, and type-checks a file per adapter against the packages'
 * declarations. Svelte's components are compiled from the package first, as a project's own
 * Svelte would; Angular's are finished by Angular's compiler at run time.
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
          "solid-js": catalog["solid-js"],
          svelte: catalog.svelte,
          "@angular/common": catalog["@angular/common"],
          "@angular/compiler": catalog["@angular/compiler"],
          "@angular/core": catalog["@angular/core"],
          "@angular/platform-browser": catalog["@angular/platform-browser"],
          "@angular/platform-server": catalog["@angular/platform-server"],
          rxjs: catalog.rxjs,
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
  // A `.svelte` file is not a module until Svelte compiles it: Svelte's entries load below.
  const plain = entries.filter((entry) => !entry.startsWith("@kirana-ui/svelte"))
  const svelte = entries.filter((entry) => entry.startsWith("@kirana-ui/svelte"))
  writeFileSync(
    path.join(project, "load.mjs"),
    `
import "@angular/compiler"
import assert from "node:assert/strict"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { createSSRApp, h } from "vue"
import { renderToString as renderVue } from "vue/server-renderer"

for (const entry of ${JSON.stringify(plain)}) {
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

// Node takes Solid's server build (the \`node\` condition).
const solid = await import("@kirana-ui/solid/collapsible")
const { createComponent, renderToString: renderSolid } = await import("solid-js/web")
const written = renderSolid(() =>
  createComponent(solid.Collapsible.Root, {
    defaultOpen: true,
    get children() {
      return [
        createComponent(solid.Collapsible.Trigger, { children: "Details" }),
        createComponent(solid.Collapsible.Panel, { children: "Content" }),
      ]
    },
  })
)
assert.match(written, /aria-expanded="true"/)

// Angular's package is compiled as far as a library may be; \`@angular/compiler\`, imported
// first, finishes it here as a project's build would.
const { Component, provideZonelessChangeDetection } = await import("@angular/core")
const { bootstrapApplication } = await import("@angular/platform-browser")
const { provideServerRendering, renderApplication } = await import("@angular/platform-server")
const kui = await import("@kirana-ui/angular")
const App = Component({
  selector: "app-root",
  imports: [kui.KuiCollapsible, kui.KuiCollapsibleTrigger, kui.KuiCollapsiblePanel],
  template:
    '<div kuiCollapsible [defaultOpen]="true"><button kuiCollapsibleTrigger>Details</button>' +
    '<div *kuiCollapsiblePanel>Content</div></div>',
})(class {})
const page = await renderApplication(
  (context) =>
    bootstrapApplication(
      App,
      { providers: [provideZonelessChangeDetection(), provideServerRendering()] },
      context
    ),
  { document: "<html><body><app-root></app-root></body></html>", url: "/" }
)
assert.match(page, /aria-expanded="true"/)
assert.match(page, /Content/)

const { vocabulary } = await import("@kirana-ui/vocabulary")
assert.ok(vocabulary.components.collapsible, "the vocabulary has the collapsible")
console.log(
  ${JSON.stringify(plain.length)} + " exports load; React, Vue, Solid and Angular render on a server"
)
`
  )
  process.stdout.write(run("node", ["load.mjs"]))

  // Svelte's package holds `.svelte` files and modules with runes: compiled here from the
  // installed package by the project's Svelte, then every entry loaded and one rendered.
  writeFileSync(
    path.join(project, "svelte.mjs"),
    `
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { compile, compileModule } from "svelte/compiler"

Bun.plugin({
  name: "svelte",
  setup(build) {
    build.onLoad({ filter: /\\.svelte$/ }, (args) => ({
      contents: compile(readFileSync(args.path, "utf8"), { generate: "server", filename: args.path })
        .js.code,
      loader: "js",
    }))
    build.onLoad({ filter: /\\.svelte\\.js$/ }, (args) => ({
      contents: compileModule(readFileSync(args.path, "utf8"), {
        generate: "server",
        filename: args.path,
      }).js.code,
      loader: "js",
    }))
  },
})

for (const entry of ${JSON.stringify(svelte)}) {
  const module = await import(entry)
  assert.ok(Object.keys(module).length > 0, entry + " exports nothing")
}
const { Separator } = await import("@kirana-ui/svelte/separator")
const { render } = await import("svelte/server")
const drawn = render(Separator, { props: { orientation: "vertical" } }).body
assert.match(drawn, /role="separator"/)
assert.match(drawn, /aria-orientation="vertical"/)
console.log(${JSON.stringify(svelte.length)} + " Svelte exports compile and load; one renders on a server")
`
  )
  process.stdout.write(run("bun", ["--conditions", "svelte", "svelte.mjs"]))

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
      include: ["use.tsx", "use-vue.ts", "use-svelte.ts", "use-angular.ts"],
    })
  )
  // Solid's JSX has its own types.
  writeFileSync(
    path.join(project, "tsconfig.solid.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        lib: ["ES2023", "DOM", "DOM.Iterable"],
        jsx: "preserve",
        jsxImportSource: "solid-js",
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        types: [],
      },
      include: ["use-solid.tsx"],
    })
  )
  writeFileSync(
    path.join(project, "use-solid.tsx"),
    `
import { Slider, useDirection } from "@kirana-ui/solid"
import { Dialog } from "@kirana-ui/solid/dialog"

export const direction: "ltr" | "rtl" = useDirection()()
export const page = () => (
  <Dialog.Root>
    <Dialog.Trigger>Open</Dialog.Trigger>
    <Slider.Root defaultValue={40} min={0} />
    {/* @ts-expect-error a value is a number, or several */}
    <Slider.Root defaultValue="forty" />
  </Dialog.Root>
)
`
  )
  writeFileSync(
    path.join(project, "use-svelte.ts"),
    `
import { Collapsible, useDirection } from "@kirana-ui/svelte"
import { Slider } from "@kirana-ui/svelte/slider"
import type { ComponentProps } from "svelte"

export const direction: "ltr" | "rtl" = useDirection().current
export const root: typeof Collapsible.Root = Collapsible.Root
export const props: ComponentProps<typeof Slider.Root> = { defaultValue: 40 }
// @ts-expect-error a value is a number, or several
export const wrong: ComponentProps<typeof Slider.Root> = { defaultValue: "forty" }
`
  )
  writeFileSync(
    path.join(project, "use-angular.ts"),
    `
import { KuiSlider, injectDirection } from "@kirana-ui/angular"
import type { Signal } from "@angular/core"

export const direction: () => Signal<"ltr" | "rtl"> = injectDirection
export const minimum = (slider: KuiSlider): number | undefined => slider.min()
// @ts-expect-error a slider has no such input
export const nothing = (slider: KuiSlider) => slider.nonsense
`
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
  run(path.join(project, "node_modules/.bin/tsc"), ["-p", "tsconfig.solid.json"])
  console.log("the declarations type-check in a project, their own files included")
} finally {
  rmSync(project, { recursive: true, force: true })
}

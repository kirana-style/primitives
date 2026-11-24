/**
 * Uses the packed packages as a project would: installs the tarballs `scripts/pack.ts` made into
 * an empty folder with the five frameworks, loads every export in Node, renders a component on a
 * server with each adapter, and type-checks a file per adapter against the packages'
 * declarations. Svelte's components are compiled from the package first, as a project's own
 * Svelte would; Angular's are finished by Angular's compiler at run time.
 *
 *   bun scripts/pack.ts && bun scripts/consume.ts   # the tarballs in dist-packages/
 *   bun scripts/consume.ts --version 0.1.0          # that release, from the registry
 *   … --version <version> --registry <url>          # from another registry (a rehearsal)
 *
 * From the registry it first waits until the edge it reaches lists the version for every package
 * and serves its file: a release ends when the registry has accepted it, an edge may serve its
 * older list for as long as the registry's own `max-age` says, and a version it lists is not yet
 * one whose file it has (a release was listed everywhere while one package's file still answered
 * 404). The wait is bounded by that age.
 */
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const packed = path.join(root, "dist-packages")
const option = (name: string) => {
  const index = process.argv.indexOf(`--${name}`)
  return index < 0 ? undefined : process.argv[index + 1]
}
const released = option("version")
const registry = (option("registry") ?? "https://registry.npmjs.org").replace(/\/$/, "")
const rehearsed = registry !== "https://registry.npmjs.org"
const ADAPTERS = ["react", "vue", "svelte", "solid", "angular", "web"]
// The releases published before every package carried `CHANGELOG.md`.
const SHIPPED_NO_CHANGELOG = ["0.1.0", "0.1.1", "0.2.0", "0.3.0"]
const tarballs = released ? [] : readdirSync(packed).filter((file) => file.endsWith(".tgz"))
if (!released && tarballs.length === 0)
  throw new Error("nothing is packed: run `bun scripts/pack.ts` first")

const catalog = (
  JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
    workspaces: { catalog: Record<string, string> }
  }
).workspaces.catalog
// What the project depends on: each tarball, or each package at the released version.
const names = released
  ? readdirSync(path.join(root, "packages")).map((stage) => ({
      name: `@kirana-ui/${stage}`,
      spec: released,
    }))
  : tarballs.map((file) => ({
      name: `@kirana-ui/${file.replace(/^kirana-ui-/, "").replace(/-\d.*$/, "")}`,
      spec: `file:${path.join(packed, file)}`,
    }))

/**
 * Waits until this edge lists the released version of every package and serves its file, for the
 * cache's age at most.
 */
async function served(version: string) {
  const started = Date.now()
  for (;;) {
    let maxAge = 0
    const missing: string[] = []
    const unserved: string[] = []
    await Promise.all(
      names.map(async ({ name }) => {
        const response = await fetch(`${registry}/${name.replaceAll("/", "%2f")}`, {
          headers: { Accept: "application/vnd.npm.install-v1+json" },
          signal: AbortSignal.timeout(15_000),
        }).catch(() => undefined)
        const age = /max-age=(\d+)/.exec(response?.headers.get("cache-control") ?? "")
        if (age) maxAge = Math.max(maxAge, Number(age[1]))
        const json = response?.ok
          ? ((await response.json()) as {
              versions?: Record<string, { dist?: { tarball?: string } } | undefined>
            })
          : undefined
        const listed = json?.versions?.[version]
        if (!listed) return void missing.push(name)
        // Listed is not served: the list and the file reach an edge apart.
        const file =
          listed.dist?.tarball ?? `${registry}/${name}/-/${name.split("/")[1]}-${version}.tgz`
        const held = await fetch(file, {
          method: "HEAD",
          signal: AbortSignal.timeout(15_000),
        }).catch(() => undefined)
        if (!held?.ok) unserved.push(name)
      })
    )
    if (missing.length === 0 && unserved.length === 0) return
    if (Date.now() - started > (maxAge + 120) * 1000) {
      throw new Error(
        missing.length > 0
          ? `${missing.join(", ")} did not list ${version} within the cache's age (${maxAge} s) and two minutes`
          : `${unserved.join(", ")} listed ${version} and did not serve its file within the cache's age (${maxAge} s) and two minutes`
      )
    }
    if (missing.length > 0) {
      console.log(`waiting  not listed here yet: ${missing.sort().join(", ")}`)
    }
    if (unserved.length > 0) {
      console.log(`waiting  listed, its file not served here yet: ${unserved.sort().join(", ")}`)
    }
    // A rehearsal's registry is in this machine: nothing there takes a quarter of a minute.
    await new Promise((resolve) => setTimeout(resolve, rehearsed ? 1_000 : 15_000))
  }
}
if (released) await served(released)

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
          ...Object.fromEntries(names.map((each) => [each.name, each.spec])),
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
        ...(released
          ? {}
          : { overrides: Object.fromEntries(names.map((each) => [each.name, each.spec])) }),
      },
      null,
      2
    )
  )
  if (rehearsed) {
    writeFileSync(
      path.join(project, "bunfig.toml"),
      `[install.scopes]\n"@kirana-ui" = "${registry}"\n`
    )
  }
  // A registry of a rehearsal's own holds a version for one run, and the next run's holds
  // the same version with other files: the machine's cache would hand this project the
  // earlier ones, and the check would pass on packages nobody published. Its cache is its own.
  run("bun", rehearsed ? ["install", "--cache-dir", path.join(project, ".cache")] : ["install"])

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
const kp = await import("@kirana-ui/angular")
const App = Component({
  selector: "app-root",
  imports: [kp.KpCollapsible, kp.KpCollapsibleTrigger, kp.KpCollapsiblePanel],
  template:
    '<div kpCollapsible [defaultOpen]="true"><button kpCollapsibleTrigger>Details</button>' +
    '<div *kpCollapsiblePanel>Content</div></div>',
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
import type { TriggerProps } from "@kirana-ui/solid/dialog"

export const direction: "ltr" | "rtl" = useDirection()()
// A part's props by name: its element's, with a handler that can keep the part's own out.
export const trigger: TriggerProps = { onClick: (event) => event.preventKiranaHandler() }
// @ts-expect-error a class is text
export const mistyped: TriggerProps = { class: 42 }
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
import type { TriggerProps } from "@kirana-ui/svelte/dialog"
import { Slider } from "@kirana-ui/svelte/slider"
import type { ComponentProps } from "svelte"

export const direction: "ltr" | "rtl" = useDirection().current
export const root: typeof Collapsible.Root = Collapsible.Root
export const props: ComponentProps<typeof Slider.Root> = { defaultValue: 40 }
// A part's props by name: its element's, with a handler that can keep the part's own out.
export const trigger: TriggerProps = { onclick: (event) => event.preventKiranaHandler() }
// @ts-expect-error a class is text, a list or an object of conditions, never a number
export const mistyped: TriggerProps = { class: 42 }
// @ts-expect-error a value is a number, or several
export const wrong: ComponentProps<typeof Slider.Root> = { defaultValue: "forty" }
`
  )
  writeFileSync(
    path.join(project, "use-angular.ts"),
    `
import { KpSlider, injectDirection } from "@kirana-ui/angular"
import type { Signal } from "@angular/core"

export const direction: () => Signal<"ltr" | "rtl"> = injectDirection
export const minimum = (slider: KpSlider): number | undefined => slider.min()
// A directive's value is the caller's: a slider given a number holds a number.
export const level = (slider: KpSlider<number>): number | undefined => slider.value()
// @ts-expect-error a range's list is not a number
export const range = (slider: KpSlider<number[]>): number | undefined => slider.value()
// @ts-expect-error a slider has no such input
export const nothing = (slider: KpSlider) => slider.nonsense
`
  )
  writeFileSync(
    path.join(project, "use.tsx"),
    `
import { signal } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/react"
import { createDialog } from "@kirana-ui/core/dialog"
import { Dialog } from "@kirana-ui/react/dialog"
import type { TriggerProps } from "@kirana-ui/react/dialog"
import { Slider, useDirection } from "@kirana-ui/react"
import { Dialog as states } from "@kirana-ui/vocabulary/keys"

const dialog = createDialog(signal({ id: "d" }))
export const open: boolean = dialog.open.get()
export const selector: string = states.Popup.open
export const direction: "ltr" | "rtl" = useDirection()
// A part's props by name: its element's, with a handler that can keep the part's own out.
export const trigger: TriggerProps = { onClick: (event) => event.preventKiranaHandler() }
// @ts-expect-error a class is text
export const mistyped: TriggerProps = { className: 42 }

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
import { Collapsible, Tabs, useDirection } from "@kirana-ui/vue"
import type { PanelProps } from "@kirana-ui/vue/collapsible"
import { h } from "vue"

export const direction: "ltr" | "rtl" = useDirection().value
export const tabs = h(Tabs.Root, { defaultValue: "one" })
// A part's props by name, and its element's attributes with them.
export const panel: PanelProps = { keepMounted: true }
export const trigger = new Collapsible.Trigger({
  type: "submit",
  onClick: (event) => event.preventKiranaHandler(),
})
// @ts-expect-error a \`<button>\` has no \`href\`
export const mistyped = new Collapsible.Trigger({ href: "/more" })
`
  )
  run(path.join(project, "node_modules/.bin/tsc"), ["-p", "."])
  run(path.join(project, "node_modules/.bin/tsc"), ["-p", "tsconfig.solid.json"])
  console.log("the declarations type-check in a project, their own files included")

  // The skill is in every adapter, with the adapter's own name in its paths.
  for (const adapter of ADAPTERS) {
    const skill = readFileSync(
      path.join(
        project,
        "node_modules/@kirana-ui",
        adapter,
        "skills/kirana-ui-primitives/SKILL.md"
      ),
      "utf8"
    )
    for (const entry of ["llms.txt", "agent", "testing"]) {
      if (!skill.includes(`@kirana-ui/${adapter}/${entry}`))
        throw new Error(`@kirana-ui/${adapter}'s skill does not name its own ${entry}`)
    }
    if (skill.includes("<framework>"))
      throw new Error(`@kirana-ui/${adapter}'s skill names <framework>, not ${adapter}`)
  }
  console.log(`the skill is in each of the ${ADAPTERS.length} adapters, naming its own entries`)

  // The changelog is in every package, as the repository has it: a project upgrading reads it
  // there. Releases before it was shipped are passed over (a release published again by hand).
  if (!(released && SHIPPED_NO_CHANGELOG.includes(released))) {
    for (const { name } of names) {
      const file = path.join(project, "node_modules", name, "CHANGELOG.md")
      if (!existsSync(file)) throw new Error(`${name} has no CHANGELOG.md`)
      if (!readFileSync(file, "utf8").startsWith("# Changelog"))
        throw new Error(`${name}'s CHANGELOG.md is not the repository's changelog`)
    }
    console.log(`the changelog is in each of the ${names.length} packages`)
  }
} finally {
  rmSync(project, { recursive: true, force: true })
}

// One package is enough: the adapters alone, installed the strict way (each package sees only
// what it depends on, as pnpm and Bun's isolated linker lay a project out), load the agent
// bridge and the testing kit from their own entries. The core is not the project's to import.
const alone = mkdtempSync(path.join(tmpdir(), "kirana-ui-alone-"))
try {
  const adapters = names.filter((each) => ADAPTERS.includes(each.name.replace("@kirana-ui/", "")))
  writeFileSync(
    path.join(alone, "package.json"),
    JSON.stringify(
      {
        name: "alone",
        private: true,
        type: "module",
        dependencies: Object.fromEntries(adapters.map((each) => [each.name, each.spec])),
        devDependencies: { typescript: catalog.typescript },
        ...(released
          ? {}
          : { overrides: Object.fromEntries(names.map((each) => [each.name, each.spec])) }),
      },
      null,
      2
    )
  )
  if (rehearsed) {
    writeFileSync(
      path.join(alone, "bunfig.toml"),
      `[install.scopes]\n"@kirana-ui" = "${registry}"\n`
    )
  }
  const install = spawnSync(
    "bun",
    [
      "install",
      "--linker",
      "isolated",
      ...(rehearsed ? ["--cache-dir", path.join(alone, ".cache")] : []),
    ],
    { cwd: alone, encoding: "utf8" }
  )
  if (install.status !== 0)
    throw new Error(`bun install --linker isolated failed\n${install.stderr}`)
  if (existsSync(path.join(alone, "node_modules/@kirana-ui/core")))
    throw new Error("the isolated project can import @kirana-ui/core: the check proves nothing")
  writeFileSync(
    path.join(alone, "load.mjs"),
    `
import assert from "node:assert/strict"
for (const adapter of ${JSON.stringify(ADAPTERS)}) {
  const agent = await import("@kirana-ui/" + adapter + "/agent")
  assert.equal(typeof agent.createAgent, "function", adapter + "/agent has no createAgent")
  const testing = await import("@kirana-ui/" + adapter + "/testing")
  assert.equal(typeof testing.faults, "function", adapter + "/testing has no faults")
  assert.equal(typeof testing.known, "function", adapter + "/testing has no known")
}
await assert.rejects(import("@kirana-ui/core"), "the core is not the project's to import")
console.log(${JSON.stringify(ADAPTERS.length)} + " adapters alone, installed isolated, load their own agent and testing entries")
`
  )
  const loaded = spawnSync("node", ["load.mjs"], { cwd: alone, encoding: "utf8" })
  if (loaded.status !== 0)
    throw new Error(`the adapters alone do not load\n${loaded.stdout}\n${loaded.stderr}`)
  process.stdout.write(loaded.stdout)

  // And the types a prop names are each adapter's own to give: `ChangeDetails`, `Side` and
  // `IsoDate` are the core's, re-exported by the adapter's root as types. A wrong value is
  // refused, which a type that did not resolve (and so was anything) would not do.
  writeFileSync(
    path.join(alone, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        lib: ["ES2023", "DOM", "DOM.Iterable"],
        strict: true,
        noEmit: true,
        // The frameworks are not this project's: only the adapters' own types are asked for.
        skipLibCheck: true,
        types: [],
      },
      include: ["types.ts"],
    })
  )
  writeFileSync(
    path.join(alone, "types.ts"),
    ADAPTERS.map(
      (adapter, at) => `
import type { ChangeDetails as Details${at}, IsoDate as Day${at}, Side as Side${at} } from "@kirana-ui/${adapter}"
export const side${at}: Side${at} = "inline-end"
// @ts-expect-error a side is one of six
export const noSide${at}: Side${at} = "middle"
export const day${at}: Day${at} = "2026-03-01"
// @ts-expect-error a day is text
export const noDay${at}: Day${at} = 20260301
export const refuse${at} = (details: Details${at}): string => {
  details.cancel()
  return details.reason
}
// @ts-expect-error the details have no such field
export const none${at} = (details: Details${at}) => details.nothing
`
    ).join("")
  )
  const typed = spawnSync(path.join(alone, "node_modules/.bin/tsc"), ["-p", "."], {
    cwd: alone,
    encoding: "utf8",
  })
  if (typed.status !== 0)
    throw new Error(
      `the adapters alone do not give the core's types\n${typed.stdout}\n${typed.stderr}`
    )
  console.log(
    `${ADAPTERS.length} adapters alone give the types their props name (ChangeDetails, Side, IsoDate)`
  )
} finally {
  rmSync(alone, { recursive: true, force: true })
}

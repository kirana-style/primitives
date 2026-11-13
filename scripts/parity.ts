/**
 * Every adapter exports the same components with the same parts. React's is the list the others
 * are held to; a difference a framework's idiom needs is written in `IDIOM`, with why.
 *
 *   bun scripts/parity.ts
 */
import { readFileSync, readdirSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

const ROOT = join(import.meta.dirname, "..")
type Shape = Record<string, string[]>

// Solid's JSX is compiled by Solid's own Babel preset, which its Vite plugin brings: the same
// transform here, so its modules load and their exports can be read.
const solid = createRequire(
  createRequire(join(ROOT, "fixtures/solid/package.json")).resolve("vite-plugin-solid")
)
// The workspace's TypeScript 7 has no JavaScript API; the Angular fixture's own TypeScript has.
const typescript = createRequire(join(ROOT, "fixtures/angular/package.json"))("typescript") as {
  transpileModule(
    source: string,
    options: { compilerOptions: Record<string, unknown> }
  ): { outputText: string }
}
const babel = solid("@babel/core") as {
  transformAsync(code: string, options: object): Promise<{ code: string } | null>
}
Bun.plugin({
  name: "solid-jsx",
  setup(build) {
    build.onLoad({ filter: /\/packages\/solid\/src\/.*\.tsx$/ }, async (args) => {
      // TypeScript takes the types off and leaves the JSX for Solid's preset.
      const plain = typescript.transpileModule(readFileSync(args.path, "utf8"), {
        // Its enums by their numbers: JSX preserved, ES2022, ES modules.
        compilerOptions: { jsx: 1, target: 9, module: 99, verbatimModuleSyntax: true },
      }).outputText
      const built = await babel.transformAsync(plain, {
        filename: args.path.replace(/\.tsx$/, ".jsx"),
        babelrc: false,
        configFile: false,
        presets: [[solid.resolve("babel-preset-solid"), { generate: "ssr" }]],
      })
      return { contents: built!.code, loader: "js" }
    })
  },
})

/** A module's exports as loaded: a namespace's keys are its parts. */
async function loaded(adapter: string): Promise<Shape> {
  const module = (await import(join(ROOT, "packages", adapter, "src/index.ts"))) as Record<
    string,
    unknown
  >
  const shape: Shape = {}
  for (const [name, value] of Object.entries(module)) {
    const parts =
      typeof value === "object" && value !== null && !("setup" in value) && !("render" in value)
        ? Object.keys(value)
        : []
    shape[name] = parts.sort()
  }
  return shape
}

const read = (path: string) => readFileSync(join(ROOT, path), "utf8")

/** The names an `export { a, b as c } from` or `export { default as A } from` list gives. */
function names(source: string): string[] {
  const found: string[] = []
  for (const [, list] of source.matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
    for (const item of list!.split(",")) {
      const name = item
        .trim()
        .split(/\s+as\s+/)
        .pop()
      if (name && !name.startsWith("type ")) found.push(name)
    }
  }
  return found
}

/** Svelte's files are not modules a script can load: its indexes are read. */
function svelte(): Shape {
  const index = read("packages/svelte/src/index.ts")
  const shape: Shape = {}
  for (const [, name, path] of index.matchAll(/export \* as (\w+) from "\.\/([^"]+)"/g)) {
    shape[name!] = names(read(`packages/svelte/src/${path}`)).sort()
  }
  for (const name of names(index)) shape[name] = []
  return shape
}

/** Angular's parts are directives, `KuiAccordionItem`: named back into component and part. */
function angular(components: string[]): Shape {
  const shape: Shape = {}
  const byLength = [...components].sort((a, b) => b.length - a.length)
  for (const name of names(read("packages/angular/src/index.ts"))) {
    if (!name.startsWith("Kui")) {
      shape[name] = []
      continue
    }
    const rest = name.slice(3)
    const component = byLength.find((each) => rest.startsWith(each))
    if (!component) {
      shape[rest] = []
      continue
    }
    const part = rest.slice(component.length)
    ;(shape[component] ??= []).push(part || "Root")
  }
  for (const parts of Object.values(shape)) parts.sort()
  return shape
}

/**
 * What an adapter names or shapes its own way. `rename` maps its export to React's; `without`
 * lists parts it does not have and `extra` parts only it has, each with the reason.
 */
const IDIOM: Record<
  string,
  {
    rename?: Record<string, string>
    without?: Record<string, string>
    extra?: Record<string, string>
  }
> = {
  angular: {
    // A directive is a provider by being on an element; a function that injects is `inject…`.
    rename: { Direction: "DirectionProvider", injectDirection: "useDirection" },
    without: {
      AlertDialog: "the dialog's directives with another selector on the root: `kuiAlertDialog`",
      ContextMenu:
        "the menu's directives with another selector on the root, `kuiContextMenu`, and its own trigger, `kuiContextMenuTrigger`",
    },
    extra: {
      "Select.Input":
        "the root is an `<ng-container>`, with no element to hold the hidden input: it is written",
    },
  },
}

const react = await loaded("react")
const shapes: Record<string, Shape> = {
  vue: await loaded("vue"),
  solid: await loaded("solid"),
  svelte: svelte(),
  angular: angular(Object.keys(react)),
}

let failed = 0

// The same entry per component in every package: `@kirana-ui/<adapter>/accordion`. Angular's is
// the exception: Angular's packager writes one flat module, which a project's build takes apart.
const entries = (adapter: string) =>
  Object.keys((JSON.parse(read(`packages/${adapter}/package.json`)) as { exports: object }).exports)
    .filter((each) => each !== ".")
    .sort()
const components = entries("core").filter(
  (each) => !["./reactivity", "./dom", "./vocabulary"].includes(each)
)
for (const adapter of ["react", "vue", "solid", "svelte"]) {
  const given = entries(adapter)
  const missing = components.filter((each) => !given.includes(each))
  const unknown = given.filter((each) => !components.includes(each))
  if (missing.length === 0 && unknown.length === 0) {
    console.log(`same  ${adapter} has the core's entries  (${given.length})`)
    continue
  }
  failed += missing.length + unknown.length
  for (const each of missing) console.log(`DIFF  ${adapter} has no entry ${each}`)
  for (const each of unknown) console.log(`DIFF  ${adapter} has ${each}, which the core has not`)
}
for (const [adapter, given] of Object.entries(shapes)) {
  const idiom = IDIOM[adapter] ?? {}
  const shape: Shape = {}
  for (const [name, parts] of Object.entries(given)) shape[idiom.rename?.[name] ?? name] = parts
  const problems: string[] = []
  for (const [name, parts] of Object.entries(react)) {
    const theirs = shape[name]
    // A component it makes from another's parts is not held to React's list of them.
    if (!theirs || idiom.without?.[name]) {
      if (!idiom.without?.[name]) problems.push(`has no ${name}`)
      continue
    }
    // A component with one part is the component itself; with several, Angular's root is `Root`.
    const mine = parts.length === 0 && theirs.join() === "Root" ? ["Root"] : parts
    for (const part of mine) {
      if (!theirs.includes(part) && !idiom.without?.[`${name}.${part}`])
        problems.push(`has no ${name}.${part}`)
    }
    for (const part of theirs) {
      if (!mine.includes(part) && !idiom.extra?.[`${name}.${part}`])
        problems.push(`has ${name}.${part}, which React's has not`)
    }
  }
  for (const name of Object.keys(shape)) {
    if (!(name in react) && !idiom.extra?.[name])
      problems.push(`has ${name}, which React's has not`)
  }
  if (problems.length === 0) {
    console.log(`same  ${adapter} = react  (${Object.keys(react).length} exports)`)
    continue
  }
  failed += problems.length
  for (const problem of problems) console.log(`DIFF  ${adapter} ${problem}`)
}
// One version for the family (each adapter is only right for the core it was built with), which
// the release bumps in every manifest: a package the release's configuration does not list would
// stay behind.
const manifest = (path: string) => JSON.parse(read(path)) as { version: string }
const release = (JSON.parse(read(".release-please-manifest.json")) as Record<string, string>)["."]
const bumped = (
  JSON.parse(read("release-please-config.json")) as {
    packages: { ".": { "extra-files": { path: string }[] } }
  }
).packages["."]["extra-files"].map((each) => each.path)
const packages = readdirSync(join(ROOT, "packages")).map((each) => `packages/${each}/package.json`)
for (const path of packages) {
  if (!bumped.includes(path)) {
    failed++
    console.log(`DIFF  release-please-config.json does not bump ${path}`)
  }
  if (manifest(path).version !== release) {
    failed++
    console.log(`DIFF  ${path} is ${manifest(path).version}, the release is ${release}`)
  }
}
for (const path of bumped.filter((each) => !packages.includes(each))) {
  failed++
  console.log(`DIFF  release-please-config.json bumps ${path}, which is not a package`)
}
console.log(`same  ${packages.length} packages at ${release}, each bumped by a release`)

console.log(failed === 0 ? "\nparity: passed" : `\nparity: ${failed} differences`)
process.exit(failed === 0 ? 0 : 1)

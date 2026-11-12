/**
 * Packs the packages the way they would be published, without publishing them.
 *
 *   bun scripts/pack.ts                     # into dist-packages/
 *   bun scripts/pack.ts --version <version> # as another version, for a rehearsal
 *
 * The workspace keeps reading TypeScript source. Each package is compiled in a staging copy, file
 * for file (no bundle: an entry per component stays a file per component, and an import of
 * another package stays an import), with its declarations beside the code; its manifest is
 * rewritten to name the compiled files and real versions; then `npm pack` makes the tarball.
 * Every export is then checked: its code and its declarations are in the tarball's files.
 *
 * The core, the vocabulary, React and Vue are plain TypeScript. The other three are built the
 * way their frameworks' libraries are:
 *   - Solid ships its JSX with the types taken off, for a project's own Solid compiler (the
 *     `solid` condition), beside two compiled copies: one for the browser and one for a server.
 *   - Svelte ships its components as `.svelte` files (`svelte-package`), which a project's own
 *     Svelte compiles.
 *   - Angular is built by Angular's packager in partial-compilation mode: one flat module.
 */
import { spawnSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const out = path.join(root, "dist-packages")
const PLAIN = ["core", "vocabulary", "react", "vue"]
const INSTALL_SCRIPTS = ["preinstall", "install", "postinstall", "prepare"]

interface Manifest {
  name: string
  version: string
  private?: boolean
  exports: Record<string, string | Record<string, string>>
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
  [key: string]: unknown
}

// `--version 0.1.0-rehearsal.1`: every package as that version, whatever the manifests say. For
// a rehearsal against a registry of one's own; a release's version is in the manifests.
const override = process.argv.includes("--version")
  ? process.argv[process.argv.indexOf("--version") + 1]
  : undefined
const read = (file: string) => {
  const manifest = JSON.parse(readFileSync(file, "utf8")) as Manifest
  return override && manifest.name?.startsWith("@kirana-ui/")
    ? { ...manifest, version: override }
    : manifest
}
const workspace = read(path.join(root, "package.json")) as unknown as {
  workspaces: { catalog: Record<string, string> }
}

function files(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(directory, path.join(entry.parentPath, entry.name)))
}

/** `workspace:*` is the version this package is released with; `catalog:` the catalog's range. */
function resolved(dependencies: Record<string, string> | undefined, version: string) {
  if (!dependencies) return undefined
  return Object.fromEntries(
    Object.entries(dependencies).map(([name, range]) => {
      if (range.startsWith("workspace:")) return [name, version]
      if (range === "catalog:") {
        const from = workspace.workspaces.catalog[name]
        if (!from) throw new Error(`${name} is not in the catalog`)
        return [name, from]
      }
      return [name, range]
    })
  )
}

const compiled = (source: string) => source.replace(/\.tsx?$/, ".js")
const declared = (source: string) => source.replace(/\.tsx?$/, ".d.ts")

type Exports = Manifest["exports"]

function staged(name: string) {
  const source = path.join(root, "packages", name)
  const stage = path.join(out, "stage", name)
  rmSync(stage, { recursive: true, force: true })
  mkdirSync(stage, { recursive: true })
  const manifest = read(path.join(source, "package.json"))
  const scripts = INSTALL_SCRIPTS.filter((each) => manifest.scripts?.[each])
  if (scripts.length) throw new Error(`${manifest.name} has ${scripts.join(", ")}: no package may`)
  return { source, stage, manifest }
}

const sources = (source: string) =>
  files(path.join(source, "src")).filter(
    (file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !file.endsWith(".d.ts")
  )

function run(command: string, args: string[], cwd: string) {
  const done = spawnSync(command, args, { cwd, encoding: "utf8" })
  if (done.status !== 0)
    throw new Error(`${command} ${args.join(" ")} failed\n${done.stdout}\n${done.stderr}`)
  return done.stdout
}

/** Writes the manifest a registry gets, checks every export is in the package, and packs it. */
function finish(
  name: string,
  stage: string,
  manifest: Manifest,
  exports: Exports,
  shipped: string[],
  extra: Partial<Manifest> = {}
): string {
  for (const file of ["README.md", "REFERENCE.md"]) {
    const from = path.join(root, "packages", name, file)
    if (existsSync(from)) cpSync(from, path.join(stage, file))
  }
  cpSync(path.join(root, "LICENSE"), path.join(stage, "LICENSE"))
  const { private: _private, devDependencies: _dev, scripts: _scripts, ...kept } = manifest
  const published: Manifest = {
    ...kept,
    homepage: "https://ui.kirana.style",
    repository: {
      type: "git",
      url: "git+https://github.com/kirana-style/primitives.git",
      directory: `packages/${name}`,
    },
    bugs: { url: "https://github.com/kirana-style/primitives/issues" },
    publishConfig: { access: "public" },
    files: [...shipped, "README.md", "REFERENCE.md", "LICENSE"],
    ...extra,
    exports: { ...exports, "./package.json": "./package.json" },
    dependencies: resolved(manifest.dependencies, manifest.version),
    peerDependencies: manifest.peerDependencies,
  }
  writeFileSync(path.join(stage, "package.json"), `${JSON.stringify(published, null, 2)}\n`)

  // Every export names files that are there, and no TypeScript source is shipped as code.
  const named = (target: string | Record<string, unknown>): string[] =>
    typeof target === "string"
      ? [target]
      : Object.values(target).flatMap((each) => named(each as string | Record<string, unknown>))
  for (const [entry, target] of Object.entries(exports)) {
    for (const file of named(target)) {
      if (!existsSync(path.join(stage, file)))
        throw new Error(`${manifest.name} ${entry}: ${file} is not in the package`)
    }
  }
  const left = shipped
    .flatMap((directory) =>
      files(path.join(stage, directory)).map((file) => `${directory}/${file}`)
    )
    .filter((file) => /\.tsx?$/.test(file) && !file.endsWith(".d.ts"))
  if (left.length) throw new Error(`${manifest.name} ships source: ${left.join(", ")}`)

  const [{ filename, size, entryCount }] = JSON.parse(
    run("npm", ["pack", "--pack-destination", out, "--json"], stage)
  ) as [{ filename: string; size: number; entryCount: number }]
  console.log(
    `packed  ${manifest.name}  ${Object.keys(exports).length} exports, ${entryCount} files, ${(size / 1024).toFixed(1)} KB  ${filename}`
  )
  return filename
}

/** Plain TypeScript: compiled file for file, declarations and source maps beside the code. */
async function plain(name: string): Promise<string> {
  const { source, stage, manifest } = staged(name)
  const { build } = await import("vite-plus/pack")
  await build({
    config: false,
    cwd: source,
    entry: sources(source).map((file) => path.join("src", file)),
    unbundle: true,
    root: source,
    outDir: stage,
    clean: false,
    format: "esm",
    fixedExtension: false,
    platform: "neutral",
    target: "es2022",
    deps: { neverBundle: true },
    tsconfig: path.join(root, "tsconfig.pack.json"),
    dts: { tsconfig: path.join(root, "tsconfig.pack.json") },
    sourcemap: true,
    report: false,
    logLevel: "warn",
  })
  for (const file of files(path.join(source, "src")).filter((each) => each.endsWith(".json")))
    cpSync(path.join(source, "src", file), path.join(stage, "src", file))
  const exports: Exports = {}
  for (const [entry, target] of Object.entries(manifest.exports)) {
    if (typeof target !== "string") throw new Error(`${manifest.name} ${entry}: not a file`)
    exports[entry] = target.endsWith(".json")
      ? target
      : { types: declared(target), default: compiled(target) }
  }
  return finish(name, stage, manifest, exports, ["src"])
}

/**
 * Solid compiles JSX itself, differently for a browser and for a server, so a Solid library ships
 * three things: `src/`, the JSX with the types taken off, which a project's Solid plugin compiles
 * with its own settings (the `solid` condition); `dom/` and `server/`, compiled here, for a
 * project that has no such step; and `types/`.
 */
async function solid(): Promise<string> {
  const { source, stage, manifest } = staged("solid")
  const need = createRequire(path.join(source, "package.json"))
  const typescript = need("typescript") as {
    transpileModule(
      text: string,
      options: { compilerOptions: Record<string, unknown>; fileName: string }
    ): { outputText: string }
  }
  const babel = need("@babel/core") as {
    transformAsync(code: string, options: object): Promise<{ code: string } | null>
  }
  const preset = need.resolve("babel-preset-solid")
  const write = (file: string, text: string) => {
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, text)
  }
  for (const file of sources(source)) {
    const jsx = file.endsWith(".tsx")
    // The types off, the JSX left, and `./x.tsx` named `./x.jsx` (TypeScript's enums by number:
    // JSX preserved, ES2022, ES modules).
    const code = typescript.transpileModule(readFileSync(path.join(source, "src", file), "utf8"), {
      fileName: file,
      compilerOptions: {
        jsx: 1,
        target: 9,
        module: 99,
        verbatimModuleSyntax: true,
        rewriteRelativeImportExtensions: true,
      },
    }).outputText
    const emitted = file.replace(/\.tsx$/, ".jsx").replace(/\.ts$/, ".js")
    write(path.join(stage, "src", emitted), code)
    for (const [directory, generate] of [
      ["dom", "dom"],
      ["server", "ssr"],
    ] as const) {
      const built = jsx
        ? (await babel.transformAsync(code, {
            filename: emitted,
            babelrc: false,
            configFile: false,
            presets: [[preset, { generate, hydratable: true }]],
          }))!.code
        : code
      write(
        path.join(stage, directory, emitted.replace(/\.jsx$/, ".js")),
        // A compiled file imports compiled files.
        built.replace(/(from\s*["'])(\.{1,2}\/[^"']+)\.jsx(["'])/g, "$1$2.js$3")
      )
    }
  }
  run(
    path.join(source, "node_modules/.bin/tsc"),
    ["-p", "tsconfig.pack.json", "--outDir", path.join(stage, "types")],
    source
  )
  const exports: Exports = {}
  for (const [entry, target] of Object.entries(manifest.exports)) {
    if (typeof target !== "string") throw new Error(`${manifest.name} ${entry}: not a file`)
    const file = target.replace(/^\.\/src\//, "")
    const built = compiled(file)
    exports[entry] = {
      types: `./types/${declared(file)}`,
      solid: `./src/${file.replace(/\.tsx$/, ".jsx").replace(/\.ts$/, ".js")}`,
      // Where there is no browser: Node, Deno, a worker.
      node: `./server/${built}`,
      deno: `./server/${built}`,
      worker: `./server/${built}`,
      default: `./dom/${built}`,
    }
  }
  return finish("solid", stage, manifest, exports, ["src", "dom", "server", "types"])
}

/**
 * Svelte's own packager: `.svelte` files go as they are, with a `.svelte.d.ts` each; `.ts` files
 * are compiled. It leaves the `.ts` in an import's path, which names no file once compiled.
 */
function svelte(): string {
  const { source, stage, manifest } = staged("svelte")
  run(
    path.join(source, "node_modules/.bin/svelte-package"),
    ["--input", "src", "--output", path.join(stage, "src"), "--tsconfig", "tsconfig.json"],
    source
  )
  // The packager's working folder, which it leaves in the package.
  rmSync(path.join(source, ".svelte-kit"), { recursive: true, force: true })
  for (const file of files(path.join(stage, "src"))) {
    if (/\.test\.(js|d\.ts)$/.test(file)) {
      rmSync(path.join(stage, "src", file))
      continue
    }
    const at = path.join(stage, "src", file)
    const text = readFileSync(at, "utf8")
    const renamed = text.replace(
      /((?:from|import)\s*\(?\s*["'])(\.{1,2}\/[^"']+)\.ts(["'])/g,
      "$1$2.js$3"
    )
    if (renamed !== text) writeFileSync(at, renamed)
  }
  const exports: Exports = {}
  for (const [entry, target] of Object.entries(manifest.exports)) {
    const file = typeof target === "string" ? target : target.default!
    exports[entry] = { types: declared(file), svelte: compiled(file), default: compiled(file) }
  }
  return finish("svelte", stage, manifest, exports, ["src"], { svelte: "./src/index.js" })
}

/**
 * Angular's packager, in partial-compilation mode: the directives are compiled as far as a
 * library may be and finished by the project's own Angular. It writes one flat module with its
 * declarations and the manifest's `exports` for them; the core is read from its packed
 * declarations (`tsconfig.pack.json`'s paths), so it is packed first.
 */
function angular(): string {
  const { source, stage, manifest } = staged("angular")
  const build = path.join(out, "stage", "angular-build")
  rmSync(build, { recursive: true, force: true })
  writeFileSync(
    path.join(source, "ng-package.json"),
    `${JSON.stringify(
      {
        dest: path.relative(source, build),
        lib: { entryFile: "src/index.ts" },
        // The core is a dependency, at the same version: an adapter is only right for its core.
        allowedNonPeerDependencies: ["@kirana-ui/core", "tslib"],
      },
      null,
      2
    )}\n`
  )
  try {
    run(
      path.join(source, "node_modules/.bin/ng-packagr"),
      ["-p", "ng-package.json", "-c", "tsconfig.pack.json"],
      source
    )
  } finally {
    rmSync(path.join(source, "ng-package.json"))
  }
  const written = read(path.join(build, "package.json"))
  for (const directory of ["fesm2022", "types"])
    cpSync(path.join(build, directory), path.join(stage, directory), { recursive: true })
  rmSync(build, { recursive: true, force: true })
  const { "./package.json": _own, ...exports } = written.exports
  return finish("angular", stage, manifest, exports, ["fesm2022", "types"], {
    module: written.module,
    typings: written.typings,
  })
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
for (const name of PLAIN) await plain(name)
await solid()
svelte()
angular()

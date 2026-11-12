/**
 * Packs the packages the way they would be published, without publishing them.
 *
 *   bun scripts/pack.ts            # into dist-packages/
 *
 * The workspace keeps reading TypeScript source. Each package is compiled in a staging copy, file
 * for file (no bundle: an entry per component stays a file per component, and an import of
 * another package stays an import), with its declarations beside the code; its manifest is
 * rewritten to name the compiled files and real versions; then `npm pack` makes the tarball.
 * Every export is then checked: its code and its declarations are in the tarball's files.
 *
 * Packed so far: the core, the vocabulary, React and Vue. Svelte ships its components as source
 * (`svelte-package`), Solid its JSX beside a compiled copy, and Angular is built by Angular's own
 * packager: each has its own step to come.
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
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const out = path.join(root, "dist-packages")
const PACKED = ["core", "vocabulary", "react", "vue"]
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

const read = (file: string) => JSON.parse(readFileSync(file, "utf8")) as Manifest
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

async function pack(name: string): Promise<string> {
  const source = path.join(root, "packages", name)
  const stage = path.join(out, "stage", name)
  rmSync(stage, { recursive: true, force: true })
  mkdirSync(stage, { recursive: true })

  const manifest = read(path.join(source, "package.json"))
  const scripts = INSTALL_SCRIPTS.filter((each) => manifest.scripts?.[each])
  if (scripts.length) throw new Error(`${manifest.name} has ${scripts.join(", ")}: no package may`)

  const inputs = files(path.join(source, "src"))
    .filter(
      (file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !file.endsWith(".d.ts")
    )
    .map((file) => path.join("src", file))
  const { build } = await import("vite-plus/pack")
  await build({
    config: false,
    cwd: source,
    entry: inputs,
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
  // What is not compiler output: data, and the package's own pages.
  for (const file of files(path.join(source, "src")).filter((each) => each.endsWith(".json")))
    cpSync(path.join(source, "src", file), path.join(stage, "src", file))
  for (const file of ["README.md", "REFERENCE.md"])
    if (existsSync(path.join(source, file))) cpSync(path.join(source, file), path.join(stage, file))
  cpSync(path.join(root, "LICENSE"), path.join(stage, "LICENSE"))

  const exports: Manifest["exports"] = {}
  for (const [entry, target] of Object.entries(manifest.exports)) {
    if (typeof target !== "string") throw new Error(`${manifest.name} ${entry}: not a file`)
    exports[entry] = target.endsWith(".json")
      ? target
      : { types: declared(target), default: compiled(target) }
  }
  exports["./package.json"] = "./package.json"
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
    files: ["src", "README.md", "REFERENCE.md", "LICENSE"],
    exports,
    dependencies: resolved(manifest.dependencies, manifest.version),
    peerDependencies: manifest.peerDependencies,
  }
  writeFileSync(path.join(stage, "package.json"), `${JSON.stringify(published, null, 2)}\n`)

  // Every export names code and declarations that are there, and nothing still names source.
  for (const [entry, target] of Object.entries(exports)) {
    for (const file of typeof target === "string" ? [target] : Object.values(target)) {
      if (!existsSync(path.join(stage, file)))
        throw new Error(`${manifest.name} ${entry}: ${file} is not in the package`)
    }
  }
  const left = files(path.join(stage, "src")).filter(
    (file) => /\.tsx?$/.test(file) && !file.endsWith(".d.ts")
  )
  if (left.length) throw new Error(`${manifest.name} ships source: ${left.join(", ")}`)

  const packed = spawnSync("npm", ["pack", "--pack-destination", out, "--json"], {
    cwd: stage,
    encoding: "utf8",
  })
  if (packed.status !== 0) throw new Error(`${manifest.name}: npm pack failed\n${packed.stderr}`)
  const [{ filename, size, entryCount }] = JSON.parse(packed.stdout) as [
    { filename: string; size: number; entryCount: number },
  ]
  console.log(
    `packed  ${manifest.name}  ${Object.keys(exports).length - 1} exports, ${entryCount} files, ${(size / 1024).toFixed(1)} KB  ${filename}`
  )
  return filename
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
for (const name of PACKED) await pack(name)

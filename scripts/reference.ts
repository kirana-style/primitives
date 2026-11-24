/**
 * What each adapter's own source says of every part: the element it draws, its own props with
 * their types and comments, and what its framework adds (emits, bindables, a slot's props, a
 * directive's selector). Read with TypeScript's own API from the files a project imports, so
 * `scripts/llms.ts` writes what the packages hold and `scripts/parity.ts` compares it.
 *
 *   React, Vue, Solid   each part `X` of an entry exports `XProps`; the type checker is asked
 *                       for its properties, and those declared in this repository are its own
 *   Svelte              the same from `<component>/types.ts`; a bindable is a `$bindable()`
 *   Angular             a directive's `input()`, `model()` and `output()` members
 *   custom elements     `defineElement({ tag, props, changes, parts })`
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join, relative } from "node:path"

import type * as TS from "../fixtures/angular/node_modules/typescript"

export const ROOT = join(import.meta.dirname, "..")
const readText = (path: string) => readFileSync(join(ROOT, path), "utf8")

// The workspace's TypeScript 7 has no JavaScript API; the Angular fixture's own TypeScript has.
export const ts = createRequire(join(ROOT, "fixtures/angular/package.json"))(
  "typescript"
) as typeof TS

export const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
/** A file's name as a component's: `date-field.tsx` is `DateField`. */
const pascal = (file: string) =>
  file
    .replace(/^.*\//, "")
    .replace(/\.tsx?$/, "")
    .replace(/(^|-)([a-z])/g, (_whole, _dash, letter: string) => letter.toUpperCase())
export const camel = (name: string) => name[0]!.toLowerCase() + name.slice(1)
export const oneLine = (text: string) => text.replace(/\s+/g, " ").trim()

export interface Prop {
  name: string
  optional: boolean
  type: string
  doc: string
  /** Where it is declared, for a message: `packages/react/src/tabs.tsx:71`. */
  at: string
  /** What it is in its framework, when not a plain prop. */
  kind?: "model" | "output" | "emit" | "bindable"
  /** A default the source states in code (Angular's `input(false)`). */
  initial?: string
  /** Angular: the class member behind an input written under another name (`alias`). */
  member?: string
}

/** A named type a prop's type mentions, and where it is declared. */
export interface Named {
  name: string
  /** The repository's own file, or `undefined` for the platform's or a framework's. */
  file: string | undefined
  declaration: TS.Declaration | undefined
  checker: TS.TypeChecker
}

export interface PartReference {
  component: string
  /** As React names it: `Root`, `Trigger`; a component of one part is `Root`. */
  part: string
  /** The element it draws: a tag, `null` for none, `undefined` where the caller's own is the element. */
  element: string | null | undefined
  /** The comment on its props type. */
  doc: string
  /** Its type parameters, as written: `Value = unknown`. */
  generics: string[]
  props: Prop[]
  /** It takes the positioner's options, listed once. */
  positioner: boolean
  /** Vue: what its default slot is given beside `state`. */
  slot?: Prop[]
  /** Svelte: what its `child` snippet is given beside `props` and `state`. */
  held?: string[]
  /** Angular: the directive. */
  directive?: {
    name: string
    selector: string
    exportAs: string | undefined
    structural: boolean
    /** A structural directive that is also written as a plain attribute (`kpAvatarImage`). */
    attribute: boolean
    /** What a structural directive hands its template: `let segment`. */
    context: Prop[]
  }
  /** Every named type its props mention. */
  types: Named[]
  /** Where its props type is written, and by what name: a part borrowed from another component says that one's. */
  declared?: { file: string; name: string }
  /** The file its entry takes the props type from, when it is another's: `./popover.tsx`. */
  from?: string
}

export interface ComponentReference {
  name: string
  /** The entry it is imported from: `./tabs`, or `.`. */
  entry: string
  /** It is one part, written as the component itself: `<Button>`. */
  lone: boolean
  parts: PartReference[]
}

export interface AdapterReference {
  adapter: string
  components: Map<string, ComponentReference>
  /** The positioner's options every positioner takes. */
  positioner: Prop[]
  /** The named types those options mention. */
  positionerTypes: Named[]
  /** Every exported name of every public entry: `./tabs` → names, each a value or a type. */
  exports: Map<string, Map<string, "value" | "type">>
  /** Asks about a type by name, in an entry. */
  program: TS.Program
}

const OPTIONS: TS.CompilerOptions = {
  target: 9,
  module: 99,
  moduleResolution: 100,
  strict: true,
  allowImportingTsExtensions: true,
  noEmit: true,
  skipLibCheck: true,
  lib: ["lib.es2023.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  types: [],
}

const JSX: Record<string, TS.CompilerOptions> = {
  react: { jsx: 4 },
  solid: { jsx: 1, jsxImportSource: "@solidjs/web" },
  angular: { experimentalDecorators: true, useDefineForClassFields: false },
}

/** A package's public entries: `./tabs` → its source file. */
export function entries(adapter: string): Map<string, string> {
  const manifest = JSON.parse(readText(`packages/${adapter}/package.json`)) as {
    exports: Record<string, string | { default: string }>
  }
  const found = new Map<string, string>()
  for (const [entry, target] of Object.entries(manifest.exports)) {
    const file = typeof target === "string" ? target : target.default
    found.set(entry, join(ROOT, "packages", adapter, file))
  }
  return found
}

const programs = new Map<string, TS.Program>()

/** One program per adapter, over its public entries. */
export function programOf(adapter: string): TS.Program {
  let made = programs.get(adapter)
  if (!made) {
    made = ts.createProgram([...entries(adapter).values()], { ...OPTIONS, ...JSX[adapter] })
    programs.set(adapter, made)
  }
  return made
}

const place = (node: TS.Node) => {
  const source = node.getSourceFile()
  const { line } = source.getLineAndCharacterOfPosition(node.getStart())
  return `${relative(ROOT, source.fileName)}:${line + 1}`
}

const ours = (file: string) =>
  file.startsWith(join(ROOT, "packages")) && !file.includes("/node_modules/")

/** A symbol's comment as one line. */
export function docOf(symbol: TS.Symbol | undefined, checker: TS.TypeChecker): string {
  if (!symbol) return ""
  return oneLine(ts.displayPartsToString(symbol.getDocumentationComment(checker)))
}

/** The declaration around a member: the interface or the type alias it is written in. */
function around(node: TS.Node): string | undefined {
  let at: TS.Node | undefined = node.parent
  while (at) {
    if (ts.isInterfaceDeclaration(at) || ts.isTypeAliasDeclaration(at)) return at.name.text
    if (ts.isClassDeclaration(at)) return at.name?.text
    at = at.parent
  }
  return undefined
}

/** A type as it is written, without the `undefined` an optional prop carries. */
const asWritten = (text: string) =>
  oneLine(text)
    .replace(/^\| /, "")
    .replace(/ \| undefined$/, "")
    .replace(/^\((.*=>.*)\)$/, (whole, inner: string) =>
      // The brackets around a function that was a union with `undefined`.
      balanced(inner) ? inner : whole
    )

function balanced(text: string): boolean {
  let depth = 0
  for (const letter of text) {
    if (letter === "(") depth++
    if (letter === ")" && --depth < 0) return false
  }
  return depth === 0
}

/**
 * What every part of a framework takes, declared once in its runtime: named in each file's
 * "Using it", not listed with every part.
 */
const SHARED = new Set([
  "PartComponentProps",
  "Composition",
  "PartAttributes",
  "ElementAttributes",
  "PartGiven",
  "Listeners",
])

/** Where a positioner's options are declared: the core's, and each adapter's own type of them. */
function positioning(container: string | undefined, file: string): boolean {
  if (!container) return false
  if (container === "PositionOptions" || container === "PositionerOptions") return true
  if (container === "Placement") return true
  if (container === "KpPositioner") return true
  // Vue's are the popover's positioner's props, which every other positioner's extend.
  return container === "PositionerProps" && file.endsWith("/packages/vue/src/popover.ts")
}

/** How many interfaces of this repository an interface extends, one over another: a base is 0. */
function heritageDepth(node: TS.Node, checker: TS.TypeChecker, seen = new Set<TS.Node>()): number {
  let at: TS.Node | undefined = node
  while (at && !ts.isInterfaceDeclaration(at)) at = at.parent
  if (!at || seen.has(at)) return 0
  seen.add(at)
  let most = 0
  for (const clause of at.heritageClauses ?? []) {
    for (const each of clause.types) {
      let symbol = checker.getSymbolAtLocation(each.expression)
      if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
      const base = symbol?.declarations?.[0]
      if (base) most = Math.max(most, 1 + heritageDepth(base, checker, seen))
    }
  }
  return most
}

/** Every named type a type node mentions, resolved where it is written. */
function mentioned(node: TS.Node | undefined, checker: TS.TypeChecker, into: Named[]): void {
  if (!node) return
  const visit = (each: TS.Node) => {
    if (ts.isTypeReferenceNode(each) || ts.isExpressionWithTypeArguments(each)) {
      const named = ts.isTypeReferenceNode(each) ? each.typeName : each.expression
      const name = named.getText()
      let symbol = checker.getSymbolAtLocation(named)
      if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
      const declaration = symbol?.declarations?.[0]
      const file = declaration?.getSourceFile().fileName
      into.push({
        name,
        file: file && ours(file) ? relative(ROOT, file) : undefined,
        declaration:
          declaration && ts.isTypeParameterDeclaration(declaration) ? undefined : declaration,
        checker,
      })
    }
    ts.forEachChild(each, visit)
  }
  visit(node)
}

interface Read {
  props: Prop[]
  positioner: boolean
  types: Named[]
}

/** A part's content as any element has it: said once, not per part. (An `id`: `withIds`.) */
function plain(name: string, type: string): boolean {
  if (name === "children") return !type.includes("=>") && !/Snippet<\[/.test(type)
  return false
}

/**
 * A props type's own properties: those declared in this repository, in the order they are
 * written, with the type as written and the comment. The positioner's options are counted,
 * not listed.
 */
export function ownProps(type: TS.Type, checker: TS.TypeChecker): Read {
  const props: (Prop & { order: [number, number, string, number] })[] = []
  const types: Named[] = []
  let positioner = false
  for (const symbol of checker.getPropertiesOfType(type)) {
    const declaration = symbol.declarations?.[0]
    if (!declaration) continue
    const file = declaration.getSourceFile().fileName
    if (!ours(file)) continue
    const container = around(declaration)
    if (container && SHARED.has(container)) continue
    if (positioning(container, file)) {
      positioner = true
      continue
    }
    const node = propertyType(
      ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration)
        ? declaration.type
        : undefined,
      checker
    )
    const text = asWritten(
      node
        ? node.getText()
        : checker.typeToString(
            checker.getTypeOfSymbol(symbol),
            undefined,
            ts.TypeFormatFlags.NoTruncation
          )
    )
    if (plain(symbol.name, text)) continue
    mentioned(node, checker, types)
    props.push({
      name: symbol.name,
      optional: Boolean(symbol.flags & ts.SymbolFlags.Optional),
      type: text,
      doc: docOf(symbol, checker),
      at: place(declaration),
      // The core's before an adapter's own, each in the order it is written.
      // The core's before an adapter's own, what is extended before what extends it, and each
      // in the order it is written.
      order: [
        file.includes("/packages/core/") ? 0 : 1,
        heritageDepth(declaration, checker),
        file,
        declaration.getStart(),
      ],
    })
  }
  props.sort(
    (a, b) =>
      a.order[0] - b.order[0] ||
      a.order[1] - b.order[1] ||
      a.order[2].localeCompare(b.order[2]) ||
      a.order[3] - b.order[3]
  )
  return { props: props.map(({ order: _order, ...each }) => each), positioner, types }
}

/** An entry's exported symbol by name, an alias followed to what it names. */
export function exported(program: TS.Program, file: string, name: string): TS.Symbol | undefined {
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(file)
  const module = source && checker.getSymbolAtLocation(source)
  if (!module) return undefined
  const symbol = checker.getExportsOfModule(module).find((each) => each.name === name)
  if (!symbol) return undefined
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
}

/** Every exported name of an entry, and whether it is there when the page runs. */
export function exportsOf(program: TS.Program, file: string): Map<string, "value" | "type"> {
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(file)
  const module = source && checker.getSymbolAtLocation(source)
  const found = new Map<string, "value" | "type">()
  if (!module) return found
  for (const each of checker.getExportsOfModule(module)) {
    const symbol = each.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(each) : each
    // A `.svelte` file is not a module TypeScript reads: its default export is a component.
    const unresolved = symbol.flags === ts.SymbolFlags.None || symbol.name === "unknown"
    found.set(each.name, unresolved || symbol.flags & ts.SymbolFlags.Value ? "value" : "type")
  }
  return found
}

/** React's components and their parts, in the order written, which every adapter has. */
export async function components(): Promise<Map<string, string[]>> {
  const module = (await import(join(ROOT, "packages/react/src/index.ts"))) as Record<
    string,
    unknown
  >
  const known = entries("react")
  const found = new Map<string, string[]>()
  for (const [name, value] of Object.entries(module).sort(([a], [b]) => a.localeCompare(b))) {
    if (!/^[A-Z]/.test(name) || !known.has(`./${kebab(name)}`)) continue
    found.set(name, typeof value === "object" && value !== null ? Object.keys(value) : [])
  }
  return found
}

/** The tag in a props type's own text: `PartComponentProps<"button", …>`. */
const TAG = /\b(?:PartComponentProps|PartAttributes)<\s*"([a-z0-9]+)"/

/** A type alias's declaration followed through plain renames to the one that says something. */
function declarationOf(symbol: TS.Symbol, checker: TS.TypeChecker): TS.Declaration | undefined {
  let declaration = symbol.declarations?.[0]
  for (let turn = 0; turn < 5 && declaration; turn++) {
    if (!ts.isTypeAliasDeclaration(declaration) || !ts.isTypeReferenceNode(declaration.type)) break
    const next = checker.getSymbolAtLocation(declaration.type.typeName)
    const to = next && next.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(next) : next
    const target = to?.declarations?.[0]
    if (
      !target ||
      !ours(target.getSourceFile().fileName) ||
      !(ts.isTypeAliasDeclaration(target) || ts.isInterfaceDeclaration(target)) ||
      !target.name.text.endsWith("Props") ||
      SHARED.has(target.name.text)
    )
      break
    declaration = target
  }
  return declaration
}

/** A tag that is the part's own type parameter (`As extends "input" | "textarea" = "input"`): its default. */
function chosenTag(text: string, declaration: TS.Declaration | undefined): string | undefined {
  const parameter = /\b(?:PartComponentProps|PartAttributes)<\s*([A-Z]\w*)\s*,/.exec(text)?.[1]
  if (!parameter) return undefined
  const found = genericsOf(declaration).find((each) => each.startsWith(`${parameter} `))
  return found && /=\s*"([a-z0-9]+)"$/.exec(found)?.[1]
}

const genericsOf = (declaration: TS.Declaration | undefined) =>
  declaration && (ts.isTypeAliasDeclaration(declaration) || ts.isInterfaceDeclaration(declaration))
    ? (declaration.typeParameters ?? []).map((each) => oneLine(each.getText()))
    : []

/**
 * A part of a typed adapter (React, Solid, Svelte, Vue) from its exported props type. `tagged`
 * reads the element from the type's own text; Vue's is on its component, read by its caller.
 */
function typedPart(
  adapter: string,
  component: string,
  part: string,
  lone: boolean,
  file: string
): PartReference | undefined {
  const program = programOf(adapter)
  const checker = program.getTypeChecker()
  const symbol = exported(program, file, lone ? `${component}Props` : `${part}Props`)
  if (!symbol) return undefined
  const type = checker.getDeclaredTypeOfSymbol(symbol)
  const declaration = declarationOf(symbol, checker)
  // `export type { PortalProps } from "./popover.tsx"`: the part is that component's.
  const source = program.getSourceFile(file)!
  const specifier = checker
    .getExportsOfModule(checker.getSymbolAtLocation(source)!)
    .find((each) => each.name === (lone ? `${component}Props` : `${part}Props`))?.declarations?.[0]
  const hop =
    specifier && ts.isExportSpecifier(specifier) && specifier.parent.parent.moduleSpecifier
      ? specifier.parent.parent.moduleSpecifier.getText().slice(1, -1)
      : undefined
  const text = declaration?.getText() ?? ""
  const { props, positioner, types } = ownProps(type, checker)
  return {
    component,
    part,
    element: TAG.exec(text)?.[1] ?? chosenTag(text, declaration) ?? null,
    doc:
      docOf(symbol, checker) ||
      docOf(
        declaration && checker.getSymbolAtLocation((declaration as TS.TypeAliasDeclaration).name),
        checker
      ),
    generics: genericsOf(symbol.declarations?.[0]),
    props,
    positioner,
    types,
    ...(declaration &&
    (ts.isTypeAliasDeclaration(declaration) || ts.isInterfaceDeclaration(declaration))
      ? { declared: { file: declaration.getSourceFile().fileName, name: declaration.name.text } }
      : {}),
    ...(hop ? { from: hop } : {}),
  }
}

/** The positioner's options as an adapter types them: its runtime's `PositionerProps`. */
function positionerOf(
  adapter: string,
  file: string,
  name: string
): { positioner: Prop[]; positionerTypes: Named[] } {
  const program = programOf(adapter)
  const checker = program.getTypeChecker()
  const symbol = exported(program, file, name)
  const positionerTypes: Named[] = []
  if (!symbol) return { positioner: [], positionerTypes }
  const found: Prop[] = []
  for (const each of checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(symbol))) {
    const declaration = each.declarations?.[0]
    const container = declaration && around(declaration)
    if (!declaration || !positioning(container, declaration.getSourceFile().fileName)) continue
    const node = ts.isPropertySignature(declaration) ? declaration.type : undefined
    mentioned(node, checker, positionerTypes)
    found.push({
      name: each.name,
      optional: true,
      type: asWritten(node?.getText() ?? "unknown"),
      doc: docOf(each, checker),
      at: place(declaration),
    })
  }
  return {
    positioner: found.sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name)),
    positionerTypes,
  }
}

const ORDER = [
  "side",
  "align",
  "sideOffset",
  "alignOffset",
  "collisionPadding",
  "collisionBoundary",
  "collisionAvoidance",
  "sticky",
  "arrowPadding",
  "positionMethod",
  "anchor",
]

function exportsOfAdapter(adapter: string): Map<string, Map<string, "value" | "type">> {
  const program = programOf(adapter)
  const found = new Map<string, Map<string, "value" | "type">>()
  for (const [entry, file] of entries(adapter)) found.set(entry, exportsOf(program, file))
  return found
}

/** React and Solid: a part's props type says its element. */
async function jsx(adapter: "react" | "solid"): Promise<AdapterReference> {
  const all = await components()
  const files = entries(adapter)
  const found = new Map<string, ComponentReference>()
  for (const [name, parts] of all) {
    const entry = `./${kebab(name)}`
    const file = files.get(entry)
    // An adapter without the entry has no such component: `scripts/llms.ts` says so.
    if (!file) continue
    const lone = parts.length === 0
    const read = (lone ? ["Root"] : parts).map((part) => typedPart(adapter, name, part, lone, file))
    found.set(name, { name, entry, lone, parts: read.filter((each) => each !== undefined) })
  }
  return {
    adapter,
    components: found,
    ...positionerOf(
      adapter,
      files.get(adapter === "react" ? "./runtime" : "./popover")!,
      "PositionerProps"
    ),
    exports: exportsOfAdapter(adapter),
    program: programOf(adapter),
  }
}

/** What a snippet or a slot is given: the properties of a function's first parameter. */
function given(type: TS.Type | undefined, checker: TS.TypeChecker): TS.Symbol[] {
  if (!type) return []
  const held = checker.getNonNullableType(type)
  const signature = held.getCallSignatures()[0]
  const parameter = signature?.getParameters()[0]
  if (!parameter) return []
  return checker.getPropertiesOfType(checker.getTypeOfSymbol(parameter))
}

/** Svelte: types in `<component>/types.ts`, a bindable in the part's `.svelte` file. */
async function svelte(): Promise<AdapterReference> {
  const all = await components()
  const files = entries("svelte")
  const program = programOf("svelte")
  const checker = program.getTypeChecker()
  const found = new Map<string, ComponentReference>()
  for (const [name, parts] of all) {
    const entry = `./${kebab(name)}`
    const file = files.get(entry)
    // An adapter without the entry has no such component: `scripts/llms.ts` says so.
    if (!file) continue
    const lone = parts.length === 0
    const folder = join(dirname(file), kebab(name))
    const index = existsSync(join(folder, "index.ts"))
      ? readFileSync(join(folder, "index.ts"), "utf8")
      : readFileSync(file, "utf8")
    const read: PartReference[] = []
    for (const part of lone ? ["Root"] : parts) {
      const made = typedPart("svelte", name, part, lone, file)
      if (!made) continue
      // The component's own file, wherever the part is borrowed from.
      const from = new RegExp(
        `default as ${lone ? name : part}\\s*\\}\\s*from\\s*"([^"]+\\.svelte)"`
      ).exec(index)?.[1]
      const source = from
        ? join(existsSync(join(folder, "index.ts")) ? folder : dirname(file), from)
        : undefined
      const text = source && existsSync(source) ? readFileSync(source, "utf8") : ""
      for (const [, bound] of text.matchAll(/(\w+)\s*=\s*\$bindable\(/g)) {
        const prop = made.props.find((each) => each.name === bound)
        if (prop) prop.kind = "bindable"
      }
      // What `child` is given beside the part's props and state.
      const symbol = exported(program, file, lone ? `${name}Props` : `${part}Props`)!
      const child = checker
        .getPropertiesOfType(checker.getDeclaredTypeOfSymbol(symbol))
        .find((each) => each.name === "child")
      const snippet = child && checker.getNonNullableType(checker.getTypeOfSymbol(child))
      const tuple = snippet && checker.getTypeArguments(snippet as TS.TypeReference)[0]
      const first = tuple && checker.getTypeArguments(tuple as TS.TypeReference)[0]
      made.held = first
        ? checker
            .getPropertiesOfType(first)
            .map((each) => each.name)
            .filter((each) => each !== "props" && each !== "state")
        : []
      read.push(made)
    }
    found.set(name, { name, entry, lone, parts: read })
  }
  return {
    adapter: "svelte",
    components: found,
    ...positionerOf("svelte", files.get("./runtime")!, "PositionerProps"),
    exports: exportsOfAdapter("svelte"),
    program,
  }
}

/** Vue: the element and the slot are on the component's own type; emits are `XEmits`. */
async function vue(): Promise<AdapterReference> {
  const all = await components()
  const files = entries("vue")
  const program = programOf("vue")
  const checker = program.getTypeChecker()
  const found = new Map<string, ComponentReference>()
  for (const [name, parts] of all) {
    const entry = `./${kebab(name)}`
    const file = files.get(entry)
    // An adapter without the entry has no such component: `scripts/llms.ts` says so.
    if (!file) continue
    const lone = parts.length === 0
    const namespace = exported(program, file, name)
    const read: PartReference[] = []
    for (const part of lone ? ["Root"] : parts) {
      const made = typedPart("vue", name, part, lone, file)
      if (!made) continue
      const value =
        namespace &&
        (lone
          ? checker.getTypeOfSymbol(namespace)
          : (() => {
              const property = checker.getTypeOfSymbol(namespace).getProperty(part)
              return property && checker.getTypeOfSymbol(property)
            })())
      const signature = value?.getConstructSignatures()[0]
      // The element a part draws is the default of its `As`: a component with none draws none.
      const as = signature?.getTypeParameters()?.find((each) => each.symbol.name === "As")
      const tag = as && checker.getDefaultFromTypeParameter(as)
      made.element = tag?.isStringLiteral() ? tag.value : null
      const instance = signature?.getReturnType()
      const slots = instance?.getProperty("$slots")
      const slot = slots && checker.getTypeOfSymbol(slots).getProperty("default")
      made.slot = given(slot && checker.getTypeOfSymbol(slot), checker)
        .filter((each) => each.name !== "state")
        .map((each) => {
          const declaration = each.declarations?.[0]
          const node =
            declaration && ts.isPropertySignature(declaration) ? declaration.type : undefined
          mentioned(node, checker, made.types)
          return {
            name: each.name,
            optional: false,
            type: asWritten(
              node?.getText() ??
                checker.typeToString(
                  checker.getTypeOfSymbol(each),
                  undefined,
                  ts.TypeFormatFlags.NoTruncation
                )
            ),
            doc: docOf(each, checker),
            at: declaration ? place(declaration) : "",
          }
        })
      const emits = exported(program, file, lone ? `${name}Emits` : `${part}Emits`)
      if (emits) {
        const declaration = emits.declarations?.[0]
        for (const each of checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(emits))) {
          const own = each.declarations?.[0]
          const node = own && ts.isPropertySignature(own) ? own.type : undefined
          mentioned(node, checker, made.types)
          made.props.push({
            name: each.name,
            optional: true,
            type: asWritten(
              node?.getText() ??
                checker.typeToString(
                  checker.getTypeOfSymbol(each),
                  declaration,
                  ts.TypeFormatFlags.NoTruncation
                )
            ),
            doc: docOf(each, checker),
            at: declaration ? place(declaration) : "",
            kind: "emit",
          })
        }
        if (declaration && ts.isTypeAliasDeclaration(declaration))
          mentioned(declaration.type, checker, made.types)
      }
      read.push(made)
    }
    found.set(name, { name, entry, lone, parts: read })
  }
  return {
    adapter: "vue",
    components: found,
    ...positionerOf("vue", files.get("./popover")!, "PositionerProps"),
    exports: exportsOfAdapter("vue"),
    program,
  }
}

export interface Directive {
  name: string
  file: string
  selector: string
  exportAs: string | undefined
  structural: boolean
  /** A structural directive that is also written as a plain attribute: its template optional. */
  attribute: boolean
  doc: string
  generics: string[]
  props: Prop[]
  context: Prop[]
  types: Named[]
  positioner: boolean
}

const SIGNALS: Record<string, Prop["kind"] | "input"> = {
  InputSignal: "input",
  InputSignalWithTransform: "input",
  ModelSignal: "model",
  OutputEmitterRef: "output",
}

/** An indexed type (`Props["placeholders"]`) as the property it names is written. */
function propertyType(
  node: TS.TypeNode | undefined,
  checker: TS.TypeChecker
): TS.TypeNode | undefined {
  if (!node || !ts.isIndexedAccessTypeNode(node)) return node
  const index = node.indexType
  if (!ts.isLiteralTypeNode(index) || !ts.isStringLiteral(index.literal)) return node
  const property = checker.getTypeFromTypeNode(node.objectType).getProperty(index.literal.text)
  const declaration = property?.declarations?.[0]
  return declaration && ts.isPropertySignature(declaration) && declaration.type
    ? declaration.type
    : node
}

/** A directive's inputs, models and outputs, its own and those of what it extends. */
function signals(node: TS.ClassDeclaration, checker: TS.TypeChecker): Read {
  const type = checker.getDeclaredTypeOfSymbol(checker.getSymbolAtLocation(node.name!)!)
  const props: Prop[] = []
  const types: Named[] = []
  let positioner = false
  for (const member of checker.getPropertiesOfType(type)) {
    const declaration = member.declarations?.[0]
    if (!declaration || !ts.isPropertyDeclaration(declaration)) continue
    const held = checker.getTypeOfSymbol(member)
    const kind = SIGNALS[held.aliasSymbol?.name ?? held.symbol?.name ?? ""]
    if (!kind) continue
    const owner = declaration.parent
    // The inputs every positioner has, from the class they all extend: listed once.
    if (ts.isClassDeclaration(owner) && owner.name?.text === "KpPositioner") {
      positioner = true
      if (node.name!.text !== "KpPositioner") continue
    }
    const call = declaration.initializer
    const called = call && ts.isCallExpression(call) ? call : undefined
    const argument = propertyType(called?.typeArguments?.[0], checker)
    mentioned(argument, checker, types)
    const read = (held.aliasTypeArguments ?? checker.getTypeArguments(held as TS.TypeReference))[0]
    const required = Boolean(called?.expression.getText() === "input.required")
    const first = called?.arguments[0]
    const options = called?.arguments.at(-1)?.getText() ?? ""
    const alias = /alias:\s*"([^"]+)"/.exec(options)?.[1]
    // An id is `[kpId]` on every directive that takes one: said once, as `id` is elsewhere,
    // unless its comment says where it goes instead (`withIds`).
    if (member.name === "kpId" && !docOf(member, checker)) continue
    const initial =
      kind === "input" && !required && first && !ts.isObjectLiteralExpression(first)
        ? first.getText()
        : undefined
    props.push({
      name: alias ?? member.name,
      optional: !required,
      type: asWritten(
        argument?.getText() ??
          (read
            ? checker.typeToString(read, declaration, ts.TypeFormatFlags.NoTruncation)
            : "unknown")
      ),
      doc: docOf(member, checker),
      at: place(declaration),
      ...(kind === "input" ? {} : { kind }),
      ...(initial && initial !== "undefined" ? { initial } : {}),
      ...(alias ? { member: member.name } : {}),
    })
  }
  return { props, types, positioner }
}

/** Every exported directive of Angular's package, by class name. */
export function directives(): Map<string, Directive> {
  const program = programOf("angular")
  const checker = program.getTypeChecker()
  const found = new Map<string, Directive>()
  const directory = join(ROOT, "packages/angular/src")
  const index = program.getSourceFile(join(directory, "index.ts"))!
  const public_ = new Set(
    checker.getExportsOfModule(checker.getSymbolAtLocation(index)!).map((each) => each.name)
  )
  for (const file of readdirSync(directory).sort()) {
    const source = program.getSourceFile(join(directory, file))
    if (!source) continue
    ts.forEachChild(source, (node) => {
      if (!ts.isClassDeclaration(node) || !node.name || !public_.has(node.name.text)) return
      const decorator = (ts.getDecorators(node) ?? []).find((each) =>
        each.expression.getText().startsWith("Directive(")
      )
      if (!decorator) return
      const text = decorator.expression.getText()
      // The class every positioner extends has no selector of its own: its inputs are theirs.
      const selector = /selector:\s*"([^"]+)"/.exec(text)?.[1] ?? ""
      if (!selector && node.name.text !== "KpPositioner") return
      const body = node.getText()
      const { props, types, positioner } = signals(node, checker)
      // What a structural directive hands its template: its context guard's type.
      const context: Prop[] = []
      const guard = node.members.find(
        (each) => ts.isMethodDeclaration(each) && each.name.getText() === "ngTemplateContextGuard"
      )
      const guarded =
        guard && ts.isMethodDeclaration(guard) && guard.type && ts.isTypePredicateNode(guard.type)
          ? guard.type.type
          : undefined
      if (guarded) {
        mentioned(guarded, checker, types)
        for (const each of checker.getPropertiesOfType(checker.getTypeFromTypeNode(guarded))) {
          const declaration = each.declarations?.[0]
          const node_ =
            declaration && ts.isPropertySignature(declaration) ? declaration.type : undefined
          mentioned(node_, checker, types)
          context.push({
            name: each.name,
            optional: false,
            type: asWritten(
              node_?.getText() ??
                checker.typeToString(
                  checker.getTypeOfSymbol(each),
                  guard,
                  ts.TypeFormatFlags.NoTruncation
                )
            ),
            doc: docOf(each, checker),
            at: declaration ? place(declaration) : "",
          })
        }
      }
      found.set(node.name.text, {
        name: node.name.text,
        file: relative(ROOT, source.fileName),
        selector,
        exportAs: /exportAs:\s*"([^"]+)"/.exec(text)?.[1],
        structural:
          /\bpresentWhile\(|inject<TemplateRef<|inject\(TemplateRef|\beach<|\bscrollArrow\(/.test(
            body
          ),
        attribute: /\(TemplateRef,\s*\{\s*optional:\s*true,?\s*\}/.test(body),
        doc: docOf(checker.getSymbolAtLocation(node.name), checker),
        generics: (node.typeParameters ?? []).map((each) => oneLine(each.getText())),
        props,
        context,
        types,
        positioner,
      })
    })
  }
  return found
}

/** Angular: a part is a directive, `Kp<Component><Part>`; a component may be a selector of another's root. */
async function angular(): Promise<AdapterReference> {
  const all = await components()
  const every = directives()
  const theirs = await reference("react")
  const found = new Map<string, ComponentReference>()
  for (const [name, parts] of all) {
    const lone = parts.length === 0
    const read: PartReference[] = []
    for (const part of lone ? ["Root"] : parts) {
      const react = theirs.components.get(name)?.parts.find((each) => each.part === part)
      const borrowed = react?.declared
      const directive =
        (part === "Root" ? every.get(`Kp${name}`) : undefined) ??
        every.get(`Kp${name}${part}`) ??
        // A component made of another's directives is a selector of that one's root.
        (part === "Root"
          ? [...every.values()].find((each) => each.selector.split(/,\s*/).includes(`[kp${name}]`))
          : undefined) ??
        // A part React borrows from another component is that component's directive here.
        (react?.from ? every.get(`Kp${pascal(react.from)}${part}`) : undefined) ??
        (borrowed
          ? every.get(
              `Kp${pascal(borrowed.file)}${borrowed.name.replace(/Props$/, "").replace(/^Root$/, "")}`
            )
          : undefined)
      if (!directive) continue
      read.push({
        component: name,
        part,
        element: undefined,
        doc: directive.doc,
        generics: directive.generics,
        props: directive.props,
        positioner: directive.positioner,
        types: directive.types,
        directive: {
          name: directive.name,
          selector: directive.selector,
          exportAs: directive.exportAs,
          structural: directive.structural,
          attribute: directive.attribute,
          context: directive.context,
        },
      })
    }
    found.set(name, { name, entry: ".", lone, parts: read })
  }
  const positioner = every.get("KpPositioner")
  return {
    adapter: "angular",
    components: found,
    positioner: [...(positioner?.props ?? [])].sort(
      (a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name)
    ),
    positionerTypes: positioner?.types ?? [],
    exports: exportsOfAdapter("angular"),
    program: programOf("angular"),
  }
}

const references = new Map<string, Promise<AdapterReference>>()

/** An adapter's reference, read once. */
export function reference(adapter: string): Promise<AdapterReference> {
  let found = references.get(adapter)
  if (!found) {
    found = Promise.all([built(adapter), built("react")]).then(([own, react]) =>
      withIds(own, react)
    )
    references.set(adapter, found)
  }
  return found
}

/** Each adapter as its source has it, every `id` included. */
const read = new Map<string, Promise<AdapterReference>>()
function built(adapter: string): Promise<AdapterReference> {
  let found = read.get(adapter)
  if (!found) {
    found =
      adapter === "react" || adapter === "solid"
        ? jsx(adapter)
        : adapter === "svelte"
          ? svelte()
          : adapter === "vue"
            ? vue()
            : angular()
    read.set(adapter, found)
  }
  return found
}

/** An `id` written as a string, as any element's (`kpId` on Angular). */
const anId = (prop: Prop) =>
  (prop.name === "id" || prop.name === "kpId") && /^string( \| undefined)?$/.test(prop.type)

/**
 * An `id` goes on the part's element, as any element's does: said once, not per part. It is
 * listed where React's same part gives its `id` a comment, which says where it goes instead (a
 * checkbox's on its hidden input), so that every adapter lists the same ones.
 */
function withIds(own: AdapterReference, react: AdapterReference): AdapterReference {
  for (const component of own.components.values()) {
    for (const part of component.parts) {
      const theirs = react.components.get(component.name)?.parts.find((p) => p.part === part.part)
      if (!theirs?.props.some((each) => anId(each) && each.doc))
        part.props = part.props.filter((each) => !anId(each))
    }
  }
  return own
}

/** A named type as a reader needs it: what it is, its fields with their comments. */
export interface Described {
  name: string
  generics: string[]
  doc: string
  /** A union, a function, another type: as written. */
  text?: string
  /** An object's fields and methods, each as written. */
  members?: { text: string; doc: string }[]
  file: string
  /** Every file it is declared in, an alias that renames it included. */
  files: string[]
  /** The named types its own text mentions. */
  mentions: Named[]
}

/** An alias that only renames another of this repository's types (`Core.ToastRecord<Content>`) is that type. */
function renamed(declaration: TS.Declaration, checker: TS.TypeChecker): TS.Declaration | undefined {
  if (!ts.isTypeAliasDeclaration(declaration) || !ts.isTypeReferenceNode(declaration.type))
    return undefined
  let symbol = checker.getSymbolAtLocation(declaration.type.typeName)
  if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
  const target = symbol?.declarations?.[0]
  if (!target || !ours(target.getSourceFile().fileName)) return undefined
  if (!ts.isInterfaceDeclaration(target) && !ts.isTypeAliasDeclaration(target)) return undefined
  return target.name.text === declaration.name.text ? target : undefined
}

const member = (node: TS.Node) =>
  oneLine(node.getText())
    .replace(/[;,]$/, "")
    .replace(/^readonly /, "")
    .replace(/: \| /, ": ")
    // An optional member's `| undefined` says nothing more; a required one's does.
    .replace(/^(\w+\?:.*) \| undefined$/, "$1")

/** What a named type of this repository is, from where it is declared. */
export function describe(named: Named): Described | undefined {
  let declaration = named.declaration
  if (!declaration || !named.file) return undefined
  const { checker } = named
  const first = declaration
  const files = [relative(ROOT, declaration.getSourceFile().fileName)]
  for (let turn = 0; turn < 4; turn++) {
    const next = renamed(declaration, checker)
    if (!next) break
    declaration = next
    files.push(relative(ROOT, declaration.getSourceFile().fileName))
  }
  if (!ts.isInterfaceDeclaration(declaration) && !ts.isTypeAliasDeclaration(declaration))
    return undefined
  const mentions: Named[] = []
  const symbol = checker.getSymbolAtLocation(declaration.name)
  const doc =
    docOf(
      ts.isInterfaceDeclaration(first) || ts.isTypeAliasDeclaration(first)
        ? checker.getSymbolAtLocation(first.name)
        : undefined,
      checker
    ) || docOf(symbol, checker)
  const base = {
    name: named.name.replace(/^.*\./, ""),
    generics: genericsOf(first),
    doc,
    file: relative(ROOT, declaration.getSourceFile().fileName),
    files,
    mentions,
  }
  const literal =
    ts.isTypeAliasDeclaration(declaration) && ts.isTypeLiteralNode(declaration.type)
      ? declaration.type
      : undefined
  if (ts.isInterfaceDeclaration(declaration) || literal) {
    const members: { text: string; doc: string }[] = []
    const type = checker.getDeclaredTypeOfSymbol(symbol!)
    for (const each of checker.getPropertiesOfType(type)) {
      const written = each.declarations?.[0]
      if (!written) continue
      mentioned(written, checker, mentions)
      members.push({ text: member(written), doc: docOf(each, checker) })
    }
    return { ...base, members }
  }
  mentioned(declaration.type, checker, mentions)
  return { ...base, text: oneLine(declaration.type.getText()).replace(/^\| /, "") }
}

/** A named export's own comment and what kind of thing it is, for a list of what an entry gives. */
export function exportedAs(
  program: TS.Program,
  file: string,
  name: string
): { doc: string; kind: string; signature: string } | undefined {
  const checker = program.getTypeChecker()
  const symbol = exported(program, file, name)
  if (!symbol) return undefined
  const declaration = symbol.declarations?.[0]
  const kind = !declaration
    ? "value"
    : ts.isFunctionDeclaration(declaration)
      ? "function"
      : ts.isClassDeclaration(declaration)
        ? "class"
        : ts.isInterfaceDeclaration(declaration) || ts.isTypeAliasDeclaration(declaration)
          ? "type"
          : "value"
  let signature = ""
  const callable =
    declaration && ts.isFunctionDeclaration(declaration)
      ? declaration
      : declaration &&
          ts.isVariableDeclaration(declaration) &&
          declaration.initializer &&
          (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer))
        ? declaration.initializer
        : undefined
  if (callable) {
    signature = `(${callable.parameters.map((each) => oneLine(each.getText())).join(", ")})`
  } else if (declaration && ts.isVariableDeclaration(declaration) && declaration.type) {
    // A constant typed as a function: `createToaster: <Content>(options?) => Toaster<Content>`.
    const type = declaration.type
    if (ts.isFunctionTypeNode(type))
      signature = `(${type.parameters.map((each) => oneLine(each.getText())).join(", ")})`
  }
  let doc = docOf(symbol, checker)
  // A type that only renames another of this repository's says what that one says.
  for (let at = declaration, turn = 0; !doc && at && turn < 4; turn++) {
    const next = renamed(at, checker)
    if (!next) break
    doc = docOf(checker.getSymbolAtLocation((next as TS.TypeAliasDeclaration).name), checker)
    at = next
  }
  return { doc, kind, signature: oneLine(signature) }
}

/** A custom element as its file defines it. */
export interface WebElement {
  /** Its entry: `tabs`. */
  name: string
  tag: string
  /** The comment on its `tag`: how the page writes it. */
  doc: string
  /** Its props as attributes, each with how the attribute's text is read. */
  attributes: { name: string; kind: string }[]
  /** Props that are only properties: a function, an object. */
  properties: string[]
  /** What it tells: the event, the prop its `detail` carries, the callback it stands for. */
  events: { event: string; prop: string; callback: string; hold: boolean }[]
  /** The events its `HTMLElementTagNameMap` entry types, to hold against `events`. */
  typed: { event: string; prop: string; callback: string }[] | undefined
  /** Each `kui-part`, with the `kui-` attributes its element is read for. */
  parts: { name: string; attributes: string[] }[]
  /** Each list it draws from a `<template kui-each="name">`. */
  lists: string[]
}

/** The `kui-` attributes a piece of the adapter reads, itself or through what it calls. */
function attributesRead(
  node: TS.Node,
  checker: TS.TypeChecker,
  seen = new Set<TS.Node>()
): string[] {
  const found = new Set<string>()
  const visit = (each: TS.Node) => {
    if (ts.isStringLiteral(each) && /^kui-[a-z-]+$/.test(each.text)) {
      const call = each.parent
      if (ts.isCallExpression(call) && /(get|has)Attribute$/.test(call.expression.getText()))
        found.add(each.text)
      // A list of names read in a loop: a positioner's.
      if (ts.isArrayLiteralExpression(call)) found.add(each.text)
    }
    if (ts.isIdentifier(each) && !ts.isPropertyAccessExpression(each.parent)) {
      let symbol = checker.getSymbolAtLocation(each)
      if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
      const declaration = symbol?.declarations?.[0]
      if (
        declaration &&
        !seen.has(declaration) &&
        declaration.getSourceFile().fileName.includes("/packages/web/src/") &&
        (ts.isFunctionDeclaration(declaration) || ts.isVariableDeclaration(declaration)) &&
        ts.isSourceFile(
          ts.isFunctionDeclaration(declaration)
            ? declaration.parent
            : declaration.parent.parent.parent
        )
      ) {
        seen.add(declaration)
        for (const name of attributesRead(declaration, checker, seen)) found.add(name)
      }
    }
    ts.forEachChild(each, visit)
  }
  visit(node)
  return [...found].sort()
}

/** Every custom element of `@kirana-ui/web`, read from its entry's `defineElement`. */
export function webElements(): WebElement[] {
  const program = programOf("web")
  const checker = program.getTypeChecker()
  const found: WebElement[] = []
  for (const [entry, file] of entries("web")) {
    if (entry === "." || entry === "./runtime") continue
    const source = program.getSourceFile(file)
    if (!source) continue
    let made: TS.VariableDeclaration | undefined
    let typed: WebElement["typed"]
    ts.forEachChild(source, (node) => {
      if (ts.isVariableStatement(node)) {
        for (const each of node.declarationList.declarations)
          if (each.name.getText() === "tag") made = each
      }
      // `declare global { interface HTMLElementTagNameMap { "kui-tabs": ElementOf<typeof tag, {…}> } }`
      if (ts.isModuleDeclaration(node) && node.name.getText() === "global") {
        const text = node.getText()
        typed = [...text.matchAll(/(?:"([\w-]+)"|\b(\w+)):\s*\[\s*"(\w+)",\s*"(\w+)"\s*\]/g)].map(
          ([, quoted, bare, callback = "", prop = ""]) => ({
            event: quoted ?? bare ?? "",
            callback,
            prop,
          })
        )
      }
    })
    const call = made?.initializer
    if (!made || !call || !ts.isCallExpression(call)) continue
    // The spec: `defineElement({…})` here, or inside the function this entry calls with its tag.
    const specOf = (node: TS.Node, depth = 0): TS.ObjectLiteralExpression | undefined => {
      let spec: TS.ObjectLiteralExpression | undefined
      const visit = (each: TS.Node) => {
        if (spec) return
        if (ts.isCallExpression(each)) {
          const first = each.arguments[0]
          if (
            each.expression.getText() === "defineElement" &&
            first &&
            ts.isObjectLiteralExpression(first)
          ) {
            spec = first
            return
          }
          if (depth < 2 && ts.isIdentifier(each.expression)) {
            let symbol = checker.getSymbolAtLocation(each.expression)
            if (symbol && symbol.flags & ts.SymbolFlags.Alias)
              symbol = checker.getAliasedSymbol(symbol)
            const declaration = symbol?.declarations?.[0]
            if (declaration && declaration.getSourceFile().fileName.includes("/packages/web/src/"))
              spec = specOf(declaration, depth + 1)
          }
        }
        if (!spec) ts.forEachChild(each, visit)
      }
      visit(node)
      return spec
    }
    const spec = specOf(call)
    const property = (name: string) =>
      spec?.properties.find(
        (
          each
        ): each is TS.PropertyAssignment | TS.MethodDeclaration | TS.ShorthandPropertyAssignment =>
          (ts.isPropertyAssignment(each) ||
            ts.isMethodDeclaration(each) ||
            ts.isShorthandPropertyAssignment(each)) &&
          each.name.getText() === name
      )
    const object = (name: string) => {
      const held = property(name)
      return held && ts.isPropertyAssignment(held) && ts.isObjectLiteralExpression(held.initializer)
        ? held.initializer
        : undefined
    }
    // What an object of the spec holds, through what it spreads and what it is only named by
    // (`parts: PARTS`, `{ ...PARTS, trigger }`, `...calendar.parts` of a function's result): a
    // constant typed as a record has no names for the type checker, so the source is followed.
    const declared = (node: TS.Node): TS.Declaration | undefined => {
      let symbol = ts.isShorthandPropertyAssignment(node)
        ? checker.getShorthandAssignmentValueSymbol(node)
        : checker.getSymbolAtLocation(node)
      if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
      return symbol?.valueDeclaration ?? symbol?.declarations?.[0]
    }
    /** The property `name` of the object a call gives back, from the function called. */
    const returned = (made_: TS.Expression, name: string, depth: number): Member[] => {
      if (!ts.isCallExpression(made_)) return []
      const callee = declared(made_.expression)
      let held_: Member[] = []
      const visit = (each: TS.Node) => {
        if (held_.length > 0) return
        if (ts.isReturnStatement(each) && each.expression) {
          const literal_ = each.expression
          if (ts.isObjectLiteralExpression(literal_)) {
            const named_ = literal_.properties.find((one) => one.name?.getText() === name)
            if (named_)
              held_ = members(
                ts.isPropertyAssignment(named_) ? named_.initializer : named_,
                depth + 1
              )
          }
        }
        ts.forEachChild(each, visit)
      }
      if (callee) visit(callee)
      return held_
    }
    interface Member {
      name: string
      node: TS.Node
    }
    const members = (node: TS.Node, depth = 0): Member[] => {
      if (depth > 6) return []
      if (ts.isObjectLiteralExpression(node))
        return node.properties.flatMap((each): Member[] =>
          ts.isSpreadAssignment(each)
            ? members(each.expression, depth + 1)
            : each.name
              ? [
                  {
                    name: unquoted(each.name),
                    node: ts.isShorthandPropertyAssignment(each) ? (declared(each) ?? each) : each,
                  },
                ]
              : []
        )
      if (ts.isPropertyAccessExpression(node)) {
        // `calendar.parts`, where `calendar` is what a function gave back.
        const holder = declared(node.expression)
        return holder && ts.isVariableDeclaration(holder) && holder.initializer
          ? returned(holder.initializer, node.name.text, depth)
          : []
      }
      const from =
        ts.isIdentifier(node) || ts.isShorthandPropertyAssignment(node) ? declared(node) : undefined
      if (!from) return []
      if (ts.isVariableDeclaration(from) && from.initializer)
        return members(from.initializer, depth + 1)
      // `const { parts, lists } = calendarParts(…)`.
      if (ts.isBindingElement(from)) {
        const whole = from.parent.parent
        if (ts.isVariableDeclaration(whole) && whole.initializer)
          return returned(whole.initializer, (from.propertyName ?? from.name).getText(), depth)
      }
      return []
    }
    const held = (name: string): Member[] => {
      const at = property(name)
      if (!at) return []
      const all = members(ts.isPropertyAssignment(at) ? at.initializer : at)
      // A name written twice (a spread, then the component's own) is the last one.
      return all.filter(
        (each, index) => all.findLastIndex((one) => one.name === each.name) === index
      )
    }
    const unquoted = (node: TS.Node) => node.getText().replace(/^["']|["']$/g, "")
    const literal = call.arguments.find((each) => ts.isStringLiteral(each))
    const named = property("tag")
    const tag =
      (literal && unquoted(literal)) ??
      (named && ts.isPropertyAssignment(named) && ts.isStringLiteral(named.initializer)
        ? named.initializer.text
        : `kui-${entry.slice(2)}`)
    const properties = property("properties")
    found.push({
      name: entry.slice(2),
      tag,
      doc: docOf(checker.getSymbolAtLocation(made.name), checker),
      attributes: (object("props")?.properties ?? []).flatMap((each) =>
        ts.isPropertyAssignment(each)
          ? [{ name: unquoted(each.name), kind: unquoted(each.initializer) }]
          : []
      ),
      properties:
        properties && ts.isPropertyAssignment(properties)
          ? [...properties.initializer.getText().matchAll(/"(\w+)"/g)].map((each) => each[1]!)
          : [],
      events: (object("changes")?.properties ?? []).flatMap((each) => {
        if (!ts.isPropertyAssignment(each)) return []
        const text = each.initializer.getText()
        return [
          {
            callback: unquoted(each.name),
            event: /event:\s*"([\w-]+)"/.exec(text)?.[1] ?? "",
            prop: /prop:\s*"(\w+)"/.exec(text)?.[1] ?? "",
            hold: !/hold:\s*false/.test(text),
          },
        ]
      }),
      typed,
      parts: held("parts").map((each) => ({
        name: each.name,
        attributes: attributesRead(each.node, checker),
      })),
      lists: held("lists").map((each) => each.name),
    })
  }
  return found
}

/** The files an entry's export of a name is declared in: its own, and what it only renames. */
export function declaredIn(program: TS.Program, file: string, name: string): string[] {
  const checker = program.getTypeChecker()
  let declaration = exported(program, file, name)?.declarations?.[0]
  const found: string[] = []
  for (let turn = 0; declaration && turn < 5; turn++) {
    found.push(relative(ROOT, declaration.getSourceFile().fileName))
    declaration = renamed(declaration, checker)
  }
  return found
}

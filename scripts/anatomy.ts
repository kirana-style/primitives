/**
 * Where each part goes, held against the six fixture pages.
 *
 * The core's vocabulary says of every part what it is written inside (`inside`), whether it is
 * a wrapper that may be left out (`optional`), whether it is written more than once
 * (`repeated`) and whether it draws no element (`element: false`). This file turns that into
 * the tree each `llms.txt` prints, and reads the fixtures' own source, each with its
 * framework's parser, to find a part that is written somewhere the data does not allow:
 *
 *   React, Solid       the JSX of `src/App.tsx` and `src/Open.tsx`, with TypeScript
 *   Vue                the templates of `src/App.vue` and `src/Open.vue`, with Vue's compiler
 *   Svelte             `src/App.svelte` and `src/Open.svelte`, with Svelte's compiler
 *   Angular            every `template` of `src/app.ts` and `src/open.ts`, with Angular's compiler
 *   custom elements    `index.html`, by `kui-part` inside each `kui-*` element
 *
 *   bun scripts/anatomy.ts             prints what is misplaced, and fails when anything is
 *   bun scripts/anatomy.ts --observed  prints where the fixtures write each part
 */
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

import type * as TS from "../fixtures/angular/node_modules/typescript"
import type { PartDefinition } from "../packages/core/src/part.ts"
import { vocabulary } from "../packages/core/src/vocabulary.ts"
import { ROOT, camel, kebab, reference, ts, webElements } from "./reference.ts"
import type { WebElement } from "./reference.ts"

type Definition = Record<string, PartDefinition>
const COMPONENTS = vocabulary as unknown as Record<string, Definition>

const pascal = (name: string) => name[0]!.toUpperCase() + name.slice(1)
const several = (value: string | readonly string[] | undefined): readonly string[] =>
  value === undefined ? [] : typeof value === "string" ? [value] : value

/** A component of one part is written as the component, whatever the vocabulary calls its part. */
const lone = (definition: Definition) => Object.keys(definition).length === 1

// ───────────────────────────────── the tree ─────────────────────────────────

export interface Branch {
  part: string
  definition: PartDefinition
  /** It is drawn in full under another part: here it is only named. */
  again: boolean
  branches: Branch[]
}

/** The part nothing holds: the one a component's tree starts at. */
export function outermost(definition: Definition): string[] {
  return Object.keys(definition).filter((part) => several(definition[part]!.inside).length === 0)
}

/**
 * A component's parts as a tree, each under the first part it names as `inside`. A part that
 * may sit in several is drawn whole under the first and named again under the others.
 */
export function tree(definition: Definition): Branch | undefined {
  const [top] = outermost(definition)
  if (!top) return undefined
  const under = (part: string, trail: string[]): Branch => ({
    part,
    definition: definition[part]!,
    again: false,
    branches: Object.keys(definition).flatMap((child): Branch[] => {
      const inside = several(definition[child]!.inside)
      if (!inside.includes(part)) return []
      if (inside[0] !== part || trail.includes(child))
        return [{ part: child, definition: definition[child]!, again: true, branches: [] }]
      return [under(child, [...trail, part])]
    }),
  })
  return under(top, [])
}

/** What is wrong with a component's places, as data: the rule `llms --check` holds. */
export function unplaced(component: string, definition: Definition): string[] {
  const said: string[] = []
  const top = outermost(definition)
  if (top.length !== 1)
    said.push(
      `${component} has ${top.length} parts with no \`inside\` (${top.join(", ")}): one is its outermost`
    )
  for (const [part, about] of Object.entries(definition)) {
    for (const parent of several(about.inside)) {
      if (!definition[parent])
        said.push(`${component}.${part} is inside ${parent}, which is no part of ${component}`)
    }
    // Every part is reached from the outermost one.
    const seen = new Set<string>()
    let at: string | undefined = part
    while (at && !seen.has(at)) {
      seen.add(at)
      at = several(definition[at]?.inside)[0]
    }
    if (at) said.push(`${component}.${part} is inside itself (${[...seen].join(" < ")})`)
  }
  return said
}

/**
 * The parts a part may be written directly inside: those it names, and through a wrapper that
 * may be left out, what that wrapper names.
 */
export function allowed(definition: Definition, part: string): Set<string> {
  const found = new Set<string>()
  const add = (name: string) => {
    for (const parent of several(definition[name]?.inside)) {
      if (found.has(parent)) continue
      found.add(parent)
      if (definition[parent]?.optional) add(parent)
    }
  }
  add(part)
  return found
}

// ─────────────────────────────── the fixtures ───────────────────────────────

export interface Placed {
  adapter: string
  /** Where it is written, for a message: `fixtures/react/src/App.tsx:565`. */
  at: string
  /** As its framework writes it: `Select.Item`, `kuiSelectItem`, `item`. */
  written: string
  /** The parts it may be: a directive that is several components' part is each of them. */
  names: { component: string; part: string }[]
  parent: Placed | undefined
  /** Custom elements: the `kui-*` element itself, which holds the component and draws nothing. */
  holder?: boolean
}

const FILES: Record<string, string[]> = {
  react: ["src/App.tsx", "src/Open.tsx"],
  solid: ["src/App.tsx", "src/Open.tsx"],
  vue: ["src/App.vue", "src/Open.vue"],
  svelte: ["src/App.svelte", "src/Open.svelte"],
  angular: ["src/app.ts", "src/open.ts"],
  web: ["index.html"],
}

export const FIXTURES = Object.keys(FILES)

const text = (path: string) => readFileSync(join(ROOT, path), "utf8")
const from = (fixture: string) => createRequire(join(ROOT, "fixtures", fixture, "package.json"))

/** `Select.Item`, or `Button` for a component of one part, as the part it names. */
function named(tag: string): Placed["names"] {
  const [name = "", part] = tag.split(".")
  const definition = COMPONENTS[camel(name)]
  if (!definition || !/^[A-Z]/.test(name)) return []
  if (part === undefined)
    return lone(definition) ? [{ component: name, part: Object.keys(definition)[0]! }] : []
  // A component of one part is also written with it: `Label.Root` is the vocabulary's `label`.
  if (lone(definition)) return [{ component: name, part: Object.keys(definition)[0]! }]
  return [{ component: name, part: camel(part) }]
}

function jsx(adapter: string, file: string): Placed[] {
  const path = `fixtures/${adapter}/${file}`
  const source = ts.createSourceFile(path, text(path), 99, true, 4)
  const found: Placed[] = []
  const visit = (node: TS.Node, parent?: Placed) => {
    let here = parent
    const opening = ts.isJsxElement(node)
      ? node.openingElement
      : ts.isJsxSelfClosingElement(node)
        ? node
        : undefined
    if (opening) {
      const tag = opening.tagName.getText(source)
      const names = named(tag)
      if (names.length > 0) {
        const line = source.getLineAndCharacterOfPosition(opening.getStart(source)).line + 1
        here = { adapter, at: `${path}:${line}`, written: tag, names, parent }
        found.push(here)
      }
    }
    ts.forEachChild(node, (child) => visit(child, here))
  }
  visit(source)
  return found
}

interface VueNode {
  type: number
  tag?: string
  props?: { name: string; value?: { content: string } }[]
  children?: VueNode[]
  loc: { start: { line: number } }
}

function vue(file: string): Placed[] {
  const path = `fixtures/vue/${file}`
  const { parse } = from("vue")("vue/compiler-sfc") as {
    parse(source: string): { descriptor: { template: { ast: VueNode } | null } }
  }
  const found: Placed[] = []
  const visit = (node: VueNode, parent?: Placed) => {
    let here = parent
    const names = node.type === 1 && node.tag ? named(node.tag) : []
    if (names.length > 0) {
      here = {
        adapter: "vue",
        at: `${path}:${node.loc.start.line}`,
        written: node.tag!,
        names,
        parent,
      }
      found.push(here)
    }
    for (const child of node.children ?? []) visit(child, here)
  }
  const ast = parse(text(path)).descriptor.template?.ast
  if (ast) visit(ast)
  return found
}

function svelte(file: string): Placed[] {
  const path = `fixtures/svelte/${file}`
  const source = text(path)
  const { parse } = from("svelte")("svelte/compiler") as {
    parse(source: string, options: { modern: true }): { fragment: unknown }
  }
  const found: Placed[] = []
  const visit = (node: unknown, parent?: Placed) => {
    if (!node || typeof node !== "object") return
    if (Array.isArray(node)) {
      for (const child of node) visit(child, parent)
      return
    }
    const one = node as { type?: string; name?: string; start?: number }
    let here = parent
    if (one.type === "Component" && one.name) {
      const names = named(one.name)
      if (names.length > 0) {
        const line = source.slice(0, one.start ?? 0).split("\n").length
        here = { adapter: "svelte", at: `${path}:${line}`, written: one.name, names, parent }
        found.push(here)
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (key !== "parent" && key !== "metadata") visit(value, here)
    }
  }
  visit(parse(source, { modern: true }).fragment)
  return found
}

/** Angular's directives by the attribute a template writes: `kuiMenuItem` is a menu's item, and a context menu's. */
async function selectors(): Promise<Map<string, Placed["names"]>> {
  const found = new Map<string, Placed["names"]>()
  const own = await reference("angular")
  for (const component of own.components.values()) {
    const definition = COMPONENTS[camel(component.name)]
    if (!definition) continue
    for (const part of component.parts) {
      const all = part.directive!.selector.split(/,\s*/)
      // A directive that is several components' root is each one's under its own name.
      const mine = all.filter((one) => one.includes(`kui${component.name}]`))
      for (const selector of mine.length > 0 ? mine : all) {
        const attribute = /\[(\w+)\]/.exec(selector)?.[1]
        if (!attribute) continue
        const key = lone(definition) ? Object.keys(definition)[0]! : camel(part.part)
        const known = found.get(attribute) ?? []
        if (!known.some((one) => one.component === component.name && one.part === key))
          known.push({ component: component.name, part: key })
        found.set(attribute, known)
      }
    }
  }
  return found
}

interface NgNode {
  name?: string
  attributes?: { name: string }[]
  inputs?: { name: string }[]
  templateAttrs?: { name: string }[]
  sourceSpan?: { start: { line: number } }
  [key: string]: unknown
}

/** The attribute a directive is written as (`[kuiTooltip]` is `kuiTooltip`), by its class. */
async function attributesByClass(): Promise<Map<string, string>> {
  const found = new Map<string, string>()
  for (const component of (await reference("angular")).components.values())
    for (const part of component.parts) {
      const all = part.directive!.selector.split(/,\s*/)
      const mine = all.find((one) => one.includes(`kui${component.name}]`)) ?? all[0]!
      const attribute = /\[(\w+)\]/.exec(mine)?.[1]
      if (attribute) found.set(part.directive!.name, attribute)
    }
  return found
}

/**
 * The Angular fixture's own design system (`src/design-system.ts`), by the attribute each of
 * its directives is written as: the primitives it stands for, outermost first. A directive
 * stands for the primitives it hosts (`hostDirectives`), and a component also for those its
 * template draws around `<ng-content />` (a dialog's portal and popup), so what is written
 * inside it is inside them.
 */
async function designSystem(
  parseTemplate: (template: string, url: string) => { nodes: NgNode[] }
): Promise<Map<string, string[]>> {
  const found = new Map<string, string[]>()
  const path = "fixtures/angular/src/design-system.ts"
  const byClass = await attributesByClass()
  const source = ts.createSourceFile(path, text(path), 99, true)
  const wrapping = (nodes: NgNode[], chain: string[]): string[] | undefined => {
    for (const node of nodes) {
      if (node.name === "ng-content") return chain
      const mine = [...(node.templateAttrs ?? []), ...(node.attributes ?? [])]
        .map((each) => each.name)
        .filter((name) => name.startsWith("kui"))
      const held = node.children
      const deeper = Array.isArray(held)
        ? wrapping(held as NgNode[], [...chain, ...mine])
        : undefined
      if (deeper) return deeper
    }
    return undefined
  }
  const visit = (node: TS.Node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const property = (name: string) =>
        node.properties.find(
          (each): each is TS.PropertyAssignment =>
            ts.isPropertyAssignment(each) && each.name.getText(source) === name
        )?.initializer
      const selector = property("selector")
      const attribute =
        selector && ts.isStringLiteral(selector)
          ? /^\[(\w+)\]$/.exec(selector.text)?.[1]
          : undefined
      if (attribute) {
        const chain: string[] = []
        const hosts = property("hostDirectives")
        if (hosts && ts.isArrayLiteralExpression(hosts)) {
          for (const each of hosts.elements) {
            const host = ts.isObjectLiteralExpression(each)
              ? each.properties.find(
                  (one): one is TS.PropertyAssignment =>
                    ts.isPropertyAssignment(one) && one.name.getText(source) === "directive"
                )?.initializer
              : each
            const hosted = host && byClass.get(host.getText(source))
            if (hosted) chain.push(hosted)
          }
        }
        const template = property("template")
        if (template && ts.isNoSubstitutionTemplateLiteral(template))
          chain.push(...(wrapping(parseTemplate(template.text, path).nodes, []) ?? []))
        if (chain.length > 0) found.set(attribute, chain)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

async function angular(file: string): Promise<Placed[]> {
  const path = `fixtures/angular/${file}`
  const known = await selectors()
  const { parseTemplate } = (await import(from("angular").resolve("@angular/compiler"))) as {
    parseTemplate(template: string, url: string): { nodes: NgNode[] }
  }
  const standsFor = await designSystem(parseTemplate)
  const source = ts.createSourceFile(path, text(path), 99, true)
  const found: Placed[] = []
  const HOLD = ["children", "branches", "cases", "empty", "placeholder", "loading", "error"]
  const walk = (node: NgNode, first: number, parent?: Placed) => {
    let here = parent
    // An element written with `*` is a template around itself, which Angular also hands the
    // element's own attributes: there only the structural ones are the template's.
    const around_ = (node.templateAttrs?.length ?? 0) > 0 && node.tagName !== "ng-template"
    const attributes = around_
      ? node.templateAttrs!
      : [...(node.templateAttrs ?? []), ...(node.attributes ?? []), ...(node.inputs ?? [])]
    // A design system's directive is written for the primitives it stands for.
    const written = attributes.flatMap(
      (attribute) => standsFor.get(attribute.name) ?? attribute.name
    )
    for (const name of written) {
      const names = known.get(name)
      if (!names) continue
      // Several directives on one element: each is placed by what is around the element.
      const one: Placed = {
        adapter: "angular",
        at: `${path}:${first + (node.sourceSpan?.start.line ?? 0)}`,
        written: name,
        names,
        // The directives of one element, in the order written: the first is around the next.
        parent: here,
      }
      found.push(one)
      here = one
    }
    for (const key of HOLD) {
      const held = node[key]
      for (const child of Array.isArray(held) ? held : held ? [held] : [])
        walk(child as NgNode, first, here)
    }
  }
  const visit = (node: TS.Node) => {
    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(source) === "template" &&
      ts.isNoSubstitutionTemplateLiteral(node.initializer)
    ) {
      const first = source.getLineAndCharacterOfPosition(node.initializer.getStart(source)).line + 1
      for (const each of parseTemplate(node.initializer.text, path).nodes) walk(each, first)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

/**
 * What a custom element's page calls a part the core calls otherwise: a toast is `toast`
 * there (the core's `root` is one toast) in a list named `toasts`, and a listbox's mark is
 * `indicator`.
 */
const WEB_NAMES: Record<string, Record<string, string>> = {
  toast: { root: "toast", list: "toasts" },
  listbox: { itemIndicator: "indicator" },
}

export interface WebSpelling {
  /**
   * `element`: the custom element itself holds it (a root that draws nothing); `part`: an
   * element named by `kui-part`; `list`: a `<template kui-each>`; `submenu`: a `<kui-menu>`
   * inside a menu.
   */
  kind: "element" | "part" | "list" | "submenu"
  name: string
}

/** How a page of custom elements writes a part of the core's, or `undefined` where it has none. */
export function webSpelling(
  element: WebElement,
  definition: Definition,
  part: string
): WebSpelling | undefined {
  const component = camel(pascalOf(element.name))
  const parts = element.parts.map((each) => each.name)
  const name = WEB_NAMES[component]?.[part] ?? kebab(part)
  if (lone(definition)) return { kind: "part", name: "root" }
  if (part === "submenuRoot") return { kind: "submenu", name: element.tag }
  if (part === "submenuTrigger") return { kind: "part", name: "trigger" }
  if (parts.includes(name)) return { kind: "part", name }
  if (element.lists.includes(name)) return { kind: "list", name }
  // The runtime's own part, of every element whose component has one.
  if (part === "portal") return { kind: "part", name }
  if (several(definition[part]!.inside).length === 0) return { kind: "element", name: element.tag }
  return undefined
}

function web(file: string): Placed[] {
  const path = `fixtures/web/${file}`
  // Vue's own HTML parser, from where Vue keeps it.
  const { parse } = createRequire(from("vue").resolve("vue"))("@vue/compiler-dom") as {
    parse(source: string): VueNode
  }
  const elements = new Map(webElements().map((element) => [element.tag, element]))
  const found: Placed[] = []
  /** What is around a node: the custom element it belongs to, and whether that is a submenu. */
  interface Around {
    element: WebElement
    component: string
    sub: boolean
    node: Placed
  }
  const visit = (node: VueNode, parent?: Placed, around_?: Around) => {
    let here = parent
    let inside = around_
    if (node.type === 1 && node.tag) {
      const at = `${path}:${node.loc.start.line}`
      const attribute = (name: string) =>
        node.props?.find((prop) => prop.name === name)?.value?.content
      const element = elements.get(node.tag)
      if (element) {
        const component = pascalOf(element.name)
        // A menu in a menu is its submenu: the element is the submenu's root.
        const sub = component === "Menu" && around_?.component === "Menu"
        here = {
          adapter: "web",
          at,
          written: `<${node.tag}>`,
          names: [{ component, part: sub ? "submenuRoot" : "@element" }],
          parent: sub ? parent : undefined,
          holder: !sub,
        }
        if (sub) found.push(here)
        inside = { element, component, sub, node: here }
      } else if (around_) {
        const { component } = around_
        const definition = COMPONENTS[camel(component)]!
        const written =
          attribute("kui-part") ?? (node.tag === "template" ? attribute("kui-each") : undefined)
        // A name the page writes, as the core's part: by how each of the core's is spelled.
        const part =
          written === undefined
            ? undefined
            : Object.keys(definition).find((key) => {
                const spelled = webSpelling(around_.element, definition, key)
                if (!spelled || spelled.name !== written) return false
                if (node.tag === "template") return spelled.kind === "list"
                if (spelled.kind !== "part") return false
                return (key === "submenuTrigger") === around_.sub || !definition.submenuTrigger
              })
        if (written !== undefined && (part || node.tag !== "template")) {
          here = {
            adapter: "web",
            at,
            written,
            names: [{ component, part: part ?? written }],
            parent: parent ?? around_.node,
          }
          found.push(here)
        }
      }
    }
    for (const child of node.children ?? []) visit(child, here, inside)
  }
  visit(parse(text(path)))
  return found
}

/** `date-field` as `DateField`. */
const pascalOf = (name: string) =>
  name.replace(/(^|-)([a-z])/g, (_whole, _dash, letter: string) => letter.toUpperCase())

/** Every part the fixture of an adapter writes, each with the part it is written inside. */
export async function placed(adapter: string): Promise<Placed[]> {
  const found: Placed[] = []
  for (const file of FILES[adapter]!) {
    if (adapter === "react" || adapter === "solid") found.push(...jsx(adapter, file))
    else if (adapter === "vue") found.push(...vue(file))
    else if (adapter === "svelte") found.push(...svelte(file))
    else if (adapter === "angular") found.push(...(await angular(file)))
    else found.push(...web(file))
  }
  // A directive that is several components' part is the part of the one whose own directive
  // is around it: `kuiDialogPopup` inside `kuiAlertDialog` is an alert dialog's popup.
  for (const one of found) {
    if (one.names.length < 2) continue
    for (let at = one.parent; at; at = at.parent) {
      const shared = at.names.filter((name) =>
        one.names.some((mine) => mine.component === name.component)
      )
      if (shared.length !== 1) continue
      one.names = one.names.filter((name) => name.component === shared[0]!.component)
      break
    }
  }
  return found
}

const elementsByTag = new Map<string, WebElement>()
/** The custom element a node of the web fixture is. */
function holderOf(node: Placed): WebElement {
  if (elementsByTag.size === 0)
    for (const element of webElements()) elementsByTag.set(`<${element.tag}>`, element)
  return elementsByTag.get(node.written)!
}

/** The nearest part around one that is a part of the same component, and as which. */
function around(one: Placed, component: string): { node: Placed; part: string } | undefined {
  for (let at = one.parent; at; at = at.parent) {
    const name = at.names.find((each) => each.component === component)
    if (name) return { node: at, part: name.part }
  }
  return undefined
}

/**
 * The parts a fixture writes outside what the vocabulary says they are inside, and those it
 * writes twice in one place that the vocabulary does not say are repeated.
 */
export function misplaced(all: Placed[]): string[] {
  const said: string[] = []
  const counted = new Map<Placed, Map<string, Placed[]>>()
  for (const one of all) {
    if (one.holder) continue
    const tried: string[] = []
    let fits = false
    for (const { component, part } of one.names) {
      const definition = COMPONENTS[camel(component)]
      const about = definition?.[part]
      if (!definition || !about) {
        tried.push(`${component} has no part ${part}`)
        continue
      }
      const may = allowed(definition, part)
      const holds = around(one, component)
      // The outermost part begins a component, wherever it is written.
      if (may.size === 0) fits = true
      else if (!holds) tried.push(`it is in no part of ${component}`)
      else if (
        may.has(holds.part) ||
        // A custom element is itself the root that draws nothing.
        (holds.node.holder &&
          [...may].some(
            (each) => webSpelling(holderOf(holds.node), definition, each)?.kind === "element"
          ))
      ) {
        fits = true
        if (!about.repeated) {
          const here = counted.get(holds.node) ?? new Map<string, Placed[]>()
          here.set(`${component}.${part}`, [...(here.get(`${component}.${part}`) ?? []), one])
          counted.set(holds.node, here)
        }
      } else
        tried.push(
          `it is in ${component}'s ${holds.part} (${holds.node.at}), and the vocabulary says ${[...may].join(" or ")}`
        )
      if (fits) break
    }
    if (!fits) said.push(`${one.at}  ${one.written}: ${tried.join("; ")}`)
  }
  for (const [parent, parts] of counted) {
    for (const [name, nodes] of parts) {
      if (nodes.length > 1 && nodes.every((each) => each.names.length === 1))
        said.push(
          `${nodes[1]!.at}  ${nodes[1]!.written}: written ${nodes.length} times in one ${parent.written} (${parent.at}), and the vocabulary does not say ${name} is repeated`
        )
    }
  }
  return said
}

/**
 * The parts no fixture writes: their place is the vocabulary's word alone, held by nothing
 * here.
 */
export async function unseen(): Promise<string[]> {
  // A part one component has from another (a context menu's item is a menu's) is one part.
  const seen = new Set<PartDefinition>()
  for (const adapter of FIXTURES) {
    for (const one of await placed(adapter)) {
      for (const { component, part } of one.names) {
        const about = COMPONENTS[camel(component)]?.[part]
        if (about) seen.add(about)
      }
    }
  }
  return Object.entries(COMPONENTS).flatMap(([component, definition]) =>
    Object.entries(definition)
      .filter(([, about]) => !seen.has(about))
      .map(([part]) => `${pascal(component)}.${part}`)
  )
}

/** What each fixture is found to break, by adapter. */
export async function check(): Promise<Record<string, string[]>> {
  const found: Record<string, string[]> = {}
  for (const adapter of FIXTURES) found[adapter] = misplaced(await placed(adapter))
  return found
}

if (import.meta.main) {
  if (process.argv.includes("--observed")) {
    const seen = new Map<string, Map<string, Set<string>>>()
    for (const adapter of FIXTURES) {
      for (const one of await placed(adapter)) {
        if (one.holder) continue
        for (const { component, part } of one.names.slice(0, 1)) {
          const holds = around(one, component)
          const key = `${component}.${part}`
          const inside = holds ? (holds.node.holder ? "(element)" : holds.part) : "(none)"
          const known = seen.get(key) ?? new Map<string, Set<string>>()
          known.set(inside, (known.get(inside) ?? new Set()).add(adapter))
          seen.set(key, known)
        }
      }
    }
    for (const [key, inside] of [...seen].sort(([a], [b]) => a.localeCompare(b)))
      console.log(
        `${key.padEnd(34)} ${[...inside].map(([part, adapters]) => `${part} [${[...adapters].map((each) => each[0]).join("")}]`).join("  ")}`
      )
  } else {
    let count = 0
    for (const [adapter, said] of Object.entries(await check())) {
      for (const line of said) console.log(`${adapter.padEnd(8)} ${line}`)
      count += said.length
    }
    for (const [component, definition] of Object.entries(COMPONENTS)) {
      for (const line of unplaced(pascal(component), definition)) {
        console.log(`data     ${line}`)
        count++
      }
    }
    const none = await unseen()
    if (none.length > 0) console.log(`in no fixture, so held by nothing: ${none.join(", ")}`)
    console.log(
      count === 0
        ? "anatomy: every part is where the vocabulary says"
        : `anatomy: ${count} misplaced`
    )
    process.exit(count === 0 ? 0 : 1)
  }
}

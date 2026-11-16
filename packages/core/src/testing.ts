/**
 * What this library's own checks are made of, for checking a design system built on it or a
 * component of one's own: the faults a page is read for, the page as text two frameworks can
 * be compared by, the wait for motion to end, and a record of what a callback heard.
 *
 * Framework-free, and with no test runner of its own: it runs wherever there is a DOM (a
 * browser test, a Playwright page, jsdom for what needs no layout).
 */
import type { ChangeDetails, ComponentDefinition } from "./part.ts"
import { vocabulary } from "./vocabulary.ts"

/** The attributes and variables parts may write, from one or more vocabularies. */
export interface KnownVocabulary {
  /** Each state attribute: the values it takes, or `null` for one that is present or absent. */
  readonly attributes: ReadonlyMap<string, readonly string[] | null>
  readonly variables: ReadonlySet<string>
}

/**
 * What the given components may write: this library's own vocabulary, and any of yours
 * (`defineComponent` from `@kirana-ui/core/authoring`).
 */
export function known(...own: ComponentDefinition[]): KnownVocabulary {
  const attributes = new Map<string, readonly string[] | null>()
  const variables = new Set<string>()
  for (const component of [...Object.values(vocabulary), ...own]) {
    for (const part of Object.values(component as ComponentDefinition)) {
      for (const each of Object.values(part.states ?? {})) {
        const before = attributes.get(each.attribute)
        // An attribute two parts write differently takes either's values.
        attributes.set(
          each.attribute,
          each.values ? [...new Set([...(before ?? []), ...each.values])] : (before ?? null)
        )
      }
      for (const name of Object.keys(part.variables ?? {})) variables.add(name)
    }
  }
  return { attributes, variables }
}

export interface FaultOptions {
  /** `data-*` attributes of the page's own, which no part wrote: `["data-testid"]`. */
  allow?: readonly string[] | undefined
  /** State attributes whose value is anything: a number, a caller's word. */
  free?: readonly string[] | undefined
}

const REFERENCES = [
  "for",
  "aria-controls",
  "aria-labelledby",
  "aria-describedby",
  "aria-details",
  "aria-activedescendant",
]
const FREE = ["data-index", "data-type"]

/**
 * The faults in what is under `root`, each as a sentence; none is an empty list. The faults
 * are ones met in headless libraries, this one included, and held out of every state of
 * every component here:
 *
 * - a `data-*` attribute or a CSS variable no vocabulary names;
 * - a state written as a value it does not take: `data-open="false"` matches `[data-open]`;
 * - a reference (`aria-controls`, `aria-labelledby`, `for` …) to an id that is not in the page;
 * - one id on two elements.
 */
export function faults(
  root: ParentNode,
  vocabularyKnown: KnownVocabulary = known(),
  options: FaultOptions = {}
): string[] {
  const found: string[] = []
  const allow = new Set(["data-testid", ...(options.allow ?? [])])
  const free = new Set([...FREE, ...(options.free ?? [])])
  const page = root instanceof Document ? root : (root.ownerDocument ?? document)
  const called = (element: Element) =>
    element.getAttribute("data-testid") ?? (element.id || element.tagName.toLowerCase())
  const ids = new Map<string, number>()
  const elements = [
    ...(root instanceof Element ? [root] : []),
    ...root.querySelectorAll<HTMLElement>("*"),
  ]
  for (const element of elements) {
    if (element.id) ids.set(element.id, (ids.get(element.id) ?? 0) + 1)
    for (const { name, value } of element.attributes) {
      if (name.startsWith("data-") && !allow.has(name)) {
        if (!vocabularyKnown.attributes.has(name)) {
          found.push(`${called(element)} has ${name}, which no vocabulary names`)
          continue
        }
        const values = vocabularyKnown.attributes.get(name)
        if (free.has(name)) continue
        if (values === null && value !== "")
          found.push(`${called(element)} has ${name}="${value}": a state is present or absent`)
        if (values && !values.includes(value))
          found.push(`${called(element)} has ${name}="${value}", which is none of its values`)
      }
      if (REFERENCES.includes(name)) {
        for (const id of value.split(/\s+/).filter(Boolean)) {
          if (!page.getElementById(id))
            found.push(`${called(element)} has ${name}="${id}", which is not in the page`)
        }
      }
    }
    const style = (element as HTMLElement).style
    for (const name of style ? [...style] : []) {
      if (name.startsWith("--") && !vocabularyKnown.variables.has(name))
        found.push(`${called(element)} has ${name}, which no vocabulary names`)
    }
  }
  for (const [id, count] of ids) if (count > 1) found.push(`${count} elements have the id "${id}"`)
  return found
}

export interface SerializeOptions {
  /** Attributes left out: a framework's own marks. Test ids are written as `#name`. */
  skip?: readonly string[] | undefined
}

/**
 * What is under `root` as text: one line an element, its attributes sorted, a run of text
 * nodes as one text, an input's live value and not its attribute. Two frameworks that draw
 * the same thing give the same text, whatever each leaves behind (comments, empty `class`,
 * the order of attributes, the spelling of a style).
 */
export function serialize(root: Element, options: SerializeOptions = {}): string {
  const skip = new Set(["data-testid", ...(options.skip ?? [])])
  const lines: string[] = []
  const walk = (node: Node, depth: number) => {
    if (node.nodeType === 3) {
      const inRun = (each: Node | null): each is Node =>
        each?.nodeType === 3 || each?.nodeType === 8
      let before = node.previousSibling
      while (before?.nodeType === 8) before = before.previousSibling
      if (before?.nodeType === 3) return
      let run = ""
      for (let each: Node | null = node; inRun(each); each = each.nextSibling) {
        if (each.nodeType === 3) run += each.textContent
      }
      const text = run.replace(/\s+/g, " ").trim()
      if (text) lines.push(`${"  ".repeat(depth)}"${text}"`)
      return
    }
    if (node.nodeType !== 1 || (node as Element).tagName === "SCRIPT") return
    const element = node as Element
    const attributes = [...element.attributes]
      .filter((each) => !skip.has(each.name))
      .map((each) => {
        let value = each.value
        if ((each.name === "class" || each.name === "style") && value.trim() === "") return ""
        if (each.name === "class") value = value.trim().replace(/\s+/g, " ")
        if (each.name === "style") {
          value = value
            .split(";")
            .map((part) => {
              const colon = part.indexOf(":")
              return colon < 0
                ? part.trim()
                : `${part.slice(0, colon).trim()}: ${part.slice(colon + 1).trim()}`
            })
            .filter(Boolean)
            .sort()
            .join("; ")
        }
        return value === "" ? each.name : `${each.name}="${value}"`
      })
      .filter(Boolean)
      .sort()
    if (element instanceof HTMLInputElement) {
      for (const name of ["checked", "value"]) {
        const at = attributes.findIndex((each) => each === name || each.startsWith(`${name}=`))
        if (at >= 0) attributes.splice(at, 1)
      }
      if (element.checked) attributes.push("checked")
      if (element.value !== "" && element.value !== "on")
        attributes.push(`value="${element.value}"`)
      attributes.sort()
    }
    const testid = element.getAttribute("data-testid")
    lines.push(
      `${"  ".repeat(depth)}<${element.tagName.toLowerCase()}${testid ? `#${testid}` : ""}${attributes.map((each) => ` ${each}`).join("")}>`
    )
    for (const child of element.childNodes) walk(child, depth + 1)
  }
  walk(root, 0)
  return lines.join("\n")
}

/**
 * Resolves once nothing is moving: a framework has had its turn, no part is in the first or
 * last frame of its way in or out, and no animation is running. Rejects after `timeout`
 * milliseconds, saying what was still moving.
 */
export function settled(page: Document = document, timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const from = Date.now()
    const moving = () =>
      page.querySelector("[data-starting-style], [data-ending-style]") !== null ||
      page.getAnimations().length > 0
    const look = () => {
      if (!moving()) return resolve()
      if (Date.now() - from > timeout) {
        const still = page.querySelector("[data-starting-style], [data-ending-style]")
        return reject(
          new Error(
            `still moving after ${timeout} ms: ${
              still ? `<${still.tagName.toLowerCase()}> in its first or last frame` : "an animation"
            }`
          )
        )
      }
      setTimeout(look, 20)
    }
    // A turn of the event loop first: a framework that renders in a task of its own has not
    // started when a click returns.
    setTimeout(look, 20)
  })
}

/** One call of a change callback, as a test reads it. */
export interface Heard<Value> {
  readonly value: Value
  readonly reason: string
  readonly source: ChangeDetails["source"]
}

export interface Recorder<Value> {
  /** Give this as the callback: `onValueChange: heard.listen`. */
  listen(value: Value, details: ChangeDetails): void
  /** Every call so far, in order. */
  readonly calls: readonly Heard<Value>[]
  /** The calls as `"value reason"`, for one assertion over all of them. */
  said(): string[]
  /** From now on, every change is refused (`details.cancel()`), or let through again. */
  refuse(on?: boolean): void
  clear(): void
}

/** Records what a change callback hears, and can refuse what it is asked. */
export function recorder<Value = unknown>(): Recorder<Value> {
  const calls: Heard<Value>[] = []
  let refusing = false
  return {
    calls,
    listen(value, details) {
      calls.push({ value, reason: details.reason, source: details.source })
      if (refusing) details.cancel()
    },
    said: () => calls.map((each) => `${String(each.value)} ${each.reason}`),
    refuse(on = true) {
      refusing = on
    },
    clear: () => void calls.splice(0),
  }
}

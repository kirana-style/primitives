import type { ReadonlySignal } from "./reactivity.ts"

/**
 * What a part puts on its element, in one neutral shape every adapter maps to its framework:
 * attributes by their HTML names (`tabindex`, `aria-expanded`, `data-open`), where `undefined`
 * leaves the attribute out and a boolean state is `""` or absent, never `"false"`; handlers by
 * camel-cased event names (`onClick`, `onKeyDown`); and, for the few parts whose value is a
 * length (a progress bar's indicator), a `style` of that geometry, which a server can render.
 * Geometry that is measured is not here: the service that measures it writes it on the element.
 */
export type PartProps = Record<string, unknown>

export interface Part {
  /** The part's props, the same object until one of them changes. */
  readonly props: ReadonlySignal<PartProps>
  /** DOM work for the part's element (focus, measures, layers). Returns the cleanup. */
  attach(element: HTMLElement): () => void
}

/** A boolean state as an attribute: present and empty, or absent. */
export function flag(on: unknown): "" | undefined {
  return on ? "" : undefined
}

export interface ChangeDetails {
  /** Why the value changed: `"trigger-press"`, `"outside-press"`, `"escape-key"`, `"item-press"` … */
  readonly reason: string
  /** The DOM event behind it, when there is one. */
  readonly event: Event | undefined
  /**
   * What made it: a mouse, a finger, a pen, the keyboard, something that presses without a
   * pointer (a screen reader, `element.click()`), code with no event at all, or an agent
   * acting through the bridge (`@kirana-ui/core/agent`).
   */
  readonly source: ChangeSource
  /** Keeps the value as it was. */
  cancel(): void
  readonly canceled: boolean
}

export type ChangeSource =
  | "mouse"
  | "touch"
  | "pen"
  | "keyboard"
  | "virtual"
  | "programmatic"
  | "agent"

// How many agent actions are under way: a change made while one is, is the agent's.
let acting = 0

/**
 * Runs what an agent asked for. Every change a component makes while it runs says
 * `source: "agent"`, so a caller's callback can tell it from a person's, and refuse it.
 */
export function asAgent<Result>(run: () => Result): Result {
  acting++
  try {
    return run()
  } finally {
    acting--
  }
}

/** What made an event, read from the event: nothing is remembered between events. */
function sourceOf(event: Event | undefined): ChangeSource {
  if (!event) return "programmatic"
  const type = (event as PointerEvent).pointerType
  if (type === "mouse" || type === "touch" || type === "pen") return type
  if (event.type.startsWith("key")) return "keyboard"
  // A click no pointer made: Enter or Space on a button, a screen reader's press, code.
  if (event.type === "click" && (event as MouseEvent).detail === 0) return "virtual"
  if (event.type.startsWith("mouse") || event.type === "click" || event.type === "contextmenu")
    return "mouse"
  if (event.type.startsWith("touch")) return "touch"
  return "virtual"
}

export function details(reason: string, event?: Event): ChangeDetails {
  let canceled = false
  // Known when the change is made: it may be read long after the agent's turn is over.
  const agent = acting > 0
  return {
    reason,
    event,
    get source() {
      return agent ? "agent" : sourceOf(event)
    },
    cancel() {
      canceled = true
    },
    get canceled() {
      return canceled
    },
  }
}

/** A caller's handler calls this on the event to stop the part's own handler for it. */
export const PREVENT = "preventKiranaHandler"

const prevented = new WeakSet<object>()

/** Gives an event its `preventKiranaHandler()`, before a caller's handler sees it. */
export function preventable(event: Event): void {
  ;(event as Event & { [PREVENT]?: () => void })[PREVENT] ??= () => prevented.add(event)
}

/** Whether a caller's handler asked the part's own to stay out of this event. */
export function isPrevented(event: Event): boolean {
  return prevented.has(event)
}

/**
 * Merges a caller's props with a part's, the one rule every adapter uses: the part's attributes
 * win (its identity survives composition), classes join, and for an event the caller's handler
 * runs first and the part's follows unless the caller called `event.preventKiranaHandler()`.
 * `class` and `className` are both read as the caller's class.
 */
export function mergeProps(caller: PartProps | undefined, part: PartProps): PartProps {
  if (!caller) return part
  const merged: PartProps = { ...caller }
  for (const key in part) {
    const own = part[key]
    const theirs = caller[key]
    // By value, not by name: an adapter merges after renaming handlers to its framework's.
    if (key.startsWith("on") && typeof own === "function" && typeof theirs === "function") {
      merged[key] = (event: Event) => {
        preventable(event)
        ;(theirs as (event: Event) => void)(event)
        if (!prevented.has(event)) (own as (event: Event) => void)(event)
      }
    } else if (key === "style" && own !== undefined && theirs !== undefined) {
      merged[key] = mergeStyle(theirs, own)
    } else if (own !== undefined || !(key in caller)) {
      merged[key] = own
    }
  }
  return merged
}

/** A part's `style`: property names as CSS writes them (`width`, `--thumb-offset`). */
export type PartStyle = Record<string, string>

/** A style as the text of a `style` attribute. */
export function styleText(style: PartStyle): string {
  return Object.entries(style)
    .map(([name, value]) => `${name}: ${value}`)
    .join("; ")
}

const plain = (value: unknown): value is PartStyle =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/** The caller's style with the part's over it, in whichever form the caller's framework writes. */
function mergeStyle(theirs: unknown, own: unknown): unknown {
  if (plain(theirs) && plain(own)) return { ...theirs, ...own }
  if (typeof theirs === "string") {
    const text = plain(own) ? styleText(own) : String(own)
    return `${theirs.trim().replace(/;$/, "")}; ${text}`
  }
  // A list is how Vue takes several: it reads them in order.
  return [theirs, own]
}

/** A state of a part in the vocabulary: the attribute that marks it, and what it means. */
export interface StateDefinition {
  attribute: string
  /** The values the attribute takes; absent for a state the attribute marks by being present. */
  values?: readonly string[]
  description: string
}

/** A part of a component in the vocabulary: its states, its CSS variables. */
export interface PartDefinition {
  description: string
  states?: Record<string, StateDefinition>
  /** Groups of states that never hold together on the element. */
  exclusive?: readonly (readonly string[])[]
  /** CSS custom properties the part's element carries, each with what it holds. */
  variables?: Record<string, string>
}

export type ComponentDefinition = Record<string, PartDefinition>

export function defineComponent<const T extends ComponentDefinition>(definition: T): T {
  return definition
}

/**
 * Whether two props objects say the same. Functions are equal to functions: a callback is read
 * when it is called, so a new one each render changes nothing.
 */
export function sameProps(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  for (const key in a) {
    if (typeof a[key] === "function" && typeof b[key] === "function") continue
    if (!Object.is(a[key], b[key])) return false
  }
  for (const key in b) if (!(key in a)) return false
  return true
}

/** An options object without its `undefined` entries, so a default is not overwritten by one. */
export function defined<T extends object>(options: T): Partial<T> {
  const out: Partial<T> = {}
  for (const key in options) if (options[key] !== undefined) out[key] = options[key]
  return out
}

/** A controller's maker with what is around the component (the field it is in) already given. */
export function within<P, A, C>(
  create: (props: ReadonlySignal<P>, around: A) => C,
  around: A
): (props: ReadonlySignal<P>) => C {
  return (props) => create(props, around)
}

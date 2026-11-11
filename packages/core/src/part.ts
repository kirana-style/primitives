import type { ReadonlySignal } from "./reactivity.ts"

/**
 * What a part puts on its element, in one neutral shape every adapter maps to its framework:
 * attributes by their HTML names (`tabindex`, `aria-expanded`, `data-open`), where `undefined`
 * leaves the attribute out and a boolean state is `""` or absent, never `"false"`; and handlers
 * by camel-cased event names (`onClick`, `onKeyDown`). No styles: geometry is written on the
 * element by the service that measures it.
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
  /** Keeps the value as it was. */
  cancel(): void
  readonly canceled: boolean
}

export function details(reason: string, event?: Event): ChangeDetails {
  let canceled = false
  return {
    reason,
    event,
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
    } else if (own !== undefined || !(key in caller)) {
      merged[key] = own
    }
  }
  return merged
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

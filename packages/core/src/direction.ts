import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export type Direction = "ltr" | "rtl"

export interface DirectionProps {
  /** The reading direction of what is inside. `ltr` when left out. */
  direction?: Direction | undefined
}

export interface DirectionProvider {
  readonly direction: ReadonlySignal<Direction>
  mount(): () => void
}

/** What a component takes from the provider it is inside, if it is inside one. */
export interface DirectionAround {
  direction?: ReadonlySignal<Direction> | undefined
}

const NOTHING = () => {}

/**
 * States the reading direction for the components inside, where the page cannot be asked: on a
 * server, which has no layout to read. It draws nothing and writes no `dir`: the page's own `dir`
 * attribute is still what lays the text out, and the two are set together.
 */
export function createDirection(props: ReadonlySignal<DirectionProps>): DirectionProvider {
  return {
    direction: computed(() => props.get().direction ?? "ltr"),
    mount: () => NOTHING,
  }
}

/**
 * The reading direction a component works in: what its provider states, and with no provider
 * the direction the element is laid out in, which follows the nearest `dir`.
 */
export function directionOf(element: Element, given?: ReadonlySignal<Direction>): Direction {
  if (given) return given.peek()
  const style = element.ownerDocument.defaultView?.getComputedStyle(element)
  return style?.direction === "rtl" ? "rtl" : "ltr"
}

/**
 * Gives a popup that was moved out of its place (to the end of `<body>`) the reading direction
 * of where it came from, as a `dir` attribute: the `dir` on a part of the page does not reach
 * it there. Nothing is written when the two agree, or when the popup has a `dir` of its own.
 * Returns the removal.
 */
export function carryDirection(popup: HTMLElement, from: Element): () => void {
  if (popup.hasAttribute("dir")) return NOTHING
  const wanted = directionOf(from)
  if (directionOf(popup) === wanted) return NOTHING
  popup.setAttribute("dir", wanted)
  return () => popup.removeAttribute("dir")
}

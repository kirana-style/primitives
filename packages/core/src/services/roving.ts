import { directionOf } from "../direction.ts"
import type { Direction } from "../direction.ts"
import type { ReadonlySignal } from "../reactivity.ts"

export type Orientation = "horizontal" | "vertical"

export interface Roving {
  /** Adds an element to the set the arrows move between. Returns the removal. */
  register(element: HTMLElement): () => void
  /** The elements that can take focus, in document order. */
  enabled(): HTMLElement[]
  /**
   * Moves focus for an arrow key, Home or End, and says where it went; `undefined` when the key
   * is not one of them or focus is not on one of the set.
   */
  move(
    event: KeyboardEvent,
    options: {
      orientation: Orientation | "both"
      loop?: boolean
      /** What a direction provider states; the element's own direction without one. */
      direction?: ReadonlySignal<Direction> | undefined
    }
  ): HTMLElement | undefined
}

export type Step = 1 | -1 | "first" | "last"

/**
 * Where a step lands in a list of `length` rows, from the row at `index` (`-1` for none). Past
 * an end it wraps when `loop` is set and stays on the end otherwise.
 */
export function stepTo(length: number, index: number, step: Step, loop: boolean): number {
  if (step === "first") return 0
  if (step === "last") return length - 1
  if (loop) return (index + step + length) % length
  return Math.min(length - 1, Math.max(0, index + step))
}

/**
 * Arrow-key navigation over a set of elements: a tab list, a radio group, an accordion's
 * triggers. The set is the elements that registered, not a selector, so the same component
 * nested inside itself keeps its own; their order is the page's, read when a key needs it.
 * Left and right follow the reading direction: the provider's, or where the element is.
 */
export function createRoving(): Roving {
  const set = new Set<HTMLElement>()

  function enabled() {
    return [...set]
      .filter(
        (each) =>
          each.isConnected &&
          !each.hasAttribute("disabled") &&
          each.getAttribute("aria-disabled") !== "true"
      )
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
  }

  return {
    register(element) {
      set.add(element)
      return () => void set.delete(element)
    },
    enabled,
    move(event, { orientation, loop = true, direction }) {
      const current = event.currentTarget as HTMLElement
      const target = set.has(event.target as HTMLElement)
        ? (event.target as HTMLElement)
        : [...set].find((each) => each.contains(event.target as Node))
      // A key from the same component nested inside one of these is not ours.
      if (!target || (current !== target && !current.contains(target))) return undefined
      const vertical = orientation !== "horizontal"
      const horizontal = orientation !== "vertical"
      const rtl = directionOf(target, direction) === "rtl"
      let step: Step | undefined
      if (event.key === "Home") step = "first"
      else if (event.key === "End") step = "last"
      else if (vertical && event.key === "ArrowDown") step = 1
      else if (vertical && event.key === "ArrowUp") step = -1
      else if (horizontal && event.key === "ArrowRight") step = rtl ? -1 : 1
      else if (horizontal && event.key === "ArrowLeft") step = rtl ? 1 : -1
      if (step === undefined) return undefined

      const list = enabled()
      if (list.length === 0) return undefined
      event.preventDefault()
      const element = list[stepTo(list.length, list.indexOf(target), step, loop)]!
      element.focus()
      return element
    },
  }
}

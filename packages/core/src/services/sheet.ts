import { flag } from "../part.ts"
import type { ChangeDetails } from "../part.ts"
import { computed, effect, untracked } from "../reactivity.ts"
import type { ReadonlySignal } from "../reactivity.ts"
import { clearGeometry } from "./geometry.ts"
import { createSwipe } from "./swipe.ts"
import type { Swipe } from "./swipe.ts"

/**
 * How a list opens: `"popup"` placed against its trigger, `"sheet"` from the bottom edge of the
 * viewport, `"auto"` a sheet on a narrow touch screen and a popup elsewhere.
 */
export type Presentation = "popup" | "sheet" | "auto"

/** What a select or a combobox is told of how its list opens. */
export interface SheetProps {
  /**
   * How the list opens. `"sheet"`: from the bottom edge, modal, with a backdrop, swiped down or
   * pressed outside to close. `"auto"`: decided each time it opens, a sheet when the pointer
   * is coarse and the viewport narrower than `sheetBelow`. Default `"popup"`.
   */
  presentation?: Presentation | undefined
  /** With `"auto"`: the viewport's width, in CSS pixels, under which a coarse pointer opens a sheet. Default 640. */
  sheetBelow?: number | undefined
}

/** What a placed popup writes on its positioner, taken off when it opens as a sheet instead. */
const PLACED = [
  "position",
  "left",
  "top",
  "transform",
  "--transform-origin",
  "--available-width",
  "--available-height",
  "--anchor-width",
  "--anchor-height",
]

/** Whether a list opening now with `"auto"` opens as a sheet: a coarse pointer, a narrow viewport. */
export function fitsSheet(below = 640): boolean {
  if (typeof matchMedia !== "function") return false
  return matchMedia(`(pointer: coarse) and (max-width: ${below - 0.02}px)`).matches
}

export interface Sheet {
  /** Whether the list is open as a sheet: decided as it opens, and kept through its exit. */
  readonly on: ReadonlySignal<boolean>
  readonly swipe: Swipe
  /** What the positioner, the popup and the backdrop say of it. */
  state(): Record<string, string | undefined>
  /**
   * For the positioner's `attach`: `place` is how it is placed against its trigger, done only
   * while it is a popup. As a sheet it is not placed, and what a placement wrote is taken off.
   */
  positioner(element: HTMLElement, place: (element: HTMLElement) => () => void): () => void
}

/**
 * A list that can open as a sheet from the bottom edge: the decision, the drag that closes it
 * (a drawer's, through `createSwipe`, and the drawer's variables), and the placement it then
 * goes without. The popup it is given is made modal by the component while `on` holds.
 */
export function createSheet(
  open: ReadonlySignal<boolean>,
  given: () => SheetProps,
  close: (by: ChangeDetails) => void
): Sheet {
  // Each time it opens: a viewport that changes while it is open does not change what it is.
  let was = false
  let decided = false
  const on = computed(() => {
    const { presentation = "popup", sheetBelow } = given()
    const now = open.get()
    if (presentation !== "auto") decided = presentation === "sheet"
    else if (now && !was) decided = fitsSheet(sheetBelow)
    was = now
    return decided
  })
  const swipe = createSwipe({
    way: () => "down",
    points: () => [1],
    resting: () => 1,
    settle: () => {},
    close(by) {
      close(by)
      return !by.canceled
    },
  })
  return {
    on,
    swipe,
    state: () => ({
      "data-presentation": on.get() ? "sheet" : "popup",
      "data-swiping": flag(swipe.swiping.get()),
      "data-swipe-dismiss": flag(swipe.dismissed.get()),
    }),
    positioner(element, place) {
      let placed: (() => void) | undefined
      const stops = [
        effect(() => {
          const sheet = on.get()
          untracked(() => {
            if (!sheet) return void (placed ??= place(element))
            if (!placed) return
            placed()
            placed = undefined
            // Only what a placement wrote: a style of the caller's stays.
            for (const name of PLACED) clearGeometry(element, name)
          })
        }),
        // Opened again, it begins where it lies, not where it was last let go.
        effect(() => {
          if (!open.get()) return
          untracked(() => {
            swipe.clear()
            swipe.dismissed.set(false)
            for (const each of swipe.written()) clearGeometry(each, "--drawer-swipe-strength")
          })
        }),
      ]
      return () => {
        for (const stop of stops.reverse()) stop()
        placed?.()
      }
    },
  }
}

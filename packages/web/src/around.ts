import { computed } from "@kirana-ui/core"
import type { Part, PositionOptions, ReadonlySignal, Signal } from "@kirana-ui/core"
import type { Field } from "@kirana-ui/core/field"

import { controllerAround } from "./runtime.ts"
import type { Drawn } from "./runtime.ts"

/** The field a control is in, if it is in one. */
export const fieldAround = (host: HTMLElement): Field | undefined =>
  controllerAround<Field>(host, "kui-field")

/** Several values, as an attribute writes them: `default-value="a,b"`. */
export const list = (given: unknown): string[] | undefined =>
  typeof given === "string" ? given.split(",").filter(Boolean) : (given as string[] | undefined)

/** A part's own options: `kui-disabled`, and its text when it is not what is typed (`kui-label`). */
export const options = (element: HTMLElement) => () => ({
  ...(element.hasAttribute("kui-disabled") ? { disabled: true } : {}),
  ...(element.hasAttribute("kui-label") ? { label: element.getAttribute("kui-label")! } : {}),
})

/** The value an element is the part for: `kui-value`. */
export const valueOf = (element: HTMLElement | null): string =>
  element?.getAttribute("kui-value") ?? ""

let named = 0
const names = new WeakMap<HTMLElement, string>()

/**
 * The value of an element that was given none: a name of its own, the same each time it is
 * asked for. An item with no `kui-value`, a thumb with no `kui-index`.
 */
export function ownValue(element: HTMLElement | null): string {
  if (!element) return ""
  let name = names.get(element)
  if (!name) names.set(element, (name = `kui-own-${++named}`))
  return name
}

/** What is made once for an element and shared by the parts inside it: an item, a group. */
export function once<Made extends object>(
  kept: WeakMap<HTMLElement, Made>,
  element: HTMLElement | null,
  make: (element: HTMLElement) => Made
): Made | undefined {
  if (!element) return undefined
  let made = kept.get(element)
  if (!made) kept.set(element, (made = make(element)))
  return made
}

const number = (text: string | null) => (text === null ? undefined : Number(text))

const PLACING = [
  "kui-side",
  "kui-align",
  "kui-side-offset",
  "kui-align-offset",
  "kui-collision-padding",
  "kui-anchor",
]

/**
 * Where a positioner goes, as its own attributes say: `kui-side`, `kui-align`,
 * `kui-side-offset`, `kui-align-offset`, `kui-collision-padding`, and `kui-anchor`, the id of
 * the element the popup is placed against when that is not its trigger. Written before the
 * part is put on, so the first placement reads them.
 */
export function place(
  positioning: Signal<Partial<PositionOptions>>,
  element: HTMLElement,
  more: Record<string, unknown> = {}
): void {
  const against = element.getAttribute("kui-anchor")
  const asked: Record<string, unknown> = {
    side: element.getAttribute("kui-side") ?? undefined,
    align: element.getAttribute("kui-align") ?? undefined,
    sideOffset: number(element.getAttribute("kui-side-offset")),
    alignOffset: number(element.getAttribute("kui-align-offset")),
    collisionPadding: number(element.getAttribute("kui-collision-padding")),
    // Looked for each time the popup is placed: the element may come into the page later.
    anchor: against === null ? undefined : () => element.ownerDocument.getElementById(against),
    ...more,
  }
  for (const key of Object.keys(asked)) if (asked[key] === undefined) delete asked[key]
  positioning.set(asked as Partial<PositionOptions>)
}

/**
 * A positioner as a part: the one place a component draws one. Its attributes are read
 * before it is put on, and again when one of them changes: a popup that is open follows.
 */
export function positioner(
  controller: {
    positioning: Signal<Partial<PositionOptions>>
    mounted: ReadonlySignal<boolean>
    positioner: Part
  },
  element: HTMLElement
): Drawn {
  place(controller.positioning, element)
  return {
    mounted: controller.mounted,
    part: controller.positioner,
    mount() {
      const observer = new MutationObserver(() => place(controller.positioning, element))
      observer.observe(element, { attributes: true, attributeFilter: PLACING })
      return () => observer.disconnect()
    },
  }
}

/** A mark an item shows while it is chosen: nothing a screen reader says. */
export const MARK: Part = {
  props: computed(() => ({ "aria-hidden": "true" })),
  attach: () => () => {},
}

/** An item's options in a list that is filtered or typed through: with `kui-label`, and an id. */
export const itemOptions = (element: HTMLElement, id?: string) => () => ({
  ...(element.hasAttribute("kui-disabled") ? { disabled: true } : {}),
  ...(element.hasAttribute("kui-label") ? { label: element.getAttribute("kui-label")! } : {}),
  ...(id === undefined ? {} : { id }),
})

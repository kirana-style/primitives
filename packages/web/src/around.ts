import { computed } from "@kirana-ui/core"
import type { Part, PositionOptions, Signal } from "@kirana-ui/core"
import type { Field } from "@kirana-ui/core/field"

import { controllerAround } from "./runtime.ts"

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

/**
 * Where a positioner goes, as its own attributes say: `kui-side`, `kui-align`,
 * `kui-side-offset`, `kui-align-offset`, `kui-collision-padding`. Written before the part is
 * put on, so the first placement reads them.
 */
export function place(
  positioning: Signal<Partial<PositionOptions>>,
  element: HTMLElement,
  more: Record<string, unknown> = {}
): void {
  const asked: Record<string, unknown> = {
    side: element.getAttribute("kui-side") ?? undefined,
    align: element.getAttribute("kui-align") ?? undefined,
    sideOffset: number(element.getAttribute("kui-side-offset")),
    alignOffset: number(element.getAttribute("kui-align-offset")),
    collisionPadding: number(element.getAttribute("kui-collision-padding")),
    ...more,
  }
  for (const key of Object.keys(asked)) if (asked[key] === undefined) delete asked[key]
  positioning.set(asked as Partial<PositionOptions>)
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

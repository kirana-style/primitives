import { createSteps } from "@kirana-ui/core/steps"
import type { Steps, StepsItem, StepsProps } from "@kirana-ui/core/steps"

import { once } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

const indexOf = (element: HTMLElement | null) => Number(element?.getAttribute("kui-index") ?? 0)
/** An item's `kui-index`, or nothing: it is then counted from the page. */
const given = (element: HTMLElement) =>
  element.hasAttribute("kui-index") ? indexOf(element) : undefined
const items = new WeakMap<HTMLElement, StepsItem>()
const itemFor = (controller: Steps, element: HTMLElement | null) =>
  once(items, element, (item) => controller.item(given(item)))
/** The step of the item a part is inside: its index, given or counted. */
const itemOf = (controller: Steps, element: HTMLElement) =>
  itemFor(controller, partAround(element, "item"))?.index ?? 0

/**
 * `<kui-steps>` around `kui-part="root"`, a `list` with an `item` for each step (`kui-index`,
 * from 0, or its place in the page when it has none) holding its `trigger` (with an `indicator` inside) and a `separator`, a `content`
 * for each step (`kui-index`), a `completed`, and `previous` and `next` buttons. `step`,
 * `default-step`, `count` (the items in the page when it is left out), `linear`, `orientation`; it tells `step-change`.
 */
export const tag = defineElement<StepsProps, Steps>({
  tag: "kui-steps",
  props: {
    step: "number",
    "default-step": "number",
    count: "number",
    linear: "boolean",
    orientation: "string",
  },
  create: (props) => createSteps(props),
  changes: { onStepChange: { event: "step-change", prop: "step" } },
  parts: {
    root: (controller) => controller.root,
    list: (controller) => controller.list,
    item: (controller, element) => itemFor(controller, element),
    trigger: (controller, element) => controller.trigger(itemOf(controller, element)),
    indicator: (controller, element) => controller.indicator(itemOf(controller, element)),
    separator: (controller, element) => controller.separator(itemOf(controller, element)),
    content: (controller, element) => controller.content(indexOf(element)),
    completed: (controller) => controller.completed,
    previous: (controller) => controller.previous,
    next: (controller) => controller.next,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-steps": ElementOf<typeof tag, { "step-change": ["onStepChange", "step"] }>
  }
}

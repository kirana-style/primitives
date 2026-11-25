import { createSteps } from "@kirana-ui/core/steps"
import type { Steps, StepsProps } from "@kirana-ui/core/steps"

import { defineElement, partAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

const indexOf = (element: HTMLElement | null) => Number(element?.getAttribute("kui-index") ?? 0)
/** The step of the item a part is inside. */
const itemOf = (element: HTMLElement) => indexOf(partAround(element, "item"))

/**
 * `<kui-steps>` around `kui-part="root"`, a `list` with an `item` for each step (`kui-index`,
 * from 0) holding its `trigger` (with an `indicator` inside) and a `separator`, a `content`
 * for each step (`kui-index`), a `completed`, and `previous` and `next` buttons. `step`,
 * `default-step`, `count`, `linear`, `orientation`; it tells `step-change`.
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
    item: (controller, element) => controller.item(indexOf(element)),
    trigger: (controller, element) => controller.trigger(itemOf(element)),
    indicator: (controller, element) => controller.indicator(itemOf(element)),
    separator: (controller, element) => controller.separator(itemOf(element)),
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

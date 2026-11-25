import { computed } from "@kirana-ui/core"
import { createTour } from "@kirana-ui/core/tour"
import type { Tour, TourProps, TourStep } from "@kirana-ui/core/tour"

import { positioner } from "./around.ts"
import type { Placed } from "./around.ts"
import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

type Props = Omit<TourProps, "steps"> & { steps?: readonly TourStep[] | undefined }

const NONE: readonly TourStep[] = []

/**
 * `<kui-tour>` around a `kui-part="portal"`, drawn at the end of the page while a step is
 * shown, which holds a `spotlight` and a `positioner` (`kui-side`, `kui-align`,
 * `kui-side-offset` and the like) around the `popup`, with an `arrow`, a `title`, a
 * `description`, and `previous`, `next` and `close` buttons. What a step says is the page's to
 * write: its `controller` has the step shown (`shown`), its place (`current`) and how many
 * there are (`total`). `steps` as a property; `open`, `default-open`, `step`, `default-step`,
 * `wait-for-target`, `spotlight-padding`, `close-on-outside-press`, `interactive`,
 * `keyboard-navigation`; it tells `open-change` and `step-change`.
 */
export const tag = defineElement<Props & { id: string }, Tour>({
  tag: "kui-tour",
  props: {
    open: "boolean",
    "default-open": "boolean",
    step: "number",
    "default-step": "number",
    "wait-for-target": "number",
    "spotlight-padding": "number",
    "close-on-outside-press": "boolean",
    interactive: "boolean",
    "keyboard-navigation": "boolean",
  },
  properties: ["steps"],
  create: (props) =>
    createTour(
      computed(() => {
        const own = props.get()
        // Given as a property, which a page sets once the element is defined.
        return { ...own, steps: own.steps ?? NONE }
      })
    ),
  changes: {
    onOpenChange: { event: "open-change", prop: "open" },
    onStepChange: { event: "step-change", prop: "step" },
  },
  parts: {
    spotlight: (controller) => controller.spotlight,
    positioner,
    popup: (controller) => controller.popup,
    arrow: (controller) => controller.arrow,
    title: (controller) => controller.title,
    description: (controller) => controller.description,
    previous: (controller) => controller.previous,
    next: (controller) => controller.next,
    close: (controller) => controller.close,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-tour": ElementOf<
      typeof tag,
      { "open-change": ["onOpenChange", "open"]; "step-change": ["onStepChange", "step"] }
    > &
      Placed
  }
}

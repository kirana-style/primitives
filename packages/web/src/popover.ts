import { computed } from "@kirana-ui/core"
import { createPopover } from "@kirana-ui/core/popover"
import type { Popover, PopoverProps } from "@kirana-ui/core/popover"

import { positioner } from "./around.ts"
import type { Placed } from "./around.ts"
import { defineElement } from "./runtime.ts"
import type { As, ElementOf } from "./runtime.ts"

const number = (text: string | null) => (text === null ? undefined : Number(text))

/** `modal` as its attribute writes it: there or not, `"false"`, or `"trap-focus"`. */
const modalOf = (given: unknown): PopoverProps["modal"] =>
  given === "trap-focus" ? given : given !== undefined && given !== false && given !== "false"

/**
 * `<kui-popover>` around a `kui-part="trigger"` button and a `portal`, drawn at the end of the
 * page while it is open, with a `positioner` (`kui-side`, `kui-align`, `kui-side-offset`,
 * `kui-align-offset`, `kui-collision-padding`, and `kui-anchor`: the id of the element it is
 * placed against, when that is not the trigger) around the `popup`, which may hold an `arrow`,
 * a `title`, a `description` and a `close` button; the portal may hold a `backdrop` too. The
 * trigger takes `kui-open-on-hover`, with `kui-delay` and `kui-close-delay`. `open`,
 * `default-open`, `modal` (there, or `"trap-focus"`); it tells `open-change`.
 */
export const tag = defineElement<PopoverProps, Popover>({
  tag: "kui-popover",
  props: { open: "boolean", "default-open": "boolean", modal: "string" },
  create: (props) =>
    createPopover(
      computed(() => {
        const own = props.get()
        return { ...own, modal: modalOf(own.modal) }
      })
    ),
  changes: { onOpenChange: { event: "open-change", prop: "open" } },
  parts: {
    trigger(controller, element) {
      const delay = number(element.getAttribute("kui-delay"))
      const closeDelay = number(element.getAttribute("kui-close-delay"))
      const hover = element.getAttribute("kui-open-on-hover")
      controller.hovering.set({
        ...(hover === null ? {} : { openOnHover: hover !== "false" }),
        ...(delay === undefined ? {} : { delay }),
        ...(closeDelay === undefined ? {} : { closeDelay }),
      })
      return controller.trigger
    },
    backdrop: (controller) => ({ mounted: controller.mounted, part: controller.backdrop }),
    positioner,
    popup: (controller) => controller.popup,
    arrow: (controller) => controller.arrow,
    title: (controller) => controller.title,
    description: (controller) => controller.description,
    close: (controller) => controller.close,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-popover": ElementOf<
      As<typeof tag, PopoverProps>,
      { "open-change": ["onOpenChange", "open"] }
    > &
      Placed
  }
}

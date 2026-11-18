import type { ReadonlySignal } from "@kirana-ui/core"
import type { HoverPopup, HoverPopupProps } from "@kirana-ui/core/tooltip"

import { positioner } from "./around.ts"
import { defineElement } from "./runtime.ts"
import type { Tag } from "./runtime.ts"

const number = (text: string | null) => (text === null ? undefined : Number(text))

/** The element of a popup the pointer opens: a tooltip's, a hover card's. */
export const hoverPopup = (
  tag: string,
  create: (props: ReadonlySignal<HoverPopupProps>) => HoverPopup
): Tag<HoverPopupProps, HoverPopup> =>
  defineElement<HoverPopupProps, HoverPopup>({
    tag,
    props: {
      open: "boolean",
      "default-open": "boolean",
      delay: "number",
      "close-delay": "number",
      disabled: "boolean",
    },
    create,
    changes: { onOpenChange: { event: "open-change", prop: "open" } },
    parts: {
      trigger(controller, element) {
        const delay = number(element.getAttribute("kui-delay"))
        const closeDelay = number(element.getAttribute("kui-close-delay"))
        controller.timing.set({
          ...(delay === undefined ? {} : { delay }),
          ...(closeDelay === undefined ? {} : { closeDelay }),
        })
        return controller.trigger
      },
      positioner,
      popup: (controller) => controller.popup,
      arrow: (controller) => controller.arrow,
    },
  })

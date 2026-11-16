import type { ReadonlySignal } from "@kirana-ui/core"
import type { HoverPopup, HoverPopupProps } from "@kirana-ui/core/tooltip"

import { place } from "./around.ts"
import { defineElement } from "./runtime.ts"

const number = (text: string | null) => (text === null ? undefined : Number(text))

/** The element of a popup the pointer opens: a tooltip's, a hover card's. */
export const hoverPopup = (
  tag: string,
  create: (props: ReadonlySignal<HoverPopupProps>) => HoverPopup
): string =>
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
      positioner(controller, element) {
        place(controller.positioning, element)
        return { mounted: controller.mounted, part: controller.positioner }
      },
      popup: (controller) => controller.popup,
      arrow: (controller) => controller.arrow,
    },
  })

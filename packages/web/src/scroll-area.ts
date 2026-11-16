import type { Orientation } from "@kirana-ui/core"
import { createScrollArea } from "@kirana-ui/core/scroll-area"

import { defineElement, partAround } from "./runtime.ts"

const way = (element: HTMLElement | null): Orientation =>
  element?.getAttribute("kui-orientation") === "horizontal" ? "horizontal" : "vertical"

/**
 * `<kui-scroll-area>` around `kui-part="root"`, a `viewport` with its `content`, a `scrollbar`
 * for each way (`kui-orientation="horizontal"` for the one across) with its `thumb`, and a
 * `corner`. A scrollbar is in the page while there is something to scroll its way.
 */
export const tag = defineElement({
  tag: "kui-scroll-area",
  props: {},
  create: (props) => createScrollArea(props as never),
  changes: {},
  parts: {
    root: (controller) => controller.root,
    viewport: (controller) => controller.viewport,
    content: (controller) => controller.content,
    scrollbar(controller, element) {
      const bar = controller.scrollbar(way(element))
      return { part: bar.part, mounted: bar.shown }
    },
    thumb: (controller, element) =>
      controller.scrollbar(way(partAround(element, "scrollbar"))).thumb,
    corner: (controller) => ({ part: controller.corner.part, mounted: controller.corner.shown }),
  },
})

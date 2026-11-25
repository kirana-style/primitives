import type { Part } from "@kirana-ui/core"
import { createCarousel } from "@kirana-ui/core/carousel"
import type { Carousel, CarouselProps } from "@kirana-ui/core/carousel"

import { once } from "./around.ts"
import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

const indexOf = (element: HTMLElement) => Number(element.getAttribute("kui-index") ?? 0)
const slides = new WeakMap<HTMLElement, Part>()

/**
 * `<kui-carousel>` around `kui-part="root"`, a `viewport` with an `item` for each slide
 * (`kui-index`, from 0, or its place in the page when it has none), `previous` and `next` buttons, and an `indicator` button for a slide
 * (`kui-index`). `index`, `default-index`, `orientation`, `loop`; it tells `index-change`.
 */
export const tag = defineElement<CarouselProps, Carousel>({
  tag: "kui-carousel",
  props: { index: "number", "default-index": "number", orientation: "string", loop: "boolean" },
  create: (props) => createCarousel(props),
  changes: { onIndexChange: { event: "index-change", prop: "index" } },
  parts: {
    root: (controller) => controller.root,
    viewport: (controller) => controller.viewport,
    // A slide with no `kui-index` is counted from the page, and made once for its element.
    item: (controller, element) =>
      once(slides, element, () =>
        controller.item(element.hasAttribute("kui-index") ? indexOf(element) : undefined)
      ),
    previous: (controller) => controller.previous,
    next: (controller) => controller.next,
    indicator: (controller, element) => controller.indicator(indexOf(element)),
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-carousel": ElementOf<typeof tag, { "index-change": ["onIndexChange", "index"] }>
  }
}

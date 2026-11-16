import { createCarousel } from "@kirana-ui/core/carousel"
import type { Carousel, CarouselProps } from "@kirana-ui/core/carousel"

import { defineElement } from "./runtime.ts"

const indexOf = (element: HTMLElement) => Number(element.getAttribute("kui-index") ?? 0)

/**
 * `<kui-carousel>` around `kui-part="root"`, a `viewport` with an `item` for each slide
 * (`kui-index`, from 0), `previous` and `next` buttons, and an `indicator` button for a slide
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
    item: (controller, element) => controller.item(indexOf(element)),
    previous: (controller) => controller.previous,
    next: (controller) => controller.next,
    indicator: (controller, element) => controller.indicator(indexOf(element)),
  },
})

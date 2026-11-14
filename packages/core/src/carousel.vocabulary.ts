import { defineComponent } from "./part.ts"
import { DISABLED, state, valued } from "./states.ts"

const ORIENTATION = valued(
  "data-orientation",
  ["horizontal", "vertical"],
  "Whether the slides go across or down."
)
const CURRENT = state("data-current", "Present on the slide the view is at, and on its button.")

export const carouselVocabulary = defineComponent({
  root: {
    description: "The carousel: a region, named by the caller.",
    states: { orientation: ORIENTATION },
  },
  viewport: {
    description:
      "What scrolls. The slides are its children; the design snaps them (`scroll-snap-type`) and says whether a step glides (`scroll-behavior`).",
    states: { orientation: ORIENTATION },
  },
  item: { description: "One slide.", states: { orientation: ORIENTATION, current: CURRENT } },
  previous: { description: "Goes back a slide.", states: { disabled: DISABLED } },
  next: { description: "Goes on a slide.", states: { disabled: DISABLED } },
  indicator: { description: "A button for one slide.", states: { current: CURRENT } },
})

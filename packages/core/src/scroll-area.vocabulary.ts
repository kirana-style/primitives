import { defineComponent } from "./part.ts"
import { state, valued } from "./states.ts"

const OVERFLOW = {
  hasOverflowX: state("data-has-overflow-x", "Present when there is more to see sideways."),
  hasOverflowY: state("data-has-overflow-y", "Present when there is more to see up or down."),
  scrolling: state("data-scrolling", "Present while it is being scrolled, and a moment after."),
}
const ORIENTATION = valued(
  "data-orientation",
  ["horizontal", "vertical"],
  "Which way the scrollbar scrolls."
)

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const scrollAreaVocabulary = defineComponent({
  root: {
    description: "The area. It holds the viewport and the scrollbars.",
    states: {
      ...OVERFLOW,
      hovering: state("data-hovering", "Present while the pointer is over the area."),
    },
    variables: {
      "--scroll-area-corner-width": "The width of the corner: the vertical scrollbar's.",
      "--scroll-area-corner-height": "The height of the corner: the horizontal scrollbar's.",
    },
  },
  viewport: { description: "The element that scrolls.", states: OVERFLOW },
  content: { description: "What is scrolled." },
  scrollbar: {
    description: "A scrollbar's track. In the page while there is something to scroll its way.",
    states: {
      orientation: ORIENTATION,
      hovering: state("data-hovering", "Present while the pointer is over the area."),
      scrolling: state("data-scrolling", "Present while the area is scrolled its way."),
    },
  },
  thumb: {
    description: "The part of a scrollbar that shows where the view is, and can be dragged.",
    states: { orientation: ORIENTATION },
    variables: {
      "--scroll-area-thumb-height": "A vertical thumb's height.",
      "--scroll-area-thumb-width": "A horizontal thumb's width.",
    },
  },
  corner: { description: "The square where the two scrollbars meet." },
})

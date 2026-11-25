import { defineComponent } from "./part.ts"
import { state, valued } from "./states.ts"

const EDGES = {
  hasOverflowX: state("data-has-overflow-x", "Present when there is more to see sideways."),
  hasOverflowY: state("data-has-overflow-y", "Present when there is more to see up or down."),
  overflowXStart: state(
    "data-overflow-x-start",
    "Present when there is more to scroll to towards the start of a line."
  ),
  overflowXEnd: state(
    "data-overflow-x-end",
    "Present when there is more to scroll to towards the end of a line."
  ),
  overflowYStart: state("data-overflow-y-start", "Present when there is more to scroll to above."),
  overflowYEnd: state("data-overflow-y-end", "Present when there is more to scroll to below."),
}
const OVERFLOW = {
  ...EDGES,
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
    description:
      "The area. It holds the viewport and the scrollbars, which the library places against it: a design gives a scrollbar its thickness and draws it, and places nothing.",
    states: {
      ...OVERFLOW,
      hovering: state("data-hovering", "Present while the pointer is over the area."),
    },
    variables: {
      "--scroll-area-corner-width":
        "The width of the corner: the vertical scrollbar's, while both scrollbars and the corner are in the page.",
      "--scroll-area-corner-height":
        "The height of the corner: the horizontal scrollbar's, while both scrollbars and the corner are in the page.",
    },
  },
  viewport: {
    inside: "root",
    description: "The element that scrolls.",
    states: OVERFLOW,
    variables: {
      "--scroll-area-overflow-x-start":
        "How far the view is from the start of a line, to fade that edge by: `0px` at it.",
      "--scroll-area-overflow-x-end": "How far the view is from the end of a line: `0px` at it.",
      "--scroll-area-overflow-y-start": "How far the view is from the top: `0px` at it.",
      "--scroll-area-overflow-y-end": "How far the view is from the bottom: `0px` at it.",
    },
  },
  content: {
    inside: "viewport",
    optional: true,
    description:
      "A box around what is scrolled, as wide as what it holds. Not needed to measure: the viewport's children are watched as they are. For content whose own box does not grow with what is in it (a block holding a wider table, or bare text).",
    states: OVERFLOW,
  },
  scrollbar: {
    // Anywhere in the area: shadcn/ui's horizontal one is written among what is scrolled.
    inside: ["root", "viewport"],
    repeated: true,
    description:
      "A scrollbar's track, placed along its edge of the area. In the page while there is something to scroll its way.",
    states: {
      orientation: ORIENTATION,
      hovering: state("data-hovering", "Present while the pointer is over the area."),
      scrolling: state("data-scrolling", "Present while the area is scrolled its way."),
      ...EDGES,
    },
    variables: {
      "--scroll-area-thumb-height": "A vertical thumb's height.",
      "--scroll-area-thumb-width": "A horizontal thumb's width.",
    },
  },
  thumb: {
    inside: "scrollbar",
    description:
      "The part of a scrollbar that shows where the view is, and can be dragged. As long as its scrollbar's variable says.",
    states: {
      orientation: ORIENTATION,
      scrolling: state("data-scrolling", "Present while the area is scrolled its way."),
    },
  },
  corner: {
    inside: "root",
    description: "The square where the two scrollbars meet, placed there.",
  },
})

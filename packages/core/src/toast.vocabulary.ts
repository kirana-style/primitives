import { defineComponent } from "./part.ts"
import { TRANSITION, state, valued } from "./states.ts"

const EXPANDED = state(
  "data-expanded",
  "Present while the pointer or focus is on the stack: the toasts are spread out, and wait."
)

export const toastVocabulary = defineComponent({
  viewport: {
    description: "Where the toasts are drawn: a region that is always in the page.",
    states: { expanded: EXPANDED },
  },
  root: {
    description: "One toast.",
    states: {
      startingStyle: TRANSITION.startingStyle,
      endingStyle: TRANSITION.endingStyle,
      expanded: EXPANDED,
      type: state("data-type", "The kind the toast was added as."),
      limited: state("data-limited", "Present on a toast behind as many as are shown at once."),
      swiping: state("data-swiping", "Present while the toast is dragged."),
      swipeDirection: valued(
        "data-swipe-direction",
        ["left", "right", "up", "down"],
        "The way the toast was dragged out, once it has been."
      ),
    },
    variables: {
      "--toast-index": "Its place in the stack: 0 for the newest.",
      "--toast-height": "Its height.",
      "--toast-offset-y": "The height of the toasts in front of it.",
      "--toast-swipe-movement-x": "How far it has been dragged across.",
      "--toast-swipe-movement-y": "How far it has been dragged up or down.",
    },
  },
  title: { description: "What the toast is called." },
  description: { description: "What the toast says." },
  close: { description: "Closes the toast." },
  action: { description: "A button of the toast's own; pressing it closes the toast too." },
})

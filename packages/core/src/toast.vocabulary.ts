import { defineComponent } from "./part.ts"
import { TRANSITION, state, valued } from "./states.ts"

const TYPE = state("data-type", "The kind the toast was added as.")

const EXPANDED = state(
  "data-expanded",
  "Present while the pointer or focus is on the stack: the toasts are spread out, and wait."
)

export const toastVocabulary = defineComponent({
  viewport: {
    description: "Where the toasts are drawn: a region that is always in the page.",
    states: { expanded: EXPANDED },
    variables: { "--toast-frontmost-height": "The height of the newest toast." },
  },
  list: {
    description: "The toasts in the page: each is given to draw its root. It draws no element.",
    inside: "viewport",
  },
  root: {
    inside: "list",
    repeated: true,
    description: "One toast.",
    states: {
      startingStyle: TRANSITION.startingStyle,
      endingStyle: TRANSITION.endingStyle,
      expanded: EXPANDED,
      type: TYPE,
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
  content: {
    inside: "root",
    optional: true,
    description: "What holds a toast's contents, when the design sizes the toast itself.",
    states: {
      behind: state("data-behind", "Present on a toast that is behind the newest."),
      expanded: EXPANDED,
    },
  },
  title: {
    inside: "content",
    description:
      "What the toast is called: the title it was added with, when nothing else is written in it.",
    states: { type: TYPE },
  },
  description: {
    inside: "content",
    description:
      "What the toast says: the description it was added with, when nothing else is written in it.",
    states: { type: TYPE },
  },
  close: { inside: "root", description: "Closes the toast.", states: { type: TYPE } },
  action: {
    inside: "root",
    description:
      "A button of the toast's own: the action it was added with, when nothing else is written in it. Pressing it closes the toast too, unless the action refuses.",
    states: { type: TYPE },
  },
})

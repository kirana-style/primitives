import { defineComponent } from "./part.ts"
import {
  ANCHORED,
  EITHER_FRAME,
  EITHER_OPEN,
  OPEN,
  PLACEMENT,
  TRANSITION,
  state,
  valued,
} from "./states.ts"

const ORIENTATION = valued(
  "data-orientation",
  ["horizontal", "vertical"],
  "Whether the list is a row or a column."
)
const POPUP_OPEN = state("data-popup-open", "Present while the item's content is shown.")

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const navigationMenuVocabulary = defineComponent({
  root: { description: "The navigation.", states: { orientation: ORIENTATION } },
  list: { description: "The row of items.", states: { orientation: ORIENTATION } },
  item: { description: "One item of the list: a link, or a trigger with its content." },
  trigger: {
    description: "The button that shows an item's content.",
    states: { popupOpen: POPUP_OPEN },
  },
  icon: {
    description: "A mark on a trigger that shows whether its content is open.",
    states: { popupOpen: POPUP_OPEN },
  },
  content: {
    description: "What an item shows. It is drawn in the viewport every item shares.",
    states: {
      ...TRANSITION,
      activationDirection: valued(
        "data-activation-direction",
        ["left", "right"],
        "Which way it came from: the item before it, or after."
      ),
    },
    exclusive: EITHER_FRAME,
  },
  link: {
    description: "A link, in the list or in an item's content.",
    states: { active: state("data-active", "Present on the link of the page the reader is on.") },
  },
  positioner: {
    description: "Places the popup against the open item's trigger. It carries the geometry.",
    states: { ...OPEN, ...PLACEMENT },
    exclusive: EITHER_OPEN,
    variables: {
      ...ANCHORED,
      "--positioner-width": "The open content's width.",
      "--positioner-height": "The open content's height.",
    },
  },
  popup: {
    description: "The panel every item's content is shown in.",
    states: { ...TRANSITION, ...PLACEMENT },
    exclusive: EITHER_FRAME,
    variables: {
      "--popup-width": "The open content's width.",
      "--popup-height": "The open content's height.",
    },
  },
  viewport: { description: "Where the contents are drawn, inside the popup." },
  arrow: {
    description: "An element that points at the open item's trigger.",
    states: {
      ...PLACEMENT,
      uncentered: state(
        "data-uncentered",
        "Present when the arrow cannot sit at the trigger's centre."
      ),
    },
  },
  backdrop: {
    description: "An element behind the popup, for a design that dims the page.",
    states: TRANSITION,
    exclusive: EITHER_FRAME,
  },
})

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
  list: { inside: "root", description: "The row of items.", states: { orientation: ORIENTATION } },
  item: {
    inside: "list",
    repeated: true,
    description:
      "One item of the list: a link, or a trigger with its content. Its `value` tells it from the others; an item that is given none makes its own.",
  },
  trigger: {
    inside: "item",
    description: "The button that shows an item's content.",
    states: { popupOpen: POPUP_OPEN },
  },
  icon: {
    inside: "trigger",
    description: "A mark on a trigger that shows whether its content is open.",
    states: { popupOpen: POPUP_OPEN },
  },
  content: {
    inside: "item",
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
    inside: ["content", "item", "list"],
    repeated: true,
    description: "A link, in the list or in an item's content.",
    states: { active: state("data-active", "Present on the link of the page the reader is on.") },
  },
  portal: {
    description:
      "Draws what it holds at the end of `<body>`, or in the container a `PortalProvider` names. It draws no element.",
    inside: "root",
  },
  positioner: {
    inside: "portal",
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
    inside: "positioner",
    description: "The panel every item's content is shown in.",
    states: { ...TRANSITION, ...PLACEMENT },
    exclusive: EITHER_FRAME,
    variables: {
      "--popup-width": "The open content's width.",
      "--popup-height": "The open content's height.",
    },
  },
  viewport: { inside: "popup", description: "Where the contents are drawn, inside the popup." },
  arrow: {
    inside: "popup",
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
    inside: "portal",
    description: "An element behind the popup, for a design that dims the page.",
    states: TRANSITION,
    exclusive: EITHER_FRAME,
  },
})

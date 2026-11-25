import { defineComponent } from "./part.ts"
import {
  ANCHORED,
  ANCHOR_HIDDEN,
  EITHER_FRAME,
  EITHER_OPEN,
  OPEN,
  PLACEMENT,
  POSITIONER_SIZE,
  TRANSITION,
  state,
  valued,
} from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const popoverVocabulary = defineComponent({
  root: { description: "Holds the popover: whether it is open. It draws no element." },
  trigger: {
    inside: "root",
    description: "The button that opens the popover, and what it is placed against.",
    states: {
      popupOpen: state("data-popup-open", "Present when the popover is open."),
      pressed: state(
        "data-pressed",
        "Present while the popover a press on this trigger opened is open: it stays pressed, as a button held down."
      ),
    },
  },
  portal: {
    description:
      "Draws what it holds at the end of `<body>`, or in the container a `PortalProvider` names. It draws no element.",
    inside: "root",
  },
  backdrop: {
    inside: "portal",
    description: "A layer over the page behind the popover.",
    states: TRANSITION,
    exclusive: EITHER_FRAME,
  },
  positioner: {
    inside: "portal",
    description: "Places the popup against the trigger. It carries the geometry.",
    states: { ...OPEN, ...PLACEMENT, anchorHidden: ANCHOR_HIDDEN },
    exclusive: EITHER_OPEN,
    variables: { ...ANCHORED, ...POSITIONER_SIZE },
  },
  popup: {
    inside: "positioner",
    description: "The popover itself.",
    states: {
      ...TRANSITION,
      ...PLACEMENT,
      instant: valued(
        "data-instant",
        ["click", "dismiss"],
        "Present when it opened or closed in a way that should skip the motion: `click` when the keyboard pressed the trigger, `dismiss` when Escape closed it."
      ),
    },
    exclusive: EITHER_FRAME,
    variables: {
      "--popup-width":
        "Its width: `auto`, and while its content changes size, the old width and then the new one, for a transition between them.",
      "--popup-height":
        "Its height: `auto`, and while its content changes size, the old height and then the new one, for a transition between them.",
    },
  },
  title: { inside: "popup", description: "The heading that names the popover." },
  description: { inside: "popup", description: "The text that describes the popover." },
  close: { inside: "popup", description: "A button that closes the popover." },
  arrow: {
    inside: "popup",
    description: "An element that points at the trigger, placed along the popup's edge.",
    exclusive: EITHER_OPEN,
    states: {
      ...OPEN,
      ...PLACEMENT,
      uncentered: state(
        "data-uncentered",
        "Present when the popup was pushed along its edge, so the arrow is not at the trigger's centre."
      ),
    },
  },
})

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

const INSTANT = valued(
  "data-instant",
  ["delay", "focus", "dismiss"],
  "Present when it opened or closed without its usual wait, for a design that skips the motion then."
)

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const tooltipVocabulary = defineComponent({
  root: { description: "Holds the tooltip: whether it is open. It draws no element." },
  trigger: {
    inside: "root",
    description: "The element the tooltip describes.",
    states: {
      popupOpen: state("data-popup-open", "Present when the tooltip is open."),
      triggerDisabled: state(
        "data-trigger-disabled",
        "Present when the tooltip is disabled: the pointer and focus on the trigger do not open it."
      ),
    },
  },
  portal: {
    description:
      "Draws what it holds at the end of `<body>`, or in the container a `PortalProvider` names. It draws no element.",
    inside: "root",
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
    description: "The tooltip itself.",
    states: { ...TRANSITION, ...PLACEMENT, instant: INSTANT },
    exclusive: EITHER_FRAME,
  },
  arrow: {
    inside: "popup",
    description: "An element that points at the trigger, placed along the popup's edge.",
    exclusive: EITHER_OPEN,
    states: {
      ...OPEN,
      ...PLACEMENT,
      instant: INSTANT,
      uncentered: state(
        "data-uncentered",
        "Present when the popup was pushed along its edge, so the arrow is not at the trigger's centre."
      ),
    },
  },
})

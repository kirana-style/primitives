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

const INSTANT = valued(
  "data-instant",
  ["delay", "focus", "dismiss"],
  "Present when it opened or closed without its usual wait, for a design that skips the motion then."
)

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const tooltipVocabulary = defineComponent({
  trigger: {
    description: "The element the tooltip describes.",
    states: { popupOpen: state("data-popup-open", "Present when the tooltip is open.") },
  },
  positioner: {
    description: "Places the popup against the trigger. It carries the geometry.",
    states: { ...OPEN, ...PLACEMENT },
    exclusive: EITHER_OPEN,
    variables: ANCHORED,
  },
  popup: {
    description: "The tooltip itself.",
    states: { ...TRANSITION, ...PLACEMENT, instant: INSTANT },
    exclusive: EITHER_FRAME,
  },
  arrow: {
    description: "An element that points at the trigger, placed along the popup's edge.",
    states: {
      ...PLACEMENT,
      uncentered: state(
        "data-uncentered",
        "Present when the popup was pushed along its edge, so the arrow is not at the trigger's centre."
      ),
    },
  },
})

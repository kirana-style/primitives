import { defineComponent } from "./part.ts"
import {
  ANCHORED,
  EITHER_FRAME,
  EITHER_OPEN,
  OPEN,
  PLACEMENT,
  TRANSITION,
  state,
} from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const popoverVocabulary = defineComponent({
  root: { description: "Holds the popover: whether it is open. It draws no element." },
  trigger: {
    inside: "root",
    description: "The button that opens the popover, and what it is placed against.",
    states: { popupOpen: state("data-popup-open", "Present when the popover is open.") },
  },
  portal: {
    description:
      "Draws what it holds at the end of `<body>`, or in the container a `PortalProvider` names. It draws no element.",
    inside: "root",
  },
  positioner: {
    inside: "portal",
    description: "Places the popup against the trigger. It carries the geometry.",
    states: { ...OPEN, ...PLACEMENT },
    exclusive: EITHER_OPEN,
    variables: ANCHORED,
  },
  popup: {
    inside: "positioner",
    description: "The popover itself.",
    states: { ...TRANSITION, ...PLACEMENT },
    exclusive: EITHER_FRAME,
  },
  title: { inside: "popup", description: "The heading that names the popover." },
  description: { inside: "popup", description: "The text that describes the popover." },
  close: { inside: "popup", description: "A button that closes the popover." },
})

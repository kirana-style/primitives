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
  trigger: {
    description: "The button that opens the popover, and what it is placed against.",
    states: { popupOpen: state("data-popup-open", "Present when the popover is open.") },
  },
  positioner: {
    description: "Places the popup against the trigger. It carries the geometry.",
    states: { ...OPEN, ...PLACEMENT },
    exclusive: EITHER_OPEN,
    variables: ANCHORED,
  },
  popup: {
    description: "The popover itself.",
    states: { ...TRANSITION, ...PLACEMENT },
    exclusive: EITHER_FRAME,
  },
  title: { description: "The heading that names the popover." },
  description: { description: "The text that describes the popover." },
  close: { description: "A button that closes the popover." },
})

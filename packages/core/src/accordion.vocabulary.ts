import { defineComponent } from "./part.ts"
import { DISABLED, EITHER_FRAME, TRANSITION, state, valued } from "./states.ts"

const ORIENTATION = valued(
  "data-orientation",
  ["horizontal", "vertical"],
  "The way the items are laid out, and the arrows that move between their triggers."
)

const OPEN = state("data-open", "Present when the item is open.")

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const accordionVocabulary = defineComponent({
  root: {
    description: "Groups the items.",
    states: { orientation: ORIENTATION, disabled: DISABLED },
  },
  item: {
    description: "One section: a header with its trigger, and a panel.",
    states: { open: OPEN, disabled: DISABLED },
  },
  header: {
    description: "The heading that holds the trigger.",
    states: { open: OPEN, disabled: DISABLED },
  },
  trigger: {
    description: "The button that opens and closes the item's panel.",
    states: {
      panelOpen: state("data-panel-open", "Present when the item's panel is open."),
      disabled: DISABLED,
    },
  },
  panel: {
    description: "The item's content. In the page while open, and through its exit's motion.",
    states: { ...TRANSITION, disabled: DISABLED, orientation: ORIENTATION },
    exclusive: EITHER_FRAME,
    variables: {
      "--accordion-panel-height":
        "The panel's content height while it opens or closes, `auto` once it is open.",
      "--accordion-panel-width":
        "The panel's content width while it opens or closes, `auto` once it is open.",
    },
  },
})

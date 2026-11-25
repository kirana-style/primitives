import { defineComponent } from "./part.ts"
import { DISABLED, EITHER_FRAME, TRANSITION, state, valued } from "./states.ts"

const ORIENTATION = valued(
  "data-orientation",
  ["horizontal", "vertical"],
  "The way the items are laid out, and the arrows that move between their triggers."
)

const OPEN = state("data-open", "Present when the item is open.")
// Its place, as a number: any value.
const INDEX = state("data-index", "The item's place among the accordion's items, from 0.")

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const accordionVocabulary = defineComponent({
  root: {
    description: "Groups the items.",
    states: { orientation: ORIENTATION, disabled: DISABLED },
  },
  item: {
    inside: "root",
    repeated: true,
    description:
      "One section: a header with its trigger, and a panel. Its `value` tells it from the others; an item that is given none makes its own.",
    states: { index: INDEX, open: OPEN, disabled: DISABLED },
  },
  header: {
    inside: "item",
    description: "The heading that holds the trigger.",
    states: { index: INDEX, open: OPEN, disabled: DISABLED },
  },
  trigger: {
    inside: "header",
    description: "The button that opens and closes the item's panel.",
    states: {
      index: INDEX,
      panelOpen: state("data-panel-open", "Present when the item's panel is open."),
      disabled: DISABLED,
    },
  },
  panel: {
    inside: "item",
    description: "The item's content. In the page while open, and through its exit's motion.",
    states: { ...TRANSITION, disabled: DISABLED, orientation: ORIENTATION, index: INDEX },
    exclusive: EITHER_FRAME,
    variables: {
      "--accordion-panel-height":
        "The panel's content height while it opens or closes, `auto` once it is open.",
      "--accordion-panel-width":
        "The panel's content width while it opens or closes, `auto` once it is open.",
    },
  },
})

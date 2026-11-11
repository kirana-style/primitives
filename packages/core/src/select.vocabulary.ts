import { defineComponent } from "./part.ts"
import {
  ANCHORED,
  DISABLED,
  EITHER_FRAME,
  EITHER_OPEN,
  OPEN,
  PLACEMENT,
  TRANSITION,
  state,
} from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const selectVocabulary = defineComponent({
  trigger: {
    description: "The button that shows the value and opens the list.",
    states: {
      popupOpen: state("data-popup-open", "Present when the list is open."),
      placeholder: state("data-placeholder", "Present while nothing is chosen."),
      disabled: DISABLED,
    },
  },
  value: {
    description: "The chosen value's label, or the placeholder.",
    states: { placeholder: state("data-placeholder", "Present while nothing is chosen.") },
  },
  positioner: {
    description: "Places the list against the trigger. It carries the geometry.",
    states: { ...OPEN, ...PLACEMENT },
    exclusive: EITHER_OPEN,
    variables: ANCHORED,
  },
  popup: {
    description: "The list of items.",
    states: { ...TRANSITION, ...PLACEMENT },
    exclusive: EITHER_FRAME,
  },
  item: {
    description: "One choice in the list.",
    states: {
      selected: state("data-selected", "Present on the chosen item."),
      highlighted: state(
        "data-highlighted",
        "Present on the item the pointer or the keyboard is on."
      ),
      disabled: DISABLED,
    },
  },
  itemText: { description: "The item's name: what the trigger shows once it is chosen." },
  itemIndicator: { description: "A mark an item shows while it is the chosen one." },
})

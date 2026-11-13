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

const POPUP_OPEN = state("data-popup-open", "Present when the list is open.")

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const comboboxVocabulary = defineComponent({
  input: {
    description: "The text input. What is typed filters the list, which is placed against it.",
    states: { popupOpen: POPUP_OPEN, disabled: DISABLED },
  },
  trigger: {
    description: "A button that opens and closes the list.",
    states: { popupOpen: POPUP_OPEN, disabled: DISABLED },
  },
  positioner: {
    description: "Places the list against the input. It carries the geometry.",
    states: { ...OPEN, ...PLACEMENT },
    exclusive: EITHER_OPEN,
    variables: ANCHORED,
  },
  popup: {
    description: "The list of items.",
    states: {
      ...TRANSITION,
      ...PLACEMENT,
      empty: state("data-empty", "Present when no item is shown for what was typed."),
    },
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
  itemIndicator: { description: "A mark an item shows while it is the chosen one." },
  empty: { description: "What is shown when no item is." },
  clear: {
    description: "A button that empties the input and the value.",
    states: { disabled: DISABLED },
  },
  chips: { description: "With several values: what holds the chips and the input." },
  chip: { description: "One chosen value." },
  chipRemove: {
    description: "A chip's button that takes its value away.",
    states: { disabled: DISABLED },
  },
})

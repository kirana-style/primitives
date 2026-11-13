import { defineComponent } from "./part.ts"
import {
  ANCHORED,
  CHECKED,
  DISABLED,
  EITHER_CHECKED,
  EITHER_FRAME,
  EITHER_OPEN,
  OPEN,
  PLACEMENT,
  TRANSITION,
  state,
} from "./states.ts"

const HIGHLIGHTED = state(
  "data-highlighted",
  "Present on the item the pointer or the keyboard is on."
)

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const menuVocabulary = defineComponent({
  trigger: {
    description: "The button that opens the menu, and what it is placed against.",
    states: {
      popupOpen: state("data-popup-open", "Present when the menu is open."),
      disabled: DISABLED,
    },
  },
  positioner: {
    description: "Places the menu against its trigger. It carries the geometry.",
    states: { ...OPEN, ...PLACEMENT },
    exclusive: EITHER_OPEN,
    variables: ANCHORED,
  },
  popup: {
    description: "The menu itself: the list of items.",
    states: { ...TRANSITION, ...PLACEMENT },
    exclusive: EITHER_FRAME,
  },
  arrow: {
    description: "An element that points at the trigger.",
    states: {
      ...PLACEMENT,
      uncentered: state(
        "data-uncentered",
        "Present when the arrow cannot sit at the trigger's centre."
      ),
    },
  },
  item: {
    description: "An action. Choosing it closes the menu.",
    states: { highlighted: HIGHLIGHTED, disabled: DISABLED },
  },
  linkItem: {
    description: "An item that is a link. Choosing it follows the link and closes the menu.",
    states: { highlighted: HIGHLIGHTED, disabled: DISABLED },
  },
  group: { description: "Items that belong together, named by their label." },
  groupLabel: {
    description: "The name of a group. Outside a group it is plain text, and names nothing.",
  },
  separator: { description: "A line between items." },
  checkboxItem: {
    description: "An item that is checked or not. Choosing it leaves the menu open.",
    states: { ...CHECKED, highlighted: HIGHLIGHTED, disabled: DISABLED },
    exclusive: EITHER_CHECKED,
  },
  checkboxItemIndicator: {
    description: "A mark a checkbox item shows while it is checked.",
    states: CHECKED,
    exclusive: EITHER_CHECKED,
  },
  radioGroup: {
    description: "Radio items of which one is chosen.",
    states: { disabled: DISABLED },
  },
  radioItem: {
    description: "One choice of a radio group. Choosing it leaves the menu open.",
    states: { ...CHECKED, highlighted: HIGHLIGHTED, disabled: DISABLED },
    exclusive: EITHER_CHECKED,
  },
  radioItemIndicator: {
    description: "A mark a radio item shows while it is the chosen one.",
    states: CHECKED,
    exclusive: EITHER_CHECKED,
  },
  submenuTrigger: {
    description: "An item that opens a menu beside it.",
    states: {
      popupOpen: state("data-popup-open", "Present when its menu is open."),
      highlighted: HIGHLIGHTED,
      disabled: DISABLED,
    },
  },
})

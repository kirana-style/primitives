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
  root: {
    description:
      "Holds the combobox: its value, what is typed and whether the list is open. It draws no element.",
  },
  input: {
    inside: ["root", "chips", "popup"],
    description:
      "The text input. What is typed filters the list, which is placed against it, or against the chips' box when it is in one. Inside the popup, it takes focus while the popup is open.",
    states: { popupOpen: POPUP_OPEN, disabled: DISABLED },
  },
  trigger: {
    inside: "root",
    description:
      "A button that opens and closes the list. With the input inside the popup it is the combobox: a stop for Tab, and what the popup is placed against.",
    states: { popupOpen: POPUP_OPEN, disabled: DISABLED },
  },
  portal: {
    description:
      "Draws what it holds at the end of `<body>`, or in the container a `PortalProvider` names. It draws no element.",
    inside: "root",
  },
  positioner: {
    inside: "portal",
    description:
      "Places the list against the input: against the chips' box when the input is in one, the button when the input is inside the popup, or its own `anchor`. It carries the geometry.",
    states: { ...OPEN, ...PLACEMENT },
    exclusive: EITHER_OPEN,
    variables: ANCHORED,
  },
  popup: {
    inside: ["positioner", "root"],
    description:
      "The list of items. With a `list` inside, what holds it: a dialog around an input and the list.",
    states: {
      ...TRANSITION,
      ...PLACEMENT,
      empty: state("data-empty", "Present when no item is shown for what was typed."),
    },
    exclusive: EITHER_FRAME,
  },
  list: {
    inside: "popup",
    optional: true,
    description:
      "The items' own box inside the popup, when the popup holds more than items (an input): it is then the listbox.",
    states: { empty: state("data-empty", "Present when no item is shown for what was typed.") },
  },
  item: {
    inside: "group",
    repeated: true,
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
  group: {
    inside: "list",
    optional: true,
    repeated: true,
    description: "Items that belong together, named by their label. Hidden while none is shown.",
  },
  groupLabel: {
    inside: "group",
    description: "The name of a group. Outside a group it is plain text, and names nothing.",
  },
  separator: { inside: "list", repeated: true, description: "A line between groups." },
  itemIndicator: {
    inside: "item",
    description: "A mark an item shows while it is the chosen one.",
  },
  empty: { inside: "popup", description: "What is shown when no item is." },
  clear: {
    inside: "root",
    description: "A button that empties the input and the value.",
    states: { disabled: DISABLED },
  },
  chips: {
    inside: "root",
    description:
      "With several values: what holds the chips and the input, and what the list is placed against.",
  },
  chip: { inside: "chips", repeated: true, description: "One chosen value." },
  chipRemove: {
    inside: "chip",
    description: "A chip's button that takes its value away.",
    states: { disabled: DISABLED },
  },
})

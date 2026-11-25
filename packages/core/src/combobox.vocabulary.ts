import { defineComponent } from "./part.ts"
import { POPUP_SIDE, PRESENTATION, SHEET_STATES, SHEET_VARIABLES } from "./select.vocabulary.ts"
import {
  ANCHORED,
  ANCHOR_HIDDEN,
  CONTROL,
  DISABLED,
  EITHER_FRAME,
  EITHER_OPEN,
  EITHER_VALID,
  FIELD,
  OPEN,
  PLACEMENT,
  PRESSED,
  TRANSITION,
  state,
} from "./states.ts"

const POPUP_OPEN = state("data-popup-open", "Present when the list is open.")
const EMPTY = state("data-empty", "Present when no item is shown for what was typed.")

/** What the input and the trigger both say of the combobox. */
const OPENER = {
  popupOpen: POPUP_OPEN,
  pressed: PRESSED,
  popupSide: POPUP_SIDE,
  listEmpty: state(
    "data-list-empty",
    "Present when no item is shown for what was typed, once the list is in the page."
  ),
  disabled: DISABLED,
  readonly: CONTROL.readonly,
  required: CONTROL.required,
  ...FIELD,
}

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
    states: OPENER,
    exclusive: EITHER_VALID,
  },
  trigger: {
    inside: "root",
    description:
      "A button that opens and closes the list. With the input inside the popup it is the combobox: a stop for Tab, and what the popup is placed against.",
    states: OPENER,
    exclusive: EITHER_VALID,
  },
  value: {
    inside: "trigger",
    optional: true,
    description:
      "The chosen value's label, or a placeholder while nothing is chosen, for a button that is the combobox (its input inside the popup). With several values, their labels with commas between. It draws no element.",
  },
  portal: {
    description:
      "Draws what it holds at the end of `<body>`, or in the container a `PortalProvider` names. It draws no element.",
    inside: "root",
  },
  backdrop: {
    inside: "portal",
    optional: true,
    description: "The layer over the page behind the list: a press on it closes the list.",
    states: { ...TRANSITION, ...SHEET_STATES },
    exclusive: EITHER_FRAME,
    variables: SHEET_VARIABLES,
  },
  positioner: {
    inside: "portal",
    description:
      "Places the list against the input: against the chips' box when the input is in one, the button when the input is inside the popup, or its own `anchor`. It carries the geometry. As a sheet it is not placed, and carries none.",
    states: {
      ...OPEN,
      ...PLACEMENT,
      presentation: PRESENTATION,
      anchorHidden: ANCHOR_HIDDEN,
      empty: EMPTY,
    },
    exclusive: EITHER_OPEN,
    variables: ANCHORED,
  },
  popup: {
    inside: ["positioner", "root"],
    description:
      "The list of items. With a `list` inside, what holds it: a dialog around an input and the list. As a sheet, a design moves it by what it says of the drag, and gives it `touch-action: none` where a finger drags it.",
    states: {
      ...TRANSITION,
      ...PLACEMENT,
      ...SHEET_STATES,
      anchorHidden: ANCHOR_HIDDEN,
      empty: EMPTY,
    },
    exclusive: EITHER_FRAME,
    variables: {
      ...SHEET_VARIABLES,
      "--drawer-swipe-strength":
        "As a sheet, once let go: 0.1 to 1, the share of the design's own time it should take to come to rest.",
    },
  },
  list: {
    inside: "popup",
    optional: true,
    description:
      "The items' own box inside the popup, when the popup holds more than items (an input): it is then the listbox.",
    states: { empty: EMPTY },
  },
  collection: {
    inside: ["list", "popup", "group"],
    optional: true,
    description:
      "Draws the list from the root's `items`: its content once for each item left for what was typed, or for each group that has items left; given a group, for each of that group's items left. The root then filters, and no item hides itself. It draws no element.",
  },
  item: {
    inside: ["group", "collection"],
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
    inside: ["list", "collection"],
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
  status: {
    inside: ["popup", "root"],
    optional: true,
    description:
      'Says how the list stands ("3 results", "Loading") to software that reads the page, as its text changes. It stays in the page while its text changes: inside the popup, or beside the input.',
  },
  clear: {
    inside: "root",
    description:
      "A button that empties the input and the value. It is in the page while there is something to clear (the text, for an autocomplete; else what is chosen), and through its exit; `keepMounted` keeps it there.",
    states: {
      disabled: DISABLED,
      popupOpen: POPUP_OPEN,
      visible: state("data-visible", "Present while there is something to clear."),
      startingStyle: TRANSITION.startingStyle,
      endingStyle: TRANSITION.endingStyle,
    },
    exclusive: [["startingStyle", "endingStyle"]],
  },
  chips: {
    inside: "root",
    description:
      "With several values: what holds the chips and the input, and what the list is placed against.",
  },
  chip: {
    inside: "chips",
    repeated: true,
    description:
      "One chosen value. The arrows reach it from the start of the input, and Backspace or Delete on it takes it away.",
    states: { disabled: DISABLED },
  },
  chipRemove: {
    inside: "chip",
    description: "A chip's button that takes its value away.",
    states: { disabled: DISABLED },
  },
})

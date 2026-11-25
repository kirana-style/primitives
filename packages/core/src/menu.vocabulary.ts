import { defineComponent } from "./part.ts"
import {
  ANCHORED,
  ANCHOR_HIDDEN,
  CHECKED,
  DISABLED,
  EITHER_CHECKED,
  EITHER_FRAME,
  EITHER_OPEN,
  OPEN,
  PLACEMENT,
  POSITIONER_SIZE,
  PRESSED,
  TRANSITION,
  state,
  valued,
} from "./states.ts"

const HIGHLIGHTED = state(
  "data-highlighted",
  "Present on the item the pointer or the keyboard is on."
)

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const menuVocabulary = defineComponent({
  root: { description: "Holds the menu: whether it is open. It draws no element." },
  trigger: {
    inside: "root",
    description: "The button that opens the menu, and what it is placed against.",
    states: {
      popupOpen: state("data-popup-open", "Present when the menu is open."),
      pressed: PRESSED,
      disabled: DISABLED,
    },
  },
  portal: {
    description:
      "Draws what it holds at the end of `<body>`, or in the container a `PortalProvider` names. It draws no element.",
    inside: ["root", "submenuRoot"],
  },
  positioner: {
    inside: "portal",
    description: "Places the menu against its trigger. It carries the geometry.",
    states: { ...OPEN, ...PLACEMENT, anchorHidden: ANCHOR_HIDDEN },
    exclusive: EITHER_OPEN,
    variables: { ...ANCHORED, ...POSITIONER_SIZE },
  },
  popup: {
    inside: "positioner",
    description: "The menu itself: the list of items.",
    states: {
      ...TRANSITION,
      ...PLACEMENT,
      instant: valued(
        "data-instant",
        ["click", "dismiss", "group"],
        "Present when it opened or closed in a way that should skip the motion: `click` when the keyboard pressed its trigger or an item, `dismiss` when Escape closed it, `group` when focus or the pointer went from one menu of a bar to another."
      ),
    },
    exclusive: EITHER_FRAME,
  },
  arrow: {
    inside: "popup",
    description: "An element that points at the trigger.",
    exclusive: EITHER_OPEN,
    states: {
      ...OPEN,
      ...PLACEMENT,
      uncentered: state(
        "data-uncentered",
        "Present when the arrow cannot sit at the trigger's centre."
      ),
    },
  },
  item: {
    inside: "group",
    repeated: true,
    description: "An action. Choosing it closes the menu.",
    states: { highlighted: HIGHLIGHTED, disabled: DISABLED },
  },
  linkItem: {
    inside: "group",
    repeated: true,
    description: "An item that is a link. Choosing it follows the link and closes the menu.",
    states: { highlighted: HIGHLIGHTED, disabled: DISABLED },
  },
  group: {
    inside: "popup",
    optional: true,
    repeated: true,
    description: "Items that belong together, named by their label.",
  },
  groupLabel: {
    inside: "group",
    description: "The name of a group. Outside a group it is plain text, and names nothing.",
  },
  separator: { inside: "popup", repeated: true, description: "A line between items." },
  checkboxItem: {
    inside: "group",
    repeated: true,
    description: "An item that is checked or not. Choosing it leaves the menu open.",
    states: { ...CHECKED, highlighted: HIGHLIGHTED, disabled: DISABLED },
    exclusive: EITHER_CHECKED,
  },
  checkboxItemIndicator: {
    inside: "checkboxItem",
    description: "A mark a checkbox item shows while it is checked.",
    states: CHECKED,
    exclusive: EITHER_CHECKED,
  },
  radioGroup: {
    inside: "group",
    repeated: true,
    description: "Radio items of which one is chosen.",
    states: { disabled: DISABLED },
  },
  radioItem: {
    inside: "radioGroup",
    repeated: true,
    description: "One choice of a radio group. Choosing it leaves the menu open.",
    states: { ...CHECKED, highlighted: HIGHLIGHTED, disabled: DISABLED },
    exclusive: EITHER_CHECKED,
  },
  radioItemIndicator: {
    inside: "radioItem",
    description: "A mark a radio item shows while it is the chosen one.",
    states: CHECKED,
    exclusive: EITHER_CHECKED,
  },
  submenuRoot: {
    description:
      "A submenu: it holds the item that opens it and a portal, positioner and popup of its own. It draws no element.",
    inside: "group",
    repeated: true,
  },
  submenuTrigger: {
    inside: "submenuRoot",
    description: "An item that opens a menu beside it.",
    states: {
      popupOpen: state("data-popup-open", "Present when its menu is open."),
      highlighted: HIGHLIGHTED,
      disabled: DISABLED,
    },
  },
})

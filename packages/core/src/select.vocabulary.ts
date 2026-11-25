import { defineComponent } from "./part.ts"
import {
  ANCHORED,
  CONTROL,
  DISABLED,
  EITHER_FRAME,
  EITHER_OPEN,
  OPEN,
  PLACEMENT,
  TRANSITION,
  state,
  valued,
} from "./states.ts"

const SCROLL_ARROW = (direction: string) => ({
  description: `In the page while there is more of the list ${direction}: it scrolls the list while the pointer moves over it.`,
  states: {
    direction: valued("data-direction", ["up", "down"], "The way it scrolls the list."),
    visible: state("data-visible", "Present while there is more of the list its way."),
    side: valued(
      "data-side",
      ["top", "right", "bottom", "left", "inline-start", "inline-end", "none"],
      "The side of the trigger the list is on; `none` when it lies over the trigger."
    ),
    startingStyle: TRANSITION.startingStyle,
    endingStyle: TRANSITION.endingStyle,
  },
  exclusive: [["startingStyle", "endingStyle"]],
})

/** What a list that may open as a sheet says on its positioner, its popup and its backdrop. */
export const PRESENTATION = valued(
  "data-presentation",
  ["popup", "sheet"],
  "How the list opened: placed against its trigger, or as a sheet from the bottom edge."
)

/** What a list opened as a sheet says of the drag that closes it: the drawer's own names. */
export const SHEET_STATES = {
  presentation: PRESENTATION,
  swiping: state("data-swiping", "Present while the sheet is dragged."),
  swipeDismiss: state("data-swipe-dismiss", "Present once a drag has closed it."),
}

export const SHEET_VARIABLES = {
  "--drawer-swipe-movement-x": "As a sheet: how far it has been dragged across, always 0px.",
  "--drawer-swipe-movement-y": "As a sheet: how far it has been dragged down.",
  "--drawer-swipe-progress": "As a sheet: how far it has been dragged, of its own height: 0 to 1.",
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const selectVocabulary = defineComponent({
  root: {
    description: "Holds the select: its value and whether the list is open. It draws no element.",
  },
  trigger: {
    inside: "root",
    description: "The button that shows the value and opens the list.",
    states: {
      popupOpen: state("data-popup-open", "Present when the list is open."),
      placeholder: state("data-placeholder", "Present while nothing is chosen."),
      disabled: DISABLED,
      readonly: CONTROL.readonly,
    },
  },
  value: {
    inside: "trigger",
    description:
      "The chosen value's label, or the placeholder. With several values, their labels with commas between.",
    states: { placeholder: state("data-placeholder", "Present while nothing is chosen.") },
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
      "Places the list against the trigger. It carries the geometry. As a sheet it is not placed, and carries none.",
    states: {
      ...OPEN,
      ...PLACEMENT,
      presentation: PRESENTATION,
      side: valued(
        "data-side",
        ["top", "right", "bottom", "left", "inline-start", "inline-end", "none"],
        "The side of the trigger it is on, after any flip; `none` when it lies over the trigger."
      ),
    },
    exclusive: EITHER_OPEN,
    variables: ANCHORED,
  },
  scrollUpArrow: { ...SCROLL_ARROW("above"), inside: "popup" },
  group: {
    inside: "list",
    optional: true,
    repeated: true,
    description: "Items that belong together, named by their label.",
  },
  groupLabel: {
    inside: "group",
    description: "The name of a group. Outside a group it is plain text, and names nothing.",
  },
  separator: { inside: "list", repeated: true, description: "A line between groups." },
  list: {
    inside: "popup",
    optional: true,
    description:
      "The items' own box inside the popup, when the popup holds more than its items: the listbox, and what scrolls.",
  },
  scrollDownArrow: { ...SCROLL_ARROW("below"), inside: "popup" },
  popup: {
    inside: "positioner",
    description:
      "The list of items. As a sheet, a design moves it by what it says of the drag, and gives it `touch-action: none` where a finger drags it.",
    states: { ...TRANSITION, ...PLACEMENT, ...SHEET_STATES },
    exclusive: EITHER_FRAME,
    variables: {
      ...SHEET_VARIABLES,
      "--drawer-swipe-strength":
        "As a sheet, once let go: 0.1 to 1, the share of the design's own time it should take to come to rest.",
    },
  },
  item: {
    inside: "group",
    repeated: true,
    description: "One choice in the list.",
    states: {
      selected: state("data-selected", "Present on the chosen item, or on each of several."),
      highlighted: state(
        "data-highlighted",
        "Present on the item the pointer or the keyboard is on."
      ),
      disabled: DISABLED,
    },
  },
  itemText: {
    inside: "item",
    description: "The item's name: what the trigger shows once it is chosen.",
  },
  itemIndicator: { inside: "item", description: "A mark an item shows while it is chosen." },
})

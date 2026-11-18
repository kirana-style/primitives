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
  positioner: {
    inside: "portal",
    description: "Places the list against the trigger. It carries the geometry.",
    states: {
      ...OPEN,
      ...PLACEMENT,
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
    description: "The list of items.",
    states: { ...TRANSITION, ...PLACEMENT },
    exclusive: EITHER_FRAME,
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

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
  valued,
} from "./states.ts"

const SCROLL_ARROW = (direction: string) => ({
  description: `In the page while there is more of the list ${direction}: it scrolls the list while the pointer moves over it.`,
  states: {
    direction: valued("data-direction", ["up", "down"], "The way it scrolls the list."),
    visible: state("data-visible", "Present while there is more of the list its way."),
    side: valued(
      "data-side",
      ["top", "right", "bottom", "left", "none"],
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
    states: {
      ...OPEN,
      ...PLACEMENT,
      side: valued(
        "data-side",
        ["top", "right", "bottom", "left", "none"],
        "The side of the trigger it is on, after any flip; `none` when it lies over the trigger."
      ),
    },
    exclusive: EITHER_OPEN,
    variables: ANCHORED,
  },
  list: {
    description:
      "The items' own box inside the popup, when the popup holds more than its items: the listbox, and what scrolls.",
  },
  scrollUpArrow: SCROLL_ARROW("above"),
  scrollDownArrow: SCROLL_ARROW("below"),
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

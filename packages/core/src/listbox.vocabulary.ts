import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

const SELECTED = state("data-selected", "Present on a chosen item.")

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const listboxVocabulary = defineComponent({
  root: {
    description: "The list. It is one stop for Tab.",
    states: { disabled: DISABLED },
  },
  item: {
    description: "One choice in the list.",
    states: {
      selected: SELECTED,
      highlighted: state("data-highlighted", "Present on the item the keyboard is on."),
      disabled: DISABLED,
    },
  },
  itemIndicator: {
    description: "A mark an item shows while it is chosen.",
    states: { selected: SELECTED },
  },
  group: { description: "Items that belong together, named by their label." },
  groupLabel: { description: "The name of a group." },
})

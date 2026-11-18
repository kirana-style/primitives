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
    inside: "group",
    repeated: true,
    description: "One choice in the list.",
    states: {
      selected: SELECTED,
      highlighted: state("data-highlighted", "Present on the item the keyboard is on."),
      disabled: DISABLED,
    },
  },
  itemIndicator: {
    inside: "item",
    description: "A mark an item shows while it is chosen.",
    states: { selected: SELECTED },
  },
  group: {
    inside: "root",
    optional: true,
    repeated: true,
    description: "Items that belong together, named by their label.",
  },
  groupLabel: { inside: "group", description: "The name of a group." },
})

import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const paginationVocabulary = defineComponent({
  root: { description: "The pages of a list, as a navigation.", states: { disabled: DISABLED } },
  items: {
    description:
      "The row's entries, pages and the gaps between them: each is given to draw. It draws no element.",
    inside: "root",
  },
  item: {
    inside: "items",
    repeated: true,
    description: "A page: pressed, it is the one shown.",
    states: {
      selected: state("data-selected", "Present on the page that is shown."),
      disabled: DISABLED,
    },
  },
  ellipsis: {
    inside: "items",
    repeated: true,
    description: "The mark for pages that are left out of the row.",
  },
  previous: {
    inside: "root",
    description: "Goes to the page before.",
    states: { disabled: DISABLED },
  },
  next: { inside: "root", description: "Goes to the page after.", states: { disabled: DISABLED } },
})

import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const commandVocabulary = defineComponent({
  root: {
    description: "A list of commands with the input that filters it.",
    states: { disabled: DISABLED },
  },
  input: {
    inside: "root",
    description: "The text input. What is typed filters the list; focus stays in it.",
    states: { disabled: DISABLED },
  },
  list: {
    inside: "root",
    description: "The commands.",
    states: { empty: state("data-empty", "Present when no item is shown for what was typed.") },
  },
  empty: { inside: "list", description: "What is shown when no item is." },
  group: {
    inside: "list",
    optional: true,
    repeated: true,
    description: "Items under a heading. Hidden while none of them is shown.",
  },
  groupHeading: { inside: "group", description: "A group's name." },
  item: {
    inside: "group",
    repeated: true,
    description: "One command.",
    states: {
      highlighted: state(
        "data-highlighted",
        "Present on the item the pointer or the keyboard is on."
      ),
      disabled: DISABLED,
    },
  },
  separator: {
    inside: "list",
    repeated: true,
    description: "A line between groups. Hidden while something is typed.",
  },
})

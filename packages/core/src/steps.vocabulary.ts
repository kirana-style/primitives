import { defineComponent } from "./part.ts"
import { DISABLED, state, valued } from "./states.ts"

const ORIENTATION = valued(
  "data-orientation",
  ["horizontal", "vertical"],
  "Whether the steps are laid out across or down."
)
const WHERE = {
  current: state("data-current", "Present on the step that is shown."),
  complete: state("data-complete", "Present on a step that is done: one before the step shown."),
  incomplete: state("data-incomplete", "Present on a step still to come."),
  orientation: ORIENTATION,
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const stepsVocabulary = defineComponent({
  root: {
    description: "A task in steps, taken in order.",
    states: {
      orientation: ORIENTATION,
      complete: state("data-complete", "Present once every step is done."),
    },
  },
  list: {
    inside: "root",
    description: "The row of steps: the arrows move between their triggers.",
    states: { orientation: ORIENTATION },
  },
  item: {
    inside: "list",
    repeated: true,
    description: "One step of the row, around its trigger and its separator.",
    states: WHERE,
  },
  trigger: {
    inside: "item",
    description: "Names a step, and goes to it when pressed.",
    states: { ...WHERE, disabled: DISABLED },
  },
  indicator: {
    inside: "trigger",
    optional: true,
    description: "A step's mark: its number, or a tick once it is done.",
    states: WHERE,
  },
  separator: {
    inside: "item",
    optional: true,
    description: "The line from a step to the next.",
    states: WHERE,
  },
  content: {
    inside: "root",
    repeated: true,
    description: "What a step shows: hidden unless its step is the one shown.",
    states: WHERE,
  },
  completed: {
    inside: "root",
    optional: true,
    description: "What is shown once every step is done.",
    states: { orientation: ORIENTATION },
  },
  previous: {
    inside: "root",
    optional: true,
    description: "Goes to the step before.",
    states: { disabled: DISABLED },
  },
  next: {
    inside: "root",
    optional: true,
    description: "Goes to the step after; from the last, to all of them done.",
    states: { disabled: DISABLED },
  },
})

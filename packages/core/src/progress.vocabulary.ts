import { defineComponent } from "./part.ts"
import { state } from "./states.ts"

const STATES = {
  progressing: state("data-progressing", "Present while the task is under way."),
  complete: state("data-complete", "Present once the value has reached the end of the range."),
  indeterminate: state(
    "data-indeterminate",
    "Present while how far the task has come is not known."
  ),
}
const ONE_OF = [["progressing", "complete", "indeterminate"]] as const

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const progressVocabulary = defineComponent({
  root: {
    description: "The progress bar: it says the value to assistive technology.",
    states: STATES,
    exclusive: ONE_OF,
  },
  track: { description: "The whole range.", states: STATES, exclusive: ONE_OF },
  indicator: {
    description: "The filled part: its width is the value's share of the range.",
    states: STATES,
    exclusive: ONE_OF,
  },
  value: { description: "The value, written.", states: STATES, exclusive: ONE_OF },
  label: { description: "The bar's name.", states: STATES, exclusive: ONE_OF },
})

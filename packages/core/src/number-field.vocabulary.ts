import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

const STATES = {
  disabled: DISABLED,
  readonly: state("data-readonly", "Present when the number cannot be changed."),
  required: state("data-required", "Present when a number must be given."),
  touched: state("data-touched", "Present once focus has left the input."),
  dirty: state("data-dirty", "Present while the number is not the one it started with."),
  filled: state("data-filled", "Present while there is a number."),
  focused: state("data-focused", "Present while the input has focus."),
  valid: state("data-valid", "In a field: present once the number was checked and found right."),
  invalid: state("data-invalid", "In a field: present while the number is wrong."),
}
const ONE_OF = [["valid", "invalid"]] as const

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const numberFieldVocabulary = defineComponent({
  root: { description: "Groups the number field's parts.", states: STATES, exclusive: ONE_OF },
  group: {
    inside: "root",
    description: "What holds the input and its buttons, as one control.",
    states: STATES,
    exclusive: ONE_OF,
  },
  input: {
    inside: "group",
    description: "The text input: it takes what its locale writes a number with.",
    states: STATES,
    exclusive: ONE_OF,
  },
  increment: {
    inside: "group",
    description: "A button that steps the number up. Held, it goes on.",
    states: STATES,
    exclusive: ONE_OF,
  },
  decrement: {
    inside: "group",
    description: "A button that steps the number down. Held, it goes on.",
    states: STATES,
    exclusive: ONE_OF,
  },
})

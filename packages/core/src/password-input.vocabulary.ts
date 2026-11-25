import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

const STATES = {
  visible: state("data-visible", "Present while the password can be read."),
  disabled: DISABLED,
}
const INPUT = {
  touched: state("data-touched", "Present once focus has left it."),
  dirty: state("data-dirty", "Present once its text differs from what it began with."),
  filled: state("data-filled", "Present while it holds text."),
  focused: state("data-focused", "Present while it has focus."),
  valid: state("data-valid", "In a field: present once the value was checked and found right."),
  invalid: state("data-invalid", "In a field: present while the value is wrong."),
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const passwordInputVocabulary = defineComponent({
  root: { description: "A password that can be shown while it is typed.", states: STATES },
  input: {
    inside: "root",
    description:
      "The `<input>`: a password, or text while it is shown. In a `Field` it is the field's control.",
    states: { ...STATES, ...INPUT },
    exclusive: [["valid", "invalid"]],
  },
  toggle: {
    inside: "root",
    description: "Shows the password, and hides it again. Focus and the caret stay in the input.",
    states: STATES,
  },
  indicator: {
    inside: "toggle",
    optional: true,
    description: "What draws which of the two it is: an eye, open or struck.",
    states: STATES,
  },
})

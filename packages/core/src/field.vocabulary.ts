import { defineComponent } from "./part.ts"
import { DISABLED, TRANSITION, state } from "./states.ts"

const STATES = {
  disabled: DISABLED,
  touched: state("data-touched", "Present once focus has left the control."),
  dirty: state("data-dirty", "Present while the value is not the one it started with."),
  filled: state("data-filled", "Present while the control has a value."),
  focused: state("data-focused", "Present while the control has focus."),
  valid: state("data-valid", "Present once the value has been checked and found right."),
  invalid: state("data-invalid", "Present while the value is wrong."),
}
const ONE_OF = [["valid", "invalid"]] as const

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const fieldVocabulary = defineComponent({
  root: {
    description: "A control with its label, its description and its errors.",
    states: STATES,
    exclusive: ONE_OF,
  },
  label: {
    description: "The control's name: a press on it reaches the control.",
    states: STATES,
    exclusive: ONE_OF,
  },
  control: {
    description: "The control: an input, a textarea or a select.",
    states: STATES,
    exclusive: ONE_OF,
  },
  description: {
    description: "More about the control, said after its name.",
    states: STATES,
    exclusive: ONE_OF,
  },
  error: {
    description: "What is wrong with the value. In the page while it applies.",
    states: {
      ...STATES,
      startingStyle: TRANSITION.startingStyle,
      endingStyle: TRANSITION.endingStyle,
    },
    exclusive: [...ONE_OF, ["startingStyle", "endingStyle"]],
  },
})

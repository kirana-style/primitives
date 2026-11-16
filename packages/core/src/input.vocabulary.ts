import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const inputVocabulary = defineComponent({
  input: {
    description: "A text input. Inside a field it is the field's control.",
    states: {
      disabled: DISABLED,
      touched: state("data-touched", "Present once focus has left the input."),
      dirty: state("data-dirty", "Present while the value is not the one it started with."),
      filled: state("data-filled", "Present while the input has a value."),
      focused: state("data-focused", "Present while the input has focus."),
      valid: state("data-valid", "In a field: present once the value was checked and found right."),
      invalid: state("data-invalid", "In a field: present while the value is wrong."),
    },
    exclusive: [["valid", "invalid"]],
  },
})

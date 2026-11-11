import { defineComponent } from "./part.ts"
import { CHECKED, CONTROL, EITHER_CHECKED, TRANSITION, state } from "./states.ts"

const INDETERMINATE = state(
  "data-indeterminate",
  "Present when it is neither checked nor unchecked."
)

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const checkboxVocabulary = defineComponent({
  root: {
    description: "The box. It holds a hidden native checkbox, which a form and a label reach.",
    states: { ...CHECKED, indeterminate: INDETERMINATE, ...CONTROL },
    exclusive: EITHER_CHECKED,
  },
  indicator: {
    description: "The mark. In the page while the box is checked or indeterminate.",
    states: {
      ...CHECKED,
      indeterminate: INDETERMINATE,
      ...CONTROL,
      startingStyle: TRANSITION.startingStyle,
      endingStyle: TRANSITION.endingStyle,
    },
    exclusive: [...EITHER_CHECKED, ["startingStyle", "endingStyle"]],
  },
})

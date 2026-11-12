import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const toggleVocabulary = defineComponent({
  root: {
    description: "The button. It stays pressed until it is pressed again.",
    states: { pressed: state("data-pressed", "Present while it is pressed."), disabled: DISABLED },
  },
})

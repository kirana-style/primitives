import { defineComponent } from "./part.ts"
import { DISABLED } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const buttonVocabulary = defineComponent({
  root: {
    description: "The button.",
    states: { disabled: DISABLED },
  },
})

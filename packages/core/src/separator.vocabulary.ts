import { defineComponent } from "./part.ts"
import { valued } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const separatorVocabulary = defineComponent({
  root: {
    description: "The line.",
    states: {
      orientation: valued("data-orientation", ["horizontal", "vertical"], "The way the line runs."),
    },
  },
})

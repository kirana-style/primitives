import { defineComponent } from "./part.ts"
import { state } from "./states.ts"

export const qrCodeVocabulary = defineComponent({
  root: {
    description: "What holds the code.",
    states: {
      invalid: state("data-invalid", "Present when the value is longer than a code holds."),
    },
  },
  frame: { description: "The drawing: an `<svg>` a module to the unit." },
  pattern: { description: "The dark modules: one `<path>`, filled by the design." },
})

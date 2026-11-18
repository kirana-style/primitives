import { defineComponent } from "./part.ts"
import { DISABLED, state, valued } from "./states.ts"

const INVALID = state(
  "data-invalid",
  "Present when the date is outside what it takes, or is asked for and half typed."
)

export const dateFieldVocabulary = defineComponent({
  root: {
    description: "The field: a group of the date's parts.",
    states: {
      disabled: DISABLED,
      readonly: state("data-readonly", "Present when its value cannot be changed."),
      invalid: INVALID,
    },
  },
  segments: {
    description:
      "The date's segments, in the locale's order: each is given to draw. It draws no element.",
    inside: "root",
  },
  segment: {
    inside: "segments",
    repeated: true,
    description: "One piece of the date: a part that is typed, or what stands between two.",
    states: {
      segment: valued("data-segment", ["day", "month", "year", "literal"], "Which piece it is."),
      placeholder: state("data-placeholder", "Present on a part that is empty."),
      disabled: DISABLED,
      invalid: INVALID,
    },
  },
  input: { inside: "root", description: "The hidden input it is submitted by." },
})

import { defineComponent } from "./part.ts"
import { DISABLED, state, valued } from "./states.ts"

const INVALID = state(
  "data-invalid",
  "Present when the time is outside what it takes, or is asked for and half typed."
)

export const timeFieldVocabulary = defineComponent({
  root: {
    description: "The field: a group of the time's parts.",
    states: {
      disabled: DISABLED,
      readonly: state("data-readonly", "Present when its value cannot be changed."),
      invalid: INVALID,
    },
  },
  segments: {
    description:
      "The time's segments, in the locale's order: each is given to draw. It draws no element.",
    inside: "root",
  },
  segment: {
    inside: "segments",
    repeated: true,
    description: "One piece of the time: a part that is typed, or what stands between two.",
    states: {
      segment: valued(
        "data-segment",
        ["hour", "minute", "second", "dayPeriod", "literal"],
        "Which piece it is: `dayPeriod` is AM or PM, on a clock of twelve hours."
      ),
      placeholder: state("data-placeholder", "Present on a part that is empty."),
      disabled: DISABLED,
      invalid: INVALID,
    },
  },
  input: { inside: "root", description: "The hidden input it is submitted by." },
})

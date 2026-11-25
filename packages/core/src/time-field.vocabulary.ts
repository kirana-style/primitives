import { defineComponent } from "./part.ts"
import { DISABLED, state, valued } from "./states.ts"

const INVALID = state(
  "data-invalid",
  "Present when the time is outside what it takes, is asked for and half typed, or is wrong by its field."
)
const FIELD = {
  touched: state("data-touched", "In a field: present once focus has left it."),
  dirty: state("data-dirty", "In a field: present while the time is not the one it began with."),
  filled: state("data-filled", "In a field: present while it holds a time."),
  focused: state("data-focused", "In a field: present while one of its parts has focus."),
  valid: state("data-valid", "In a field: present once the time was checked and found right."),
}

export const timeFieldVocabulary = defineComponent({
  root: {
    description:
      "The field: a group of the time's parts. Inside a `Field` it is the field's control: the field's label names it (a press on the label goes to its first empty part), its description and messages describe it, and the field checks it.",
    states: {
      disabled: DISABLED,
      readonly: state("data-readonly", "Present when its value cannot be changed."),
      invalid: INVALID,
      ...FIELD,
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
      ...FIELD,
    },
  },
  input: { inside: "root", description: "The hidden input it is submitted by." },
})

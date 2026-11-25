import { defineComponent } from "./part.ts"
import { CONTROL, EITHER_VALID, FIELD, state } from "./states.ts"

const FOCUSED = state("data-focused", "Present while the input has focus.")
const COMPLETE = state("data-complete", "Present when every character is in.")
// What the root and every cell carry: the field's state inside a Field, and the code's own.
const CODE = {
  ...FIELD,
  ...CONTROL,
  focused: FOCUSED,
  complete: COMPLETE,
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const otpVocabulary = defineComponent({
  root: {
    description: "The code: the input and its cells.",
    states: {
      ...CODE,
      filled: state("data-filled", "Present when the code has a character in it."),
    },
    exclusive: EITHER_VALID,
  },
  input: {
    inside: "root",
    description:
      "The one input the code is typed in. A design lays it over the cells, unseen. It is named by the root's `id`; an `id` given to it is kept, so a `<label for>` names it.",
    states: { disabled: CONTROL.disabled },
  },
  group: { inside: "root", repeated: true, description: "Cells that are drawn together." },
  slot: {
    inside: "group",
    repeated: true,
    description: "One cell of the code.",
    states: {
      // Its place, as a number: any value.
      index: state("data-index", "The cell's place, from 0."),
      active: state(
        "data-active",
        "Present on the cell the next character goes in, or that is selected."
      ),
      ...CODE,
      filled: state("data-filled", "Present when the cell has its character."),
    },
    exclusive: EITHER_VALID,
  },
  separator: { inside: "root", repeated: true, description: "A mark between groups of cells." },
  caret: { inside: "slot", description: "A caret drawn in the active cell while it is empty." },
})

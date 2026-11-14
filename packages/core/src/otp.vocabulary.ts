import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const otpVocabulary = defineComponent({
  root: {
    description: "The code: the input and its cells.",
    states: {
      disabled: DISABLED,
      focused: state("data-focused", "Present while the input has focus."),
      complete: state("data-complete", "Present when every character is in."),
    },
  },
  input: {
    description: "The one input the code is typed in. A design lays it over the cells, unseen.",
    states: { disabled: DISABLED },
  },
  group: { description: "Cells that are drawn together." },
  slot: {
    description: "One cell of the code.",
    states: {
      // Its place, as a number: any value.
      index: state("data-index", "The cell's place, from 0."),
      active: state(
        "data-active",
        "Present on the cell the next character goes in, or that is selected."
      ),
      filled: state("data-filled", "Present when the cell has its character."),
      disabled: DISABLED,
    },
  },
  separator: { description: "A mark between groups of cells." },
  caret: { description: "A caret drawn in the active cell while it is empty." },
})

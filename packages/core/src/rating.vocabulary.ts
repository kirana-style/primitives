import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

const SHARED = {
  disabled: DISABLED,
  readonly: state("data-readonly", "Present when it is shown and cannot be changed."),
  required: state("data-required", "Present when a value is needed."),
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const ratingVocabulary = defineComponent({
  root: {
    description: "The items, as one choice: a radio group. It holds the hidden input a form reads.",
    states: {
      ...SHARED,
      hovering: state("data-hovering", "Present while a pointer is over an item."),
    },
  },
  items: {
    description: "The items, from 1 to `count`: each place is given to draw. It draws no element.",
    inside: "root",
  },
  item: {
    inside: "items",
    repeated: true,
    description: "One item (a star): pressed, the value is its place, or half of it.",
    states: {
      checked: state("data-checked", "Present on the item that holds the value."),
      filled: state(
        "data-filled",
        "Present on every item up to the value drawn: the one a pointer is over, or the one held."
      ),
      half: state("data-half", "Present on the item the value drawn fills by half."),
      ...SHARED,
    },
  },
})

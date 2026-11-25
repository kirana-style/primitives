import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

const SHARED = {
  disabled: DISABLED,
  readonly: state("data-readonly", "Present when the tags are shown and cannot be changed."),
  required: state("data-required", "Present when a tag is needed."),
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const tagsInputVocabulary = defineComponent({
  root: {
    description:
      "Several short texts held as tags, and the input a new one is typed in. It holds the hidden inputs a form reads.",
    states: {
      ...SHARED,
      focused: state("data-focused", "Present while focus is on a tag or in the input."),
      empty: state("data-empty", "Present while it holds no tag."),
    },
  },
  list: { inside: "root", description: "What holds the tags: a list.", states: SHARED },
  items: {
    inside: "list",
    description: "The tags, in order: each entry is given to draw. It draws no element.",
  },
  item: {
    inside: "items",
    repeated: true,
    description: "A tag: reached with the arrows, taken away with Backspace or Delete.",
    states: { ...SHARED, editing: state("data-editing", "Present while the tag is edited.") },
  },
  itemText: {
    inside: "item",
    description: "A tag's text: hidden while the tag is edited.",
    states: SHARED,
  },
  itemInput: {
    inside: "item",
    optional: true,
    description: "Where a tag is edited in place: hidden unless it is being edited.",
    states: SHARED,
  },
  itemRemove: {
    inside: "item",
    optional: true,
    description: "A tag's button that takes it away.",
    states: SHARED,
  },
  input: {
    inside: "root",
    description: "Where a new tag is typed. In a `Field` it is what the field's label names.",
    states: SHARED,
  },
  clear: {
    inside: "root",
    optional: true,
    description: "Takes every tag away: hidden while there is none.",
    states: SHARED,
  },
})

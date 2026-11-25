import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

const STATES = {
  editing: state("data-editing", "Present while it is being edited."),
  disabled: DISABLED,
  readonly: state("data-readonly", "Present when it is shown and cannot be edited."),
  placeholder: state("data-placeholder", "Present while it holds no text."),
  touched: state("data-touched", "In a field: present once focus has left it."),
  dirty: state("data-dirty", "In a field: present while the text is not the one it began with."),
  filled: state("data-filled", "In a field: present while it holds text."),
  focused: state("data-focused", "In a field: present while it has focus."),
  valid: state("data-valid", "In a field: present once the text was checked and found right."),
  invalid: state("data-invalid", "In a field: present while the text is wrong."),
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const editableVocabulary = defineComponent({
  root: { description: "A text edited in place.", states: STATES },
  preview: {
    inside: "root",
    description:
      "The text as it reads, or the placeholder while there is none: hidden while editing.",
    states: STATES,
  },
  input: {
    inside: "root",
    description: "Where the text is typed, an `<input>` or a `<textarea>`: hidden unless editing.",
    states: STATES,
  },
  editTrigger: {
    inside: "root",
    optional: true,
    description: "Starts an edit: hidden while editing.",
    states: STATES,
  },
  submitTrigger: {
    inside: "root",
    optional: true,
    description: "Keeps what was typed: hidden unless editing.",
    states: STATES,
  },
  cancelTrigger: {
    inside: "root",
    optional: true,
    description: "Drops what was typed: hidden unless editing.",
    states: STATES,
  },
})

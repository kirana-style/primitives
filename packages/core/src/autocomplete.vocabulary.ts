import { comboboxVocabulary } from "./combobox.vocabulary.ts"
import { defineComponent } from "./part.ts"

const {
  root,
  input,
  trigger,
  portal,
  positioner,
  popup,
  list,
  item,
  empty,
  clear,
  group,
  groupLabel,
  separator,
} = comboboxVocabulary

// An autocomplete's parts are a combobox's, without what a chosen value needs.
export const autocompleteVocabulary = defineComponent({
  root: {
    ...root,
    description:
      "Holds the autocomplete: the text, and whether the suggestions are open. It draws no element.",
  },
  input: {
    ...input,
    inside: "root",
    description: "The text input: its text is the value, and what is typed asks for suggestions.",
  },
  trigger,
  portal,
  positioner,
  popup,
  list,
  item: { ...item, description: "One suggestion: chosen, its text is written into the input." },
  group,
  groupLabel,
  separator,
  empty,
  clear,
})

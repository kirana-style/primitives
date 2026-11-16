import { comboboxVocabulary } from "./combobox.vocabulary.ts"
import { defineComponent } from "./part.ts"

const { input, trigger, positioner, popup, item, empty, clear, group, groupLabel, separator } =
  comboboxVocabulary

// An autocomplete's parts are a combobox's, without what a chosen value needs.
export const autocompleteVocabulary = defineComponent({
  input: {
    ...input,
    description: "The text input: its text is the value, and what is typed asks for suggestions.",
  },
  trigger,
  positioner,
  popup,
  item: { ...item, description: "One suggestion: chosen, its text is written into the input." },
  group,
  groupLabel,
  separator,
  empty,
  clear,
})

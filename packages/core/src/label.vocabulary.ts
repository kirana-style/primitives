import { defineComponent } from "./part.ts"
import { fieldVocabulary } from "./field.vocabulary.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const labelVocabulary = defineComponent({
  label: {
    description: "A control's name. Inside a field it is the field's label, with its states.",
    states: fieldVocabulary.label.states,
    exclusive: fieldVocabulary.label.exclusive,
  },
})

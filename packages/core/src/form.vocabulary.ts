import { defineComponent } from "./part.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const formVocabulary = defineComponent({
  root: {
    description:
      "The form. A submit checks every field in it and stops, with focus on the first that is invalid.",
  },
})

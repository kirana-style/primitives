import { defineComponent } from "./part.ts"

export const autosizeVocabulary = defineComponent({
  textarea: {
    description:
      "A `<textarea>` as tall as its text. Its `height` is written; `min-height` and `max-height` are the design's.",
  },
})

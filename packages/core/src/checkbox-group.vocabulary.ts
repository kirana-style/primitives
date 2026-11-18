import { defineComponent } from "./part.ts"
import { DISABLED } from "./states.ts"

// The group is one part: its checkboxes are checkboxes.
export const checkboxGroupVocabulary = defineComponent({
  root: {
    description:
      "The group. A checkbox inside it with a `value` is checked while the group's value holds it; one marked `parent` stands for every value of `allValues`.",
    states: { disabled: DISABLED },
  },
})

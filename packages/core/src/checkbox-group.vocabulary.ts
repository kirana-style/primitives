import { defineComponent } from "./part.ts"
import { DISABLED } from "./states.ts"

// The group is one part: its checkboxes are checkboxes.
export const checkboxGroupVocabulary = defineComponent({
  root: {
    description:
      "The group: `role=\"group\"`, with its `id`. Name it with `aria-label`, or `aria-labelledby` naming a heading of your own; inside a `Field`, the field's label names it and its description describes it. A checkbox anywhere inside it with a `value` is checked while the group's value holds it; one marked `parent`, anywhere inside it too, stands for every value of `allValues`, and its `aria-controls` names their boxes.",
    states: { disabled: DISABLED },
  },
})

import { defineComponent } from "./part.ts"
import { DISABLED, state, valued } from "./states.ts"

// The group is one part: its toggles are toggles.
export const toggleGroupVocabulary = defineComponent({
  root: {
    description: "The group. A toggle inside it with a `value` is one of its toggles.",
    states: {
      orientation: valued(
        "data-orientation",
        ["horizontal", "vertical"],
        "Whether its toggles are in a row or a column."
      ),
      multiple: state("data-multiple", "Present when several can be pressed at a time."),
      disabled: DISABLED,
    },
  },
})

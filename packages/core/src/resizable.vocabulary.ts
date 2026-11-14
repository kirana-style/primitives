import { defineComponent } from "./part.ts"
import { DISABLED, state, valued } from "./states.ts"

const ORIENTATION = valued(
  "data-orientation",
  ["horizontal", "vertical"],
  "Whether the panels are side by side or one over the other."
)

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const resizableVocabulary = defineComponent({
  group: {
    description: "The panels and the bars between them. A design lays it out as a flex box.",
    states: { orientation: ORIENTATION, disabled: DISABLED },
  },
  panel: {
    description: "One panel. It carries its share of the group.",
    states: { orientation: ORIENTATION },
    variables: { "--panel-size": "The panel's share, in hundredths of the group." },
  },
  handle: {
    description: "The bar between two panels: dragged, or moved with the arrows.",
    states: {
      orientation: ORIENTATION,
      dragging: state("data-dragging", "Present while the bar is dragged."),
      disabled: DISABLED,
    },
  },
})

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
    description:
      "The panels and the bars between them. A design lays it out as a flex box: `display: flex`, and `flex-direction: column` when it is vertical. A group in a panel that is a flex box itself takes `min-width: 0` and `min-height: 0`, or what it holds widens the panel.",
    states: { orientation: ORIENTATION, disabled: DISABLED },
  },
  panel: {
    inside: "group",
    repeated: true,
    description:
      "One panel. It carries its share of the group, written as its `flex` with `min-width: 0` and `min-height: 0`, so what it holds cannot keep it past its share. Its `overflow` is the design's.",
    states: { orientation: ORIENTATION },
    variables: { "--panel-size": "The panel's share, in hundredths of the group." },
  },
  handle: {
    inside: "group",
    repeated: true,
    description:
      "The bar between two panels: dragged, or moved with the arrows. A design gives it its thickness and `flex-shrink: 0`, so the panels do not squeeze it.",
    states: {
      orientation: ORIENTATION,
      dragging: state("data-dragging", "Present while the bar is dragged."),
      disabled: DISABLED,
    },
  },
})

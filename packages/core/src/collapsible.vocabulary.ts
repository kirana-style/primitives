import { defineComponent } from "./part.ts"
import { DISABLED, EITHER_FRAME, EITHER_OPEN, OPEN, TRANSITION, state } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const collapsibleVocabulary = defineComponent({
  root: {
    description: "Groups the trigger and the panel.",
    states: { ...OPEN, disabled: DISABLED },
    exclusive: EITHER_OPEN,
  },
  trigger: {
    description: "The button that opens and closes the panel.",
    states: {
      panelOpen: state("data-panel-open", "Present when the panel is open."),
      disabled: DISABLED,
    },
  },
  panel: {
    description: "The content. In the page while open, and through its exit's motion.",
    states: TRANSITION,
    exclusive: EITHER_FRAME,
    variables: {
      "--collapsible-panel-height":
        "The panel's content height while it opens or closes, `auto` once it is open.",
      "--collapsible-panel-width":
        "The panel's content width while it opens or closes, `auto` once it is open.",
    },
  },
})

import { defineComponent } from "./part.ts"
import { EITHER_FRAME, TRANSITION, state } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const dialogVocabulary = defineComponent({
  trigger: {
    description: "The button that opens the dialog.",
    states: { popupOpen: state("data-popup-open", "Present when the dialog is open.") },
  },
  backdrop: {
    description: "The layer over the page behind the dialog.",
    states: TRANSITION,
    exclusive: EITHER_FRAME,
  },
  popup: {
    description: "The dialog itself.",
    states: {
      ...TRANSITION,
      nestedDialogOpen: state(
        "data-nested-dialog-open",
        "Present when another dialog is open above this one."
      ),
    },
    exclusive: EITHER_FRAME,
    variables: { "--nested-dialogs": "How many dialogs are open above this one." },
  },
  title: { description: "The heading that names the dialog." },
  description: { description: "The text that describes the dialog." },
  close: { description: "A button that closes the dialog." },
})

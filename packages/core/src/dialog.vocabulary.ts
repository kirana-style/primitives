import { defineComponent } from "./part.ts"
import { EITHER_FRAME, TRANSITION, state } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const dialogVocabulary = defineComponent({
  root: { description: "Holds the dialog: whether it is open. It draws no element." },
  trigger: {
    inside: "root",
    description: "The button that opens the dialog.",
    states: { popupOpen: state("data-popup-open", "Present when the dialog is open.") },
  },
  portal: {
    description:
      "Draws what it holds at the end of `<body>`, or in the container a `PortalProvider` names. It draws no element.",
    inside: "root",
  },
  backdrop: {
    inside: "portal",
    description: "The layer over the page behind the dialog.",
    states: TRANSITION,
    exclusive: EITHER_FRAME,
  },
  viewport: {
    inside: "portal",
    optional: true,
    description:
      "What a long dialog scrolls in: it lies over the page, between the backdrop and the popup. A press on it beside the popup is a press outside the dialog; a press on its scrollbar is not.",
    states: {
      ...TRANSITION,
      nested: state("data-nested", "Present when the dialog opened over another dialog."),
      nestedDialogOpen: state(
        "data-nested-dialog-open",
        "Present when another dialog is open above this one."
      ),
    },
    exclusive: EITHER_FRAME,
  },
  popup: {
    inside: "viewport",
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
  title: { inside: "popup", description: "The heading that names the dialog." },
  description: { inside: "popup", description: "The text that describes the dialog." },
  close: { inside: "popup", description: "A button that closes the dialog." },
})

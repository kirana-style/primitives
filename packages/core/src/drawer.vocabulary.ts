import { dialogVocabulary } from "./dialog.vocabulary.ts"
import { defineComponent } from "./part.ts"
import { state, valued } from "./states.ts"

const SWIPING = state("data-swiping", "Present while the drawer is dragged.")
const MOVED = {
  "--drawer-swipe-movement-x": "How far it has been dragged across.",
  "--drawer-swipe-movement-y": "How far it has been dragged up or down.",
  "--drawer-swipe-progress": "How far it has been dragged, of its own size: 0 to 1.",
}

// A drawer's parts are a dialog's; two of them also say how far it has been dragged.
export const drawerVocabulary = defineComponent({
  ...dialogVocabulary,
  backdrop: {
    ...dialogVocabulary.backdrop,
    states: { ...dialogVocabulary.backdrop.states, swiping: SWIPING },
    variables: MOVED,
  },
  popup: {
    ...dialogVocabulary.popup,
    description:
      "The drawer. A design moves it by what it says of the drag, and gives it `touch-action: none` where a finger drags it.",
    states: {
      ...dialogVocabulary.popup.states,
      swiping: SWIPING,
      swipeDirection: valued(
        "data-swipe-direction",
        ["up", "down", "left", "right"],
        "The way it is dragged to close it."
      ),
    },
    variables: {
      ...dialogVocabulary.popup.variables,
      ...MOVED,
      "--drawer-height": "Its height.",
      "--drawer-width": "Its width.",
    },
  },
})

import { dialogVocabulary } from "./dialog.vocabulary.ts"
import { defineComponent } from "./part.ts"
import { state, valued } from "./states.ts"

const SWIPING = state("data-swiping", "Present while the drawer is dragged.")
const MOVED = {
  "--drawer-swipe-movement-x": "How far it has been dragged across.",
  "--drawer-swipe-movement-y": "How far it has been dragged up or down.",
  "--drawer-swipe-progress": "How far it has been dragged, of its own size: 0 to 1.",
  "--drawer-snap-point-offset":
    "How far from whole it rests, towards the edge it closes at: 0px at its largest snap point.",
}

// A drawer has no viewport: it lies at an edge of the page, and what scrolls is inside it.
const { viewport: _viewport, ...shared } = dialogVocabulary

// A drawer's parts are a dialog's; two of them also say how far it has been dragged.
export const drawerVocabulary = defineComponent({
  ...shared,
  backdrop: {
    ...dialogVocabulary.backdrop,
    states: { ...dialogVocabulary.backdrop.states, swiping: SWIPING },
    variables: MOVED,
  },
  popup: {
    ...dialogVocabulary.popup,
    inside: "portal",
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
      swipeDismiss: state("data-swipe-dismiss", "Present once a drag has closed it."),
      expanded: state("data-expanded", "Present while it rests whole, of several snap points."),
      nestedDrawerOpen: state(
        "data-nested-drawer-open",
        "Present while another drawer is open over it."
      ),
      nestedDrawerSwiping: state(
        "data-nested-drawer-swiping",
        "Present while a drawer over it is dragged."
      ),
    },
    variables: {
      ...dialogVocabulary.popup.variables,
      ...MOVED,
      "--drawer-height": "Its height.",
      "--nested-drawers": "How many drawers are open over it.",
      "--drawer-frontmost-height":
        "The height of the drawer in front of every other, while this one is open.",
      "--drawer-swipe-strength":
        "Once let go: 0.1 to 1, the share of the design's own time it should take to come to rest. A drawer thrown hard arrives sooner.",
      "--drawer-width": "Its width.",
    },
  },
})

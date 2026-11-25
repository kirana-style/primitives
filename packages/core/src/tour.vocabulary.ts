import { defineComponent } from "./part.ts"
import {
  ANCHORED,
  ANCHOR_HIDDEN,
  DISABLED,
  EITHER_FRAME,
  EITHER_OPEN,
  OPEN,
  PLACEMENT,
  TRANSITION,
  state,
} from "./states.ts"

const CENTERED = {
  centered: state(
    "data-centered",
    "Present while the step shown has no target in the page: the popup stands in the middle of the viewport."
  ),
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const tourVocabulary = defineComponent({
  root: {
    description:
      "Holds the tour: its steps, whether it is open and which step is shown. It draws no element.",
  },
  portal: {
    description:
      "Draws what it holds at the end of `<body>`, or in the container a `PortalProvider` names. It draws no element.",
    inside: "root",
  },
  spotlight: {
    inside: "portal",
    description:
      "A layer over the page with a hole over the step's target, which the design draws from its variables (a clip path, or a box with a large shadow). A press on it is a press outside the tour. While the target can be used (`interactive`), presses go through it.",
    states: { ...TRANSITION, ...CENTERED },
    exclusive: EITHER_FRAME,
    variables: {
      "--spotlight-left":
        "The hole's left edge, from the spotlight's own left edge: the target's, less `spotlightPadding`.",
      "--spotlight-top":
        "The hole's top edge, from the spotlight's own top edge: the target's, less `spotlightPadding`.",
      "--spotlight-width": "The hole's width: the target's, with `spotlightPadding` on each side.",
      "--spotlight-height":
        "The hole's height: the target's, with `spotlightPadding` on each side. With no target, the hole is a point in the middle.",
    },
  },
  positioner: {
    inside: "portal",
    description:
      "Places the popup against the step's target, or in the middle of the viewport for a step with none. It carries the geometry.",
    states: { ...OPEN, ...PLACEMENT, ...CENTERED, anchorHidden: ANCHOR_HIDDEN },
    exclusive: EITHER_OPEN,
    variables: ANCHORED,
  },
  popup: {
    inside: "positioner",
    description:
      "The step itself: a dialog that stays in the page from the first step to the last, and moves.",
    states: { ...TRANSITION, ...PLACEMENT, ...CENTERED },
    exclusive: EITHER_FRAME,
  },
  arrow: {
    inside: "popup",
    description: "An element that points at the target, placed along the popup's edge.",
    exclusive: EITHER_OPEN,
    states: {
      ...OPEN,
      ...PLACEMENT,
      uncentered: state(
        "data-uncentered",
        "Present when the popup was pushed along its edge, so the arrow is not at the target's centre."
      ),
      ...CENTERED,
    },
  },
  title: { inside: "popup", description: "The heading that names the step." },
  description: { inside: "popup", description: "The text that describes the step." },
  previous: {
    inside: "popup",
    description: "A button that goes back a step. On the first step it does nothing.",
    states: { disabled: DISABLED },
  },
  next: {
    inside: "popup",
    description: "A button that goes on a step. On the last step it finishes the tour.",
    states: {
      last: state("data-last", "Present on the last step: a press finishes the tour."),
    },
  },
  close: { inside: "popup", description: "A button that ends the tour." },
})

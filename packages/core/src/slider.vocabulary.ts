import { defineComponent } from "./part.ts"
import { DISABLED, state, valued } from "./states.ts"

const STATES = {
  orientation: valued("data-orientation", ["horizontal", "vertical"], "The way the track runs."),
  disabled: DISABLED,
  dragging: state("data-dragging", "Present while a pointer holds a thumb."),
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const sliderVocabulary = defineComponent({
  root: { description: "Groups the slider's parts.", states: STATES },
  value: { description: "The value, written.", states: STATES },
  control: {
    description: "What a pointer presses and drags on. It holds the track and the thumbs.",
    states: STATES,
  },
  track: { description: "The whole range.", states: STATES },
  indicator: {
    description:
      "The filled part: up to the thumb, or from the first thumb to the last. Its place and length are written on it.",
    states: STATES,
  },
  thumb: {
    description:
      "What is dragged, and what the keyboard moves: a slider to assistive technology. Its place on the track is written on it. It holds a hidden input, which a form reads.",
    states: {
      ...STATES,
      index: {
        attribute: "data-index",
        description: "Which thumb it is, from 0.",
      },
    },
  },
})

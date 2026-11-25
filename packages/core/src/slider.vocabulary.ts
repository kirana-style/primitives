import { defineComponent } from "./part.ts"
import { CONTROL, DISABLED, EITHER_VALID, FIELD, state, valued } from "./states.ts"

const STATES = {
  orientation: valued("data-orientation", ["horizontal", "vertical"], "The way the track runs."),
  disabled: DISABLED,
  readonly: CONTROL.readonly,
  dragging: state("data-dragging", "Present while a pointer holds a thumb."),
  ...FIELD,
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const sliderVocabulary = defineComponent({
  root: { description: "Groups the slider's parts.", states: STATES, exclusive: EITHER_VALID },
  value: {
    inside: "root",
    description: "The value, written.",
    states: STATES,
    exclusive: EITHER_VALID,
  },
  control: {
    inside: "root",
    description: "What a pointer presses and drags on. It holds the track and the thumbs.",
    states: STATES,
    exclusive: EITHER_VALID,
  },
  track: {
    inside: "control",
    description: "The whole range.",
    states: STATES,
    exclusive: EITHER_VALID,
  },
  indicator: {
    inside: "track",
    description:
      "The filled part: up to the thumb, or from the first thumb to the last. Its place and length are written on it inline, and a design does not set these: `position: relative`, `inset-inline-start` and `width`, with `height: inherit` (on a vertical slider, `position: absolute`, `bottom` and `height`, with `width: inherit`).",
    states: STATES,
    exclusive: EITHER_VALID,
    variables: {
      "--start-position":
        "With thumbs that stay inside the control: where the filled part starts, or with one thumb where it ends.",
      "--relative-size":
        "With thumbs that stay inside the control and a range: the filled part's length.",
    },
  },
  thumb: {
    inside: "track",
    repeated: true,
    description:
      "What is dragged, and what the keyboard moves: a slider to assistive technology. Its place on the track is written on it inline, and a design does not set these: `position: absolute`, `inset-inline-start` at its value's place and `top: 50%` (on a vertical slider, `bottom` and `left: 50%`), and a `translate` that centres it there (with `thumbAlignment: \"edge\"`, one that keeps it inside). The track needs `position: relative`. It holds a hidden input, which a form reads. A thumb that is given no `index` is the value at its place among the slider's thumbs, in the order they are written.",
    states: {
      ...STATES,
      index: {
        attribute: "data-index",
        description: "Which thumb it is, from 0.",
      },
    },
    exclusive: EITHER_VALID,
    variables: {
      "--position": "With thumbs that stay inside the control: where the thumb's centre is.",
    },
  },
})

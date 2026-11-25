import { defineComponent } from "./part.ts"
import { CONTROL, state, valued } from "./states.ts"

const STATES = {
  ...CONTROL,
  required: state("data-required", "Present when the form needs a colour."),
  dragging: state("data-dragging", "Present while a pointer holds a thumb of the picker."),
}
const FORMAT = valued("data-format", ["hex", "rgb", "hsl"], "How the value is written.")
const OWN_DRAG = state("data-dragging", "Present while a pointer holds this part's thumb.")
const SLIDER = {
  ...STATES,
  dragging: OWN_DRAG,
  channel: valued("data-channel", ["hue", "alpha"], "The channel the slider moves."),
  orientation: valued("data-orientation", ["horizontal", "vertical"], "The way the track runs."),
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const colorPickerVocabulary = defineComponent({
  root: {
    description:
      "Groups the picker's parts. It holds the hidden input a form reads, and the colour for anything inside to paint with.",
    states: { ...STATES, format: FORMAT },
    variables: { "--color": "The colour, with its alpha." },
  },
  area: {
    inside: "root",
    description:
      "The two-dimensional field a pointer presses and drags on: saturation across, the way the text runs, and brightness up. A design paints it from its hue.",
    states: { ...STATES, dragging: OWN_DRAG },
    variables: { "--hue-color": "The colour's hue at full saturation and brightness." },
  },
  areaThumb: {
    inside: "area",
    description:
      "What is dragged in the area, and what the arrows move: a slider in two dimensions to assistive technology, its text saying both. Its place is written on it.",
    states: { ...STATES, dragging: OWN_DRAG },
    variables: {
      "--saturation": "Its place across, as a share of the area: the saturation.",
      "--brightness": "Its place up, as a share of the area: the brightness.",
      "--color": "The colour under it, without its alpha.",
    },
  },
  channelSlider: {
    inside: "root",
    repeated: true,
    description:
      "What a pointer presses and drags on to move the hue or the alpha. It holds the track and the thumb. It takes `channel` and `orientation`.",
    states: SLIDER,
  },
  channelSliderTrack: {
    inside: "channelSlider",
    description: "The channel's whole range: what a design paints the hues or the alpha on.",
    states: SLIDER,
    variables: {
      "--color": "The colour without its alpha: the end of an alpha track.",
      "--hue-color": "The colour's hue at full saturation and brightness.",
    },
  },
  channelSliderThumb: {
    inside: ["channelSliderTrack", "channelSlider"],
    description:
      "What is dragged, and what the keyboard moves: a slider to assistive technology, its range 0 to 360 for the hue and 0 to 100 for the alpha. Its place on the track is written on it.",
    states: SLIDER,
    variables: {
      "--color": "The colour under it: the pure hue, or the colour at its alpha.",
    },
  },
  channelInput: {
    inside: "root",
    repeated: true,
    description:
      "A text input for one channel (`hex`, `red`, `green`, `blue`, `hue`, `saturation`, `lightness`, `alpha`). What is typed is taken when it is a colour or a number in range, and put back when focus leaves while it is not.",
    states: {
      ...STATES,
      channel: valued(
        "data-channel",
        ["hex", "red", "green", "blue", "hue", "saturation", "lightness", "alpha"],
        "The channel the input is typed in."
      ),
    },
  },
  swatch: {
    inside: "root",
    repeated: true,
    description: "Shows the current colour.",
    states: STATES,
    variables: { "--color": "The colour, with its alpha." },
  },
  swatchTrigger: {
    inside: "root",
    repeated: true,
    description: "A preset colour, given as `value`: pressed, the colour is this one.",
    states: {
      ...STATES,
      selected: state("data-selected", "Present while the colour is this one."),
    },
    variables: { "--color": "The preset's colour, with its alpha." },
  },
  eyeDropperTrigger: {
    inside: "root",
    description:
      "Picks a colour from the screen with the browser's eye dropper. Hidden where the browser has none, and on a server.",
    states: STATES,
  },
  valueText: {
    inside: "root",
    description: "The colour, written in its format.",
    states: { ...STATES, format: FORMAT },
  },
  formatTrigger: {
    inside: "root",
    description: "Goes to the next format: hex, then rgb, then hsl.",
    states: { ...STATES, format: FORMAT },
  },
})

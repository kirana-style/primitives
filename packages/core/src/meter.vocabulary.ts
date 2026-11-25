import { defineComponent } from "./part.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const meterVocabulary = defineComponent({
  root: {
    description: "The meter: it says the value to assistive technology.",
    variables: {
      "--meter-value":
        "The value's share of the range, a number from 0 (at `min`) to 1 (at `max`), which every part inherits: what a ring or a gauge is drawn from.",
    },
  },
  track: { inside: "root", description: "The whole range." },
  indicator: {
    inside: "track",
    description: "The filled part: its width is the value's share of the range.",
  },
  value: { inside: "root", description: "The value, written." },
  label: { inside: "root", description: "The meter's name." },
})

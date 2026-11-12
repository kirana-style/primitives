import { defineComponent } from "./part.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const meterVocabulary = defineComponent({
  root: { description: "The meter: it says the value to assistive technology." },
  track: { description: "The whole range." },
  indicator: { description: "The filled part: its width is the value's share of the range." },
  value: { description: "The value, written." },
  label: { description: "The meter's name." },
})

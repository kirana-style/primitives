import { defineComponent } from "./part.ts"
import { CHECKED, CONTROL, EITHER_CHECKED } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const switchVocabulary = defineComponent({
  root: {
    description: "The track. It holds a hidden native checkbox, which a form and a label reach.",
    states: { ...CHECKED, ...CONTROL },
    exclusive: EITHER_CHECKED,
  },
  thumb: {
    description: "The knob that moves along the track.",
    states: { ...CHECKED, ...CONTROL },
    exclusive: EITHER_CHECKED,
  },
})

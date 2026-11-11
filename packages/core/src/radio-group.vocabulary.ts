import { defineComponent } from "./part.ts"
import { CHECKED, CONTROL, EITHER_CHECKED, TRANSITION } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const radioGroupVocabulary = defineComponent({
  root: {
    description: "Groups the items: one of them is chosen at most.",
    states: CONTROL,
  },
  item: {
    description: "One choice. It holds a hidden native radio, which a form and a label reach.",
    states: { ...CHECKED, ...CONTROL },
    exclusive: EITHER_CHECKED,
  },
  indicator: {
    description: "The mark. In the page while its item is the chosen one.",
    states: {
      ...CHECKED,
      ...CONTROL,
      startingStyle: TRANSITION.startingStyle,
      endingStyle: TRANSITION.endingStyle,
    },
    exclusive: [...EITHER_CHECKED, ["startingStyle", "endingStyle"]],
  },
})

import { defineComponent } from "./part.ts"
import { CHECKED, CONTROL, EITHER_CHECKED, EITHER_VALID, FIELD, TRANSITION } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const radioGroupVocabulary = defineComponent({
  root: {
    description: "Groups the items: one of them is chosen at most.",
    states: { ...CONTROL, ...FIELD },
    exclusive: EITHER_VALID,
  },
  item: {
    inside: "root",
    repeated: true,
    description:
      "One choice. It holds a hidden native radio, which a form and a label reach: the item's `id` (`kpId` on Angular, `kui-id` on a custom element) is the radio's, which a `<label for>` names.",
    states: { ...CHECKED, ...CONTROL, ...FIELD },
    exclusive: [...EITHER_CHECKED, ...EITHER_VALID],
  },
  indicator: {
    inside: "item",
    description: "The mark. In the page while its item is the chosen one.",
    states: {
      ...CHECKED,
      ...CONTROL,
      ...FIELD,
      startingStyle: TRANSITION.startingStyle,
      endingStyle: TRANSITION.endingStyle,
    },
    exclusive: [...EITHER_CHECKED, ...EITHER_VALID, ["startingStyle", "endingStyle"]],
  },
})

import { defineComponent } from "./part.ts"
import { DISABLED } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const fieldsetVocabulary = defineComponent({
  root: { description: "The group of fields.", states: { disabled: DISABLED } },
  legend: { description: "The group's name.", states: { disabled: DISABLED } },
})

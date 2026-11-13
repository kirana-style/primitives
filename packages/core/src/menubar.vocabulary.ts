import { defineComponent } from "./part.ts"
import { DISABLED } from "./states.ts"

// The bar is one part: its menus are menus, with their own parts.
export const menubarVocabulary = defineComponent({
  root: {
    description: "The row of menus. A menu inside it is one of its items.",
    states: { disabled: DISABLED },
  },
})

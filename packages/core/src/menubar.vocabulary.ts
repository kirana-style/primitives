import { defineComponent } from "./part.ts"
import { DISABLED, state, valued } from "./states.ts"

// The bar is one part: its menus are menus, with their own parts.
export const menubarVocabulary = defineComponent({
  root: {
    description: "The row of menus. A menu inside it is one of its items.",
    states: {
      disabled: DISABLED,
      modal: state("data-modal", "Present when its menus hold the page while one is open."),
      hasSubmenuOpen: state("data-has-submenu-open", "Present while one of its menus is open."),
      orientation: valued(
        "data-orientation",
        ["horizontal", "vertical"],
        "Whether its menus are in a row or a column."
      ),
    },
  },
})

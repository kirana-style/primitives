import { defineComponent } from "./part.ts"
import { DISABLED, valued } from "./states.ts"

const ITEM = {
  orientation: valued(
    "data-orientation",
    ["horizontal", "vertical"],
    "Whether the toolbar is a row or a column."
  ),
  disabled: DISABLED,
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const toolbarVocabulary = defineComponent({
  root: { description: "The toolbar. It is one stop for Tab.", states: ITEM },
  button: {
    inside: "group",
    repeated: true,
    description: "A button of the toolbar.",
    states: ITEM,
  },
  link: { inside: "group", repeated: true, description: "A link of the toolbar.", states: ITEM },
  input: {
    inside: "group",
    repeated: true,
    description:
      "A text input of the toolbar. The arrows are its own until the caret is at an end.",
    states: ITEM,
  },
  group: {
    inside: "root",
    optional: true,
    repeated: true,
    description: "Items that belong together.",
    states: ITEM,
  },
  separator: {
    inside: "root",
    repeated: true,
    description: "A line between items, across the toolbar.",
    states: { orientation: ITEM.orientation },
  },
})

import { defineComponent } from "./part.ts"
import { DISABLED, state, valued } from "./states.ts"

const ITEM = {
  orientation: valued(
    "data-orientation",
    ["horizontal", "vertical"],
    "Whether the toolbar is a row or a column."
  ),
  disabled: DISABLED,
}

// A control that can keep focus while disabled.
const CONTROL = {
  ...ITEM,
  focusable: state(
    "data-focusable",
    "Present when it stays focusable while disabled: the arrows still reach it."
  ),
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const toolbarVocabulary = defineComponent({
  root: { description: "The toolbar. It is one stop for Tab.", states: ITEM },
  button: {
    inside: "group",
    repeated: true,
    description: "A button of the toolbar.",
    states: CONTROL,
  },
  link: { inside: "group", repeated: true, description: "A link of the toolbar.", states: ITEM },
  input: {
    inside: "group",
    repeated: true,
    description:
      "A text input of the toolbar. The arrows are its own until the caret is at an end.",
    states: CONTROL,
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

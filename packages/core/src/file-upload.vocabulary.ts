import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

const SHARED = {
  disabled: DISABLED,
  dragging: state("data-dragging", "Present while files are dragged over the dropzone."),
  required: state("data-required", "Present when a file is needed."),
}

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const fileUploadVocabulary = defineComponent({
  root: {
    description: "Files chosen to be sent.",
    states: { ...SHARED, empty: state("data-empty", "Present while it holds no file.") },
  },
  dropzone: {
    inside: "root",
    description:
      "Where files are dropped or pasted; pressed, it opens the file picker. It holds the hidden file input.",
    states: SHARED,
  },
  trigger: {
    // Beside the dropzone, or in it: a press on it is then its own, not the dropzone's.
    inside: ["root", "dropzone"],
    optional: true,
    description: "A button that opens the file picker.",
    states: SHARED,
  },
  list: { inside: "root", description: "What holds the files: a list.", states: SHARED },
  items: {
    inside: "list",
    description: "The files, in order: each entry is given to draw. It draws no element.",
  },
  item: { inside: "items", repeated: true, description: "A file.", states: SHARED },
  itemName: { inside: "item", description: "A file's name.", states: SHARED },
  itemSize: {
    inside: "item",
    optional: true,
    description: "A file's size, as people read one.",
    states: SHARED,
  },
  itemRemove: {
    inside: "item",
    optional: true,
    description: "A file's button that takes it away.",
    states: SHARED,
  },
  clear: {
    inside: "root",
    optional: true,
    description: "Takes every file away: hidden while there is none.",
    states: SHARED,
  },
})

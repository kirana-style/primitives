import { defineComponent } from "./part.ts"
import { state } from "./states.ts"

const AT_BOTTOM = state("data-at-bottom", "Present while the newest message is in view.")

export const messageScrollerVocabulary = defineComponent({
  root: {
    description: "What holds the conversation and its button.",
    states: { atBottom: AT_BOTTOM },
  },
  viewport: {
    inside: "root",
    description: "What scrolls: a log, reached by the keyboard.",
    states: { atBottom: AT_BOTTOM },
  },
  content: { inside: "viewport", description: "The messages: what grows as one is written." },
  button: {
    inside: "root",
    description: "Goes to the newest message. Inert while that is in view.",
    states: { atBottom: AT_BOTTOM },
  },
})

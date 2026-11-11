import { collapsibleVocabulary } from "./collapsible.ts"
import { dialogVocabulary } from "./dialog.ts"
import { popoverVocabulary } from "./popover.ts"
import { selectVocabulary } from "./select.ts"

/**
 * Every component's parts with their states and CSS variables, as data. This is what
 * `@kirana-ui/vocabulary` publishes: a styling system reads it (Kirana's typed state keys,
 * Tailwind variants, a plain-CSS reference) and the conformance tests hold the parts to it.
 */
export const vocabulary = {
  collapsible: collapsibleVocabulary,
  dialog: dialogVocabulary,
  popover: popoverVocabulary,
  select: selectVocabulary,
} as const

export type Vocabulary = typeof vocabulary

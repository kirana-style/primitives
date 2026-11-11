import { collapsibleVocabulary } from "./collapsible.vocabulary.ts"
import { dialogVocabulary } from "./dialog.vocabulary.ts"
import { popoverVocabulary } from "./popover.vocabulary.ts"
import { selectVocabulary } from "./select.vocabulary.ts"

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

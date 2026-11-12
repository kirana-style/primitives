import { avatarVocabulary } from "./avatar.vocabulary.ts"
import { buttonVocabulary } from "./button.vocabulary.ts"
import { meterVocabulary } from "./meter.vocabulary.ts"
import { progressVocabulary } from "./progress.vocabulary.ts"
import { separatorVocabulary } from "./separator.vocabulary.ts"
import { toggleVocabulary } from "./toggle.vocabulary.ts"
import { accordionVocabulary } from "./accordion.vocabulary.ts"
import { checkboxVocabulary } from "./checkbox.vocabulary.ts"
import { collapsibleVocabulary } from "./collapsible.vocabulary.ts"
import { dialogVocabulary } from "./dialog.vocabulary.ts"
import { hoverCardVocabulary } from "./hover-card.vocabulary.ts"
import { popoverVocabulary } from "./popover.vocabulary.ts"
import { radioGroupVocabulary } from "./radio-group.vocabulary.ts"
import { selectVocabulary } from "./select.vocabulary.ts"
import { switchVocabulary } from "./switch.vocabulary.ts"
import { tabsVocabulary } from "./tabs.vocabulary.ts"
import { tooltipVocabulary } from "./tooltip.vocabulary.ts"

/**
 * Every component's parts with their states and CSS variables, as data. This is what
 * `@kirana-ui/vocabulary` publishes: a styling system reads it (Kirana's typed state keys,
 * Tailwind variants, a plain-CSS reference) and the conformance tests hold the parts to it.
 */
export const vocabulary = {
  accordion: accordionVocabulary,
  // An alert dialog's parts are a dialog's.
  alertDialog: dialogVocabulary,
  avatar: avatarVocabulary,
  button: buttonVocabulary,
  checkbox: checkboxVocabulary,
  collapsible: collapsibleVocabulary,
  dialog: dialogVocabulary,
  hoverCard: hoverCardVocabulary,
  meter: meterVocabulary,
  popover: popoverVocabulary,
  progress: progressVocabulary,
  radioGroup: radioGroupVocabulary,
  select: selectVocabulary,
  separator: separatorVocabulary,
  switch: switchVocabulary,
  tabs: tabsVocabulary,
  toggle: toggleVocabulary,
  tooltip: tooltipVocabulary,
} as const

export type Vocabulary = typeof vocabulary

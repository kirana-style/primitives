import { avatarVocabulary } from "./avatar.vocabulary.ts"
import { buttonVocabulary } from "./button.vocabulary.ts"
import { meterVocabulary } from "./meter.vocabulary.ts"
import { progressVocabulary } from "./progress.vocabulary.ts"
import { scrollAreaVocabulary } from "./scroll-area.vocabulary.ts"
import { toggleGroupVocabulary } from "./toggle-group.vocabulary.ts"
import { toolbarVocabulary } from "./toolbar.vocabulary.ts"
import { separatorVocabulary } from "./separator.vocabulary.ts"
import { toggleVocabulary } from "./toggle.vocabulary.ts"
import { accordionVocabulary } from "./accordion.vocabulary.ts"
import { checkboxVocabulary } from "./checkbox.vocabulary.ts"
import { comboboxVocabulary } from "./combobox.vocabulary.ts"
import { listboxVocabulary } from "./listbox.vocabulary.ts"
import { collapsibleVocabulary } from "./collapsible.vocabulary.ts"
import { dialogVocabulary } from "./dialog.vocabulary.ts"
import { fieldVocabulary } from "./field.vocabulary.ts"
import { fieldsetVocabulary } from "./fieldset.vocabulary.ts"
import { formVocabulary } from "./form.vocabulary.ts"
import { hoverCardVocabulary } from "./hover-card.vocabulary.ts"
import { menuVocabulary } from "./menu.vocabulary.ts"
import { menubarVocabulary } from "./menubar.vocabulary.ts"
import { state } from "./states.ts"
import { navigationMenuVocabulary } from "./navigation-menu.vocabulary.ts"
import { otpVocabulary } from "./otp.vocabulary.ts"
import { resizableVocabulary } from "./resizable.vocabulary.ts"
import { popoverVocabulary } from "./popover.vocabulary.ts"
import { radioGroupVocabulary } from "./radio-group.vocabulary.ts"
import { selectVocabulary } from "./select.vocabulary.ts"
import { sliderVocabulary } from "./slider.vocabulary.ts"
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
  combobox: comboboxVocabulary,
  // A context menu's parts are a menu's, but for its trigger: an area, not a button.
  contextMenu: {
    ...menuVocabulary,
    trigger: {
      description:
        "The area a secondary press, or a long press on a touch screen, opens the menu in.",
      states: { popupOpen: state("data-popup-open", "Present when the menu is open.") },
    },
  },
  dialog: dialogVocabulary,
  field: fieldVocabulary,
  fieldset: fieldsetVocabulary,
  form: formVocabulary,
  hoverCard: hoverCardVocabulary,
  listbox: listboxVocabulary,
  menu: menuVocabulary,
  menubar: menubarVocabulary,
  meter: meterVocabulary,
  navigationMenu: navigationMenuVocabulary,
  otp: otpVocabulary,
  popover: popoverVocabulary,
  progress: progressVocabulary,
  radioGroup: radioGroupVocabulary,
  resizable: resizableVocabulary,
  scrollArea: scrollAreaVocabulary,
  select: selectVocabulary,
  separator: separatorVocabulary,
  slider: sliderVocabulary,
  switch: switchVocabulary,
  tabs: tabsVocabulary,
  toggle: toggleVocabulary,
  toggleGroup: toggleGroupVocabulary,
  toolbar: toolbarVocabulary,
  tooltip: tooltipVocabulary,
} as const

export type Vocabulary = typeof vocabulary

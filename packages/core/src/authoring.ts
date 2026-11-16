/**
 * What the components are built from, for building one's own: the same services, with the
 * same guarantees, and nothing a component of this library uses that is not here.
 * `docs/authoring.md` builds a component from them end to end.
 *
 * The signals, `bindable`, `details`, `flag`, `mergeProps` and `bind` are in the package's
 * root entry (`@kirana-ui/core`).
 */

// A part's states and variables as data: what a design system and a test read.
export { defineComponent } from "./part.ts"
export type { ComponentDefinition, PartDefinition, StateDefinition } from "./part.ts"
export {
  ANCHORED,
  CHECKED,
  DISABLED,
  EITHER_CHECKED,
  EITHER_FRAME,
  EITHER_OPEN,
  OPEN,
  PLACEMENT,
  TRANSITION,
  state,
  valued,
} from "./states.ts"

// In the page while open and through its exit: starting and ending styles, and the wait for
// the element's own motion to end.
export { createPresence, whenSettled, whenWritten } from "./services/presence.ts"
export type { Presence, PresenceHooks, TransitionStatus } from "./services/presence.ts"
// A panel that opens by growing: its size as variables.
export { createPanelPresence } from "./services/panel.ts"

// A popup: presence, its place in the stack of open popups (Escape, a press outside), focus in
// and back, a modal one's hold on the page, and its place against its trigger.
export { createPopup } from "./services/popup.ts"
export type { Popup, PopupContext, PopupFocus, PopupOptions } from "./services/popup.ts"
export { lockPage, popupFocus } from "./services/popup-focus.ts"
export { layerBelow, layersAbove, layersChanged, layersFrom, pushLayer } from "./services/layers.ts"
export type { Layer } from "./services/layers.ts"
export { focusScope, isolate, tabbables } from "./services/focus.ts"
export type { FocusScopeOptions } from "./services/focus.ts"
export { lockScroll } from "./services/scroll-lock.ts"

// Where a popup lies: Floating UI, with Base UI's variables written on the positioner.
export {
  POSITION_DEFAULTS,
  createPlacement,
  createPosition,
  pointAnchor,
} from "./services/position.ts"
export type {
  Align,
  Anchor,
  PopupPlacement,
  Position,
  PositionOptions,
  Side,
} from "./services/position.ts"
// A measure written on an element's style, and kept there when a framework rewrites the style.
export { clearGeometry, setGeometry } from "./services/geometry.ts"

// A popup the pointer opens: delays, the strip a pointer may cross, one open at a time.
export { createHover } from "./services/hover.ts"
export type { Hover, HoverOptions } from "./services/hover.ts"
export { createSafeArea } from "./services/safe-area.ts"

// Moving through rows with the pointer and the keys: a menu's items, a select's options.
export { createList, pointerMoved } from "./services/list.ts"
export type { List, ListCollection, ListRow, ListRowOptions } from "./services/list.ts"
// For a list of which only some rows are in the page.
export { byPlace } from "./services/list-places.ts"
export { createTypeahead, printable, textOf } from "./services/typeahead.ts"
export type { Typeahead } from "./services/typeahead.ts"

// Arrow keys over a set of elements that is one stop for Tab: tabs, radios, a toolbar.
export { createRoving, createTabStop, stepTo } from "./services/roving.ts"
export type { Orientation, Roving, Step, TabStop } from "./services/roving.ts"

// What a control that is not a native one owes the form around it.
export {
  createFormControl,
  formOf,
  inDisabledFieldset,
  onFormReset,
} from "./services/form-control.ts"
export type { FormControl } from "./services/form-control.ts"

// The reading direction: a provider's where there is one, the element's own otherwise.
export { carryDirection, directionOf } from "./direction.ts"
export type { Direction, DirectionAround } from "./direction.ts"

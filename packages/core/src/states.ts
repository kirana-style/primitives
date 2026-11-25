import type { StateDefinition } from "./part.ts"

/** A state an attribute marks by being present. */
export function state(attribute: string, description: string): StateDefinition {
  return { attribute, description }
}

/** A state an attribute carries as one of several values. */
export function valued<const Values extends readonly string[]>(
  attribute: string,
  values: Values,
  description: string
): StateDefinition & { values: Values } {
  return { attribute, values, description }
}

// The states and variables several components share, written once so they read the same.

export const OPEN = {
  open: state("data-open", "Present when it is open."),
  closed: state("data-closed", "Present when it is closed."),
}

export const TRANSITION = {
  ...OPEN,
  startingStyle: state(
    "data-starting-style",
    "Present for the first style of its entrance: what it animates in from."
  ),
  endingStyle: state(
    "data-ending-style",
    "Present through its exit: what it animates out to. It leaves the page when the motion ends."
  ),
}

export const PLACEMENT = {
  side: valued(
    "data-side",
    ["top", "right", "bottom", "left", "inline-start", "inline-end"],
    "The side of the anchor it is on, after any flip. Asked for as `inline-start` or `inline-end`, it says one of those two when it is beside its anchor."
  ),
  align: valued("data-align", ["start", "center", "end"], "How it is aligned with the anchor."),
}

export const DISABLED = state("data-disabled", "Present when it is disabled.")

export const ANCHORED = {
  "--anchor-width": "The anchor's width.",
  "--anchor-height": "The anchor's height.",
  "--available-width": "The width between the anchor and the edge of the viewport.",
  "--available-height": "The height between the anchor and the edge of the viewport.",
  "--transform-origin": "The point of the popup nearest its anchor, to scale from.",
}

/** `open` and `closed` never hold together; nor do the two frames of a transition. */
export const EITHER_OPEN = [["open", "closed"]] as const
export const EITHER_FRAME = [
  ["open", "closed"],
  ["startingStyle", "endingStyle"],
] as const

export const CHECKED = {
  checked: state("data-checked", "Present when it is checked."),
  unchecked: state("data-unchecked", "Present when it is not checked."),
}

/** What a form control's parts all carry. */
export const CONTROL = {
  disabled: DISABLED,
  readonly: state("data-readonly", "Present when it can be read but not changed."),
  required: state("data-required", "Present when the form needs it."),
}

export const EITHER_CHECKED = [["checked", "unchecked"]] as const

/**
 * The state of the Field a control is in, which every part of the control carries: what the
 * field itself says, at the same moment. Absent on a control that is in no Field.
 */
export const FIELD = {
  touched: state("data-touched", "Inside a Field: present once focus has left the control."),
  dirty: state(
    "data-dirty",
    "Inside a Field: present while the value is not the one it started with."
  ),
  filled: state("data-filled", "Inside a Field: present while the control has a value."),
  focused: state("data-focused", "Inside a Field: present while the control has focus."),
  valid: state(
    "data-valid",
    "Inside a Field: present once the value has been checked and found right."
  ),
  invalid: state("data-invalid", "Inside a Field: present while the value is wrong."),
}

/** A value is never found right and wrong at once. */
export const EITHER_VALID = [["valid", "invalid"]] as const

/** What a placed popup's positioner says of its anchor. */
export const ANCHOR_HIDDEN = state(
  "data-anchor-hidden",
  "Present while the anchor is out of view: scrolled away, or clipped by a box around it."
)

/** The size of a popup whose content changes while it is open, written on its positioner. */
export const POSITIONER_SIZE = {
  "--positioner-width":
    "The popup's width, as its content lays it out: a design gives the positioner `width: var(--positioner-width)` to animate a change of size.",
  "--positioner-height":
    "The popup's height, as its content lays it out: a design gives the positioner `height: var(--positioner-height)` to animate a change of size.",
}

/** A trigger that stays pressed while what it opened is open, as Base UI's do. */
export const PRESSED = state(
  "data-pressed",
  "Present while its popup is open: it stays pressed, as a button held down."
)

import type { StateDefinition } from "./part.ts"

/** A state an attribute marks by being present. */
export function state(attribute: string, description: string): StateDefinition {
  return { attribute, description }
}

/** A state an attribute carries as one of several values. */
export function valued(
  attribute: string,
  values: readonly string[],
  description: string
): StateDefinition {
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
    ["top", "right", "bottom", "left"],
    "The side of the anchor it is on, after any flip."
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

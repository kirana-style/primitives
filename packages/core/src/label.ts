import type { Field } from "./field.ts"
import type { Part } from "./part.ts"
import { computed } from "./reactivity.ts"

export interface Label {
  /** A `<label>`. */
  readonly label: Part
}

const NOTHING = () => {}
const CONTROLS = "button, input, select, textarea"

/** A second press on a name selects its text, which nobody meant: it presses the control again. */
function onMouseDown(event: MouseEvent) {
  if (event.defaultPrevented || event.detail < 2) return
  // A control drawn inside the label keeps its own double press (a word in a text input).
  if ((event.target as Element | null)?.closest?.(CONTROLS)) return
  event.preventDefault()
}

const ALONE: Part = { props: computed(() => ({ onMouseDown })), attach: () => NOTHING }

/**
 * A control's name. Pressed, it reaches its control as a `<label>` does (`for`, or the control
 * inside it); pressed twice, it does not select its own text. Inside a field it is the field's
 * label.
 */
export function createLabel(around: { field?: Field | undefined } = {}): Label {
  const { field } = around
  if (!field) return { label: ALONE }
  return {
    label: {
      props: computed(() => ({ ...field.label.props.get(), onMouseDown })),
      attach: (element) => field.label.attach(element),
    },
  }
}

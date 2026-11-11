import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export interface CheckedProps {
  /** Unique in the page, and the hidden input's id: a `<label for>` names it. */
  id: string
  checked?: boolean | undefined
  /** Read once. */
  defaultChecked?: boolean | undefined
  onCheckedChange?: ((checked: boolean, details: ChangeDetails) => void) | undefined
  disabled?: boolean | undefined
  /** Shown as it is, focusable, not changeable. */
  readOnly?: boolean | undefined
  required?: boolean | undefined
  /** With a name, the control is submitted with the form around it when it is checked. */
  name?: string | undefined
  /** What is submitted. Default `"on"`, as a native checkbox's. */
  value?: string | undefined
}

export interface Checked {
  readonly checked: ReadonlySignal<boolean>
  setChecked(checked: boolean, details: ChangeDetails): void
  readonly root: Part
  /** The native checkbox inside the root, hidden: it is what a form and a label know. */
  readonly input: Part
  /** The state attributes every part of the control carries. */
  state(): Record<string, "" | undefined>
}

/**
 * What a checkbox and a switch share: a box that is on or off, with a native checkbox inside it,
 * hidden. The native input is the one source of the change: a press on the box presses the input,
 * and so does a `<label>`, so a form, a label and the keyboard all take the same path.
 */
export function createChecked(
  props: ReadonlySignal<CheckedProps>,
  role: "checkbox" | "switch",
  /** A checkbox that is neither: shown as "mixed" until it is pressed. */
  mixed: () => boolean = () => false
): Checked {
  const checked = bindable({
    value: () => props.get().checked,
    defaultValue: props.peek().defaultChecked ?? false,
    onChange: (value, by) => props.peek().onCheckedChange?.(value, by),
  })
  const disabled = computed(() => Boolean(props.get().disabled))
  const readOnly = computed(() => Boolean(props.get().readOnly))
  let input: HTMLInputElement | undefined

  const state = () => ({
    "data-checked": flag(checked.get() && !mixed()),
    "data-unchecked": flag(!checked.get() && !mixed()),
    "data-disabled": flag(disabled.get()),
    "data-readonly": flag(readOnly.get()),
    "data-required": flag(props.get().required),
  })

  function setChecked(next: boolean, by: ChangeDetails) {
    if (disabled.peek() || readOnly.peek()) return
    checked.set(next, by)
  }

  function press(event: Event) {
    if (disabled.peek() || readOnly.peek()) return
    // Through the native input when it is in the page, so its `change` is the one path.
    if (input) input.click()
    else setChecked(!checked.peek(), details("press", event))
  }

  return {
    checked,
    setChecked,
    state,
    root: {
      props: computed(() => ({
        role,
        tabindex: disabled.get() ? "-1" : "0",
        "aria-checked": mixed() ? "mixed" : String(checked.get()),
        "aria-disabled": disabled.get() ? "true" : undefined,
        "aria-readonly": readOnly.get() ? "true" : undefined,
        "aria-required": props.get().required ? "true" : undefined,
        ...state(),
        onClick(event: Event) {
          // The input's own click, come up from inside: the press is already on its way.
          if (event.target === input) return
          // Else a `<label>` around the box would press the input a second time.
          event.preventDefault()
          press(event)
        },
        onKeyDown(event: KeyboardEvent) {
          if (event.key === " ") {
            event.preventDefault()
            press(event)
          } else if (event.key === "Enter") {
            // A checkbox is not a button: Enter submits nothing and toggles nothing.
            event.preventDefault()
          }
        },
      })),
      attach: () => () => {},
    },
    input: {
      props: computed(() => ({
        type: "checkbox",
        id: props.get().id,
        name: props.get().name,
        value: props.get().value,
        checked: flag(checked.get()),
        disabled: flag(disabled.get()),
        hidden: "",
        tabindex: "-1",
        "aria-hidden": "true",
        onChange(event: Event) {
          const element = event.currentTarget as HTMLInputElement
          if (readOnly.peek()) {
            element.checked = checked.peek()
            return
          }
          setChecked(element.checked, details("press", event))
          // A caller who kept the value keeps the input with it.
          element.checked = checked.peek()
        },
      })),
      attach(element) {
        input = element as HTMLInputElement
        return () => {
          if (input === element) input = undefined
        }
      },
    },
  }
}

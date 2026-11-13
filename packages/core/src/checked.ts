import { bindable } from "./bindable.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createFormControl } from "./services/form-control.ts"

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
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
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
  mixed: () => boolean = () => false,
  /** The field the control is in, if it is in one: its name, its label, its state. */
  field?: Field
): Checked {
  const checked = bindable({
    value: () => props.get().checked,
    defaultValue: props.peek().defaultChecked ?? false,
    onChange: (value, by) => props.peek().onCheckedChange?.(value, by),
  })
  const readOnly = computed(() => Boolean(props.get().readOnly))
  let input: HTMLInputElement | undefined
  let member: FieldMembership | undefined
  const submitted = (on: boolean) => (on ? (props.peek().value ?? "on") : "")
  // What a form's reset goes back to: the value the control began with.
  const initial = checked.peek()
  const inForm = createFormControl(
    (event) => {
      // As a native checkbox: disabled or read-only, it is reset all the same.
      const by = details("form-reset", event)
      checked.set(initial, by)
      // What was asked for, not what is read back: a caller who holds the value gives it back
      // in their framework's time.
      const next = by.canceled ? checked.peek() : initial
      // The browser resets the input next, to what its attribute says.
      if (input) input.defaultChecked = next
      member?.reset(submitted(next))
    },
    // A caller who holds the value and did not take the reset keeps the input with it.
    () => {
      if (input) input.checked = checked.peek()
    }
  )
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )

  const state = () => ({
    ...field?.state(),
    "data-checked": flag(checked.get() && !mixed()),
    "data-unchecked": flag(!checked.get() && !mixed()),
    "data-disabled": flag(disabled.get()),
    "data-readonly": flag(readOnly.get()),
    "data-required": flag(props.get().required),
  })

  function setChecked(next: boolean, by: ChangeDetails) {
    if (disabled.peek() || readOnly.peek()) return
    checked.set(next, by)
    if (!by.canceled) member?.changed(submitted(next))
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
        ...field?.aria(),
        ...state(),
        onFocus: () => member?.focused(true),
        onBlur: () => member?.focused(false),
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
      attach(element) {
        member = field?.join({
          element,
          focus: () => element.focus(),
          kind: "checkbox",
          // The field checks it: on the hidden input, a plain form could not show its message.
          required: () => Boolean(props.peek().required),
          value: submitted(checked.peek()),
        })
        return () => {
          member?.leave()
          member = undefined
        }
      },
    },
    input: {
      props: computed(() => ({
        type: "checkbox",
        // In a field, the id its label is `for`.
        id: field?.controlId ?? props.get().id,
        name: props.get().name ?? field?.name.get(),
        form: props.get().form,
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
        const leave = inForm.attach(element)
        // The input's live state is the control's to keep, whatever draws the element: a
        // framework writes it in its own time, or not at all once the page is drawn.
        const follow = effect(() => {
          ;(element as HTMLInputElement).checked = checked.get()
        })
        return () => {
          follow()
          leave()
          if (input === element) input = undefined
        }
      },
    },
  }
}

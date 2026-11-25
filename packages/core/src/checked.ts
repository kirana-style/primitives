import { bindable } from "./bindable.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createFormControl } from "./services/form-control.ts"
import { labelledBy } from "./services/labels.ts"

export interface CheckedProps {
  /**
   * Unique in the page, and the hidden input's id: a `<label for>` names it, and the control
   * takes that label as its own name (`aria-labelledby`) unless it was given one.
   */
  id: string
  /** Whether it is checked, when the caller holds it. */
  checked?: boolean | undefined
  /** Read once. */
  defaultChecked?: boolean | undefined
  /** Heard as it is about to be checked or unchecked: `details.cancel()` keeps it as it was. */
  onCheckedChange?: ((checked: boolean, details: ChangeDetails) => void) | undefined
  /** Disabled: it cannot be changed. */
  disabled?: boolean | undefined
  /** Shown as it is, focusable, not changeable. */
  readOnly?: boolean | undefined
  /** Needed: in a `Field`, leaving it unchecked is then invalid. */
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

/** What a box is given by the group it is one of the boxes of. Not for a caller. */
export interface CheckedAround {
  /** The group's own `disabled`, and its field's. */
  readonly disabled: ReadonlySignal<boolean>
  /** The name the box is submitted under when it has none of its own. */
  name(): string | undefined
  /** The state of the group's field, which the box carries. */
  state(): Record<string, "" | undefined>
  /** The id the box's element takes, when the group names its boxes. */
  id?(): string | undefined
  /** Whether the box is in what a form submits. */
  readonly submitted: boolean
  /** Where the group holds the box's state: absent for a box that holds its own. */
  readonly held?:
    | {
        checked(): boolean
        set(checked: boolean, details: ChangeDetails): void
        /** The group's form is being reset: whether the box is then checked. */
        reset(event: Event): boolean
      }
    | undefined
  /** The box's element is in the page. Returns the leave. */
  join?(disabled: ReadonlySignal<boolean>): () => void
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
  field?: Field,
  /** The group the control is one of the boxes of: the field is then the group's to join. */
  group?: CheckedAround
): Checked {
  const held = group?.held
  const own = bindable({
    value: () => props.get().checked,
    defaultValue: props.peek().defaultChecked ?? false,
    onChange: (value, by) => props.peek().onCheckedChange?.(value, by),
  })
  const checked: ReadonlySignal<boolean> = held ? computed(() => held.checked()) : own
  const readOnly = computed(() => Boolean(props.get().readOnly))
  let input: HTMLInputElement | undefined
  // The labels of the hidden input, which name the box: a label reaches the input, and focus
  // lands on the box. In a field the name is the field's to give.
  const named = signal<string | undefined>(undefined)
  let box: Element | undefined
  // Asked as each of the two comes into the page: which is first is its framework's business.
  const name = () => {
    if (input && box && !field) named.set(labelledBy(input, box, named.peek()))
  }
  let member: FieldMembership | undefined
  const submitted = (on: boolean) => (on ? (props.peek().value ?? "on") : "")
  // What a form's reset goes back to: the value the control began with.
  const initial = checked.peek()
  const inForm = createFormControl(
    (event) => {
      // As a native checkbox: disabled or read-only, it is reset all the same.
      // In a group the reset is the group's, heard once for all its boxes.
      if (held) {
        const next = held.reset(event)
        if (input) input.defaultChecked = next
        return
      }
      const by = details("form-reset", event)
      own.set(initial, by)
      // What was asked for, not what is read back: a caller who holds the value gives it back
      // in their framework's time.
      const next = by.canceled ? own.peek() : initial
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
    () =>
      Boolean(props.get().disabled) ||
      Boolean(field?.disabled.get()) ||
      Boolean(group?.disabled.get()) ||
      inForm.disabled.get()
  )

  const state = () => ({
    ...field?.state(),
    ...group?.state(),
    "data-checked": flag(checked.get() && !mixed()),
    "data-unchecked": flag(!checked.get() && !mixed()),
    "data-disabled": flag(disabled.get()),
    "data-readonly": flag(readOnly.get()),
    "data-required": flag(props.get().required),
  })

  function setChecked(next: boolean, by: ChangeDetails) {
    if (disabled.peek() || readOnly.peek()) return
    if (held) {
      // The box's own caller hears it first, and may refuse before the group is asked.
      props.peek().onCheckedChange?.(next, by)
      if (!by.canceled) held.set(next, by)
      return
    }
    own.set(next, by)
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
        id: group?.id?.(),
        tabindex: disabled.get() ? "-1" : "0",
        "aria-checked": mixed() ? "mixed" : String(checked.get()),
        "aria-disabled": disabled.get() ? "true" : undefined,
        "aria-readonly": readOnly.get() ? "true" : undefined,
        "aria-required": props.get().required ? "true" : undefined,
        "aria-labelledby": named.get(),
        ...field?.aria(),
        ...state(),
        onFocus() {
          // A label drawn since the box was: read as focus lands, which is when it is said.
          name()
          member?.focused(true)
        },
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
        box = element
        name()
        member = field?.join({
          element,
          focus: () => element.focus(),
          kind: "checkbox",
          // The field checks it: on the hidden input, a plain form could not show its message.
          required: () => Boolean(props.peek().required),
          value: submitted(checked.peek()),
        })
        const leave = group?.join?.(disabled)
        return () => {
          leave?.()
          member?.leave()
          member = undefined
          if (box === element) box = undefined
        }
      },
    },
    input: {
      props: computed(() => ({
        type: "checkbox",
        // In a field, the id its label is `for`.
        id: field?.controlId ?? props.get().id,
        name:
          group && !group.submitted
            ? undefined
            : (props.get().name ?? (group ? group.name() : field?.name.get())),
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
        name()
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

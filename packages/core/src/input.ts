import type { Field } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { onFormReset } from "./services/form-control.ts"

export interface InputProps {
  /** Disabled: nothing can be typed in it. */
  disabled?: boolean | undefined
  /** What was typed, as text, each time it changes. */
  onValueChange?: ((value: string, details: ChangeDetails) => void) | undefined
}

export interface Input {
  mount(): () => void
  /** An `<input>` or a `<textarea>`. */
  readonly input: Part
}

const NOTHING = () => {}

/**
 * A text input that says its state: focused, filled, touched, dirty, disabled. Inside a field
 * it is the field's control, and says the field's state. Its value is the element's own, held
 * the way the caller's framework holds an input's.
 */
export function createInput(
  props: ReadonlySignal<InputProps>,
  around: { field?: Field | undefined } = {}
): Input {
  const { field } = around
  const heard = (event: Event) =>
    props
      .peek()
      .onValueChange?.(
        (event.currentTarget as HTMLInputElement).value,
        details("input-change", event)
      )

  if (field) {
    return {
      mount: () => NOTHING,
      input: {
        props: computed(() => {
          const own = field.control.props.get()
          const off = Boolean(props.get().disabled) || field.disabled.get()
          return {
            ...own,
            disabled: flag(off),
            "data-disabled": flag(off),
            onInput(event: Event) {
              ;(own.onInput as (event: Event) => void)(event)
              heard(event)
            },
          }
        }),
        attach: (element) => field.control.attach(element),
      },
    }
  }

  const focused = signal(false)
  const touched = signal(false)
  const dirty = signal(false)
  const filled = signal(false)
  let initial = ""

  return {
    mount: () => NOTHING,
    input: {
      props: computed(() => {
        const off = Boolean(props.get().disabled)
        return {
          disabled: flag(off),
          "data-disabled": flag(off),
          "data-touched": flag(touched.get()),
          "data-dirty": flag(dirty.get()),
          "data-filled": flag(filled.get()),
          "data-focused": flag(focused.get()),
          onFocus: () => focused.set(true),
          onBlur: () =>
            batch(() => {
              focused.set(false)
              touched.set(true)
            }),
          onInput(event: Event) {
            const text = (event.currentTarget as HTMLInputElement).value
            batch(() => {
              dirty.set(text !== initial)
              filled.set(text !== "")
            })
            heard(event)
          },
        }
      }),
      attach(element) {
        const control = element as HTMLInputElement
        initial = control.value
        filled.set(initial !== "")
        // The browser puts the value back after the event: what it will be is its default.
        return onFormReset(element, () => {
          initial = control.defaultValue
          batch(() => {
            touched.set(false)
            dirty.set(false)
            filled.set(initial !== "")
          })
        })
      },
    },
  }
}

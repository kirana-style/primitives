import { createChecked } from "./checked.ts"
import type { CheckedProps } from "./checked.ts"
import type { Field } from "./field.ts"
import { flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createPresence } from "./services/presence.ts"

export interface CheckboxProps extends CheckedProps {
  /** Neither checked nor unchecked: a parent of boxes that disagree. */
  indeterminate?: boolean | undefined
}

export interface Checkbox {
  readonly checked: ReadonlySignal<boolean>
  /** Whether the indicator is in the page: while checked or indeterminate, and through its exit. */
  readonly indicatorMounted: ReadonlySignal<boolean>
  setChecked(checked: boolean, details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  readonly input: Part
  readonly indicator: Part
}

export function createCheckbox(
  props: ReadonlySignal<CheckboxProps>,
  around: { field?: Field | undefined } = {}
): Checkbox {
  const mixed = () => Boolean(props.get().indeterminate)
  const made = createChecked(props, "checkbox", mixed, around.field)
  const shown = computed(() => made.checked.get() || mixed())
  const presence = createPresence(shown)

  const state = () => ({ ...made.state(), "data-indeterminate": flag(mixed()) })

  return {
    checked: made.checked,
    indicatorMounted: presence.mounted,
    setChecked: made.setChecked,
    mount: () => presence.start(),
    root: {
      props: computed(() => ({ ...made.root.props.get(), ...state() })),
      attach: made.root.attach,
    },
    input: {
      props: made.input.props,
      attach(element) {
        const detach = made.input.attach(element)
        // The native state a script and `:indeterminate` read; no attribute sets it.
        const stop = effect(() => {
          ;(element as HTMLInputElement).indeterminate = mixed()
        })
        return () => {
          stop()
          detach()
        }
      },
    },
    indicator: {
      props: computed(() => {
        const status = presence.status.get()
        return {
          ...state(),
          "data-starting-style": flag(status === "starting"),
          "data-ending-style": flag(status === "ending"),
        }
      }),
      attach: (element) => presence.attach(element),
    },
  }
}

import { flag } from "./part.ts"
import type { Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export interface FieldsetProps {
  id: string
  /** Disables every field inside. */
  disabled?: boolean | undefined
}

export interface Fieldset {
  readonly disabled: ReadonlySignal<boolean>
  mount(): () => void
  readonly root: Part
  /** The group's name. */
  readonly legend: Part
}

const NOTHING = () => {}

/** A group of fields with a name of its own. */
export function createFieldset(props: ReadonlySignal<FieldsetProps>): Fieldset {
  const id = props.peek().id
  const disabled = computed(() => Boolean(props.get().disabled))
  const named = signal(false)
  return {
    disabled,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        // On a `<fieldset>`, the browser disables the native controls inside by itself.
        disabled: flag(disabled.get()),
        "aria-labelledby": named.get() ? `${id}-legend` : undefined,
        "data-disabled": flag(disabled.get()),
      })),
      attach: () => NOTHING,
    },
    legend: {
      props: computed(() => ({ id: `${id}-legend`, "data-disabled": flag(disabled.get()) })),
      attach() {
        named.set(true)
        return () => named.set(false)
      },
    },
  }
}

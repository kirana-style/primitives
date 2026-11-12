import { flag } from "./part.ts"
import type { Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export interface ButtonProps {
  disabled?: boolean | undefined
  /** Keeps a disabled button in the tab order, so what it would do can still be read. */
  focusableWhenDisabled?: boolean | undefined
  /** `false` when the element is not a `<button>`: it is given a button's role and keyboard. */
  nativeButton?: boolean | undefined
}

export interface Button {
  mount(): () => void
  readonly root: Part
}

const NOTHING = () => {}

/** A button: a `<button>` that is never a submit by accident, or another element made to act as one. */
export function createButton(props: ReadonlySignal<ButtonProps>): Button {
  return {
    mount: () => NOTHING,
    root: {
      props: computed(() => {
        const { disabled = false, focusableWhenDisabled = false, nativeButton = true } = props.get()
        // The part's handlers follow the caller's, so a disabled button a caller still listens
        // to must check for itself; the element's own `disabled` stops both.
        const block = (event: Event) => {
          if (disabled) event.preventDefault()
        }
        if (nativeButton) {
          return {
            type: "button",
            disabled: flag(disabled && !focusableWhenDisabled),
            "aria-disabled": disabled && focusableWhenDisabled ? "true" : undefined,
            "data-disabled": flag(disabled),
            onClick: block,
          }
        }
        return {
          role: "button",
          tabindex: disabled && !focusableWhenDisabled ? "-1" : "0",
          "aria-disabled": disabled ? "true" : undefined,
          "data-disabled": flag(disabled),
          onClick: block,
          onKeyDown(event: KeyboardEvent) {
            if (event.target !== event.currentTarget) return
            // Enter presses at once and Space on release, as a `<button>` does.
            if (event.key === " ") event.preventDefault()
            if (event.key === "Enter" && !disabled) (event.currentTarget as HTMLElement).click()
          },
          onKeyUp(event: KeyboardEvent) {
            if (event.target !== event.currentTarget) return
            if (event.key === " " && !disabled) (event.currentTarget as HTMLElement).click()
          },
        }
      }),
      attach: () => NOTHING,
    },
  }
}

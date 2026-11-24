import { flag, isLink } from "./part.ts"
import type { Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export interface ButtonProps {
  /** Disabled: a press does nothing. */
  disabled?: boolean | undefined
  /** Keeps a disabled button in the tab order, so what it would do can still be read. */
  focusableWhenDisabled?: boolean | undefined
  /**
   * `false` when the element is not a `<button>`: it is given a button's role, a place in the
   * tab order and its keys (Enter, Space). A link that navigates (an `<a>` or `<area>` with an
   * `href`) stays a link: no role is written over its own, it keeps its own place in the tab
   * order and its own Enter, and Space does not press it; disabled, it is still blocked.
   */
  nativeButton?: boolean | undefined
}

export interface Button {
  mount(): () => void
  readonly root: Part
}

const NOTHING = () => {}

const linked = (element: Element) => isLink(element.localName, element.getAttribute("href"))

/**
 * A button: a `<button>` that is never a submit by accident (`type="button"`, unless its caller
 * gives a `type` of its own: `"submit"` submits its form), or another element made to act as one.
 * A link that navigates is left a link: where its adapter knows the element before drawing it,
 * `forElement` leaves the role out; where it does not (a render function, a snippet), the part
 * learns it when it is attached; and its keys ask the element they are heard on.
 */
export function createButton(props: ReadonlySignal<ButtonProps>): Button {
  // Whether the element it is attached to is a link that navigates.
  const link = signal(false)
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
        const onLink = link.get()
        return {
          role: onLink ? undefined : "button",
          tabindex: disabled && !focusableWhenDisabled ? "-1" : onLink ? undefined : "0",
          "aria-disabled": disabled ? "true" : undefined,
          "data-disabled": flag(disabled),
          onClick: block,
          onKeyDown(event: KeyboardEvent) {
            const element = event.currentTarget as HTMLElement
            // A link's Enter is its own (pressing it here too would follow it twice), and a link
            // is not pressed by Space.
            if (event.target !== element || linked(element)) return
            // Enter presses at once and Space on release, as a `<button>` does.
            if (event.key === " ") event.preventDefault()
            if (event.key === "Enter" && !disabled) element.click()
          },
          onKeyUp(event: KeyboardEvent) {
            const element = event.currentTarget as HTMLElement
            if (event.target !== element || linked(element)) return
            if (event.key === " " && !disabled) element.click()
          },
        }
      }),
      attach(element) {
        link.set(linked(element))
        return NOTHING
      },
    },
  }
}

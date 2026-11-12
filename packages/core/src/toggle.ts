import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export interface ToggleProps {
  pressed?: boolean | undefined
  /** Read once. */
  defaultPressed?: boolean | undefined
  onPressedChange?: ((pressed: boolean, details: ChangeDetails) => void) | undefined
  disabled?: boolean | undefined
}

export interface Toggle {
  readonly pressed: ReadonlySignal<boolean>
  setPressed(pressed: boolean, details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
}

const NOTHING = () => {}

/** A button that stays pressed: bold in a toolbar, mute on a player. */
export function createToggle(props: ReadonlySignal<ToggleProps>): Toggle {
  const pressed = bindable({
    value: () => props.get().pressed,
    defaultValue: props.peek().defaultPressed ?? false,
    onChange: (value, by) => props.peek().onPressedChange?.(value, by),
  })
  const setPressed = (next: boolean, by: ChangeDetails) => {
    if (props.peek().disabled) return
    pressed.set(next, by)
  }
  return {
    pressed,
    setPressed,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        type: "button",
        "aria-pressed": String(pressed.get()),
        disabled: flag(props.get().disabled),
        "data-pressed": flag(pressed.get()),
        "data-disabled": flag(props.get().disabled),
        onClick: (event: Event) => setPressed(!pressed.peek(), details("press", event)),
      })),
      attach: () => NOTHING,
    },
  }
}

import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import type { TabStop } from "./services/roving.ts"

export interface ToggleProps {
  pressed?: boolean | undefined
  /** Read once. */
  defaultPressed?: boolean | undefined
  onPressedChange?: ((pressed: boolean, details: ChangeDetails) => void) | undefined
  disabled?: boolean | undefined
  /** In a toggle group: what the group's value holds while this one is pressed. */
  value?: unknown
}

export interface Toggle {
  readonly pressed: ReadonlySignal<boolean>
  setPressed(pressed: boolean, details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
}

/** What a toggle needs of the group it is in. Not for a caller. */
export interface ToggleGroupLink {
  readonly disabled: ReadonlySignal<boolean>
  readonly stop: TabStop
  has(value: unknown): boolean
  set(value: unknown, pressed: boolean, details: ChangeDetails): void
}

export interface ToggleAround {
  /** The group it is one of the toggles of: its state is then the group's. */
  group?: { readonly link: ToggleGroupLink } | undefined
  /** The toolbar it is an item of, when it is in no group. */
  toolbar?: { readonly stop: TabStop; readonly disabled: ReadonlySignal<boolean> } | undefined
}

const NOTHING = () => {}

/** A button that stays pressed: bold in a toolbar, mute on a player. */
export function createToggle(
  props: ReadonlySignal<ToggleProps>,
  around: ToggleAround = {}
): Toggle {
  const group = around.group?.link
  const stop = group?.stop ?? around.toolbar?.stop
  const own = bindable({
    value: () => props.get().pressed,
    defaultValue: props.peek().defaultPressed ?? false,
    onChange: (value, by) => props.peek().onPressedChange?.(value, by),
  })
  const pressed = group ? computed(() => group.has(props.get().value)) : own
  const disabled = computed(
    () =>
      Boolean(props.get().disabled) ||
      Boolean(group?.disabled.get()) ||
      Boolean(around.toolbar?.disabled.get())
  )
  const element = signal<HTMLElement | undefined>(undefined)
  const setPressed = (next: boolean, by: ChangeDetails) => {
    if (disabled.peek()) return
    if (group) {
      group.set(props.peek().value, next, by)
      // The toggle's own caller hears it too, once the group has not refused.
      if (!by.canceled) props.peek().onPressedChange?.(next, by)
    } else own.set(next, by)
  }
  return {
    pressed,
    setPressed,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        type: "button",
        "aria-pressed": String(pressed.get()),
        disabled: flag(disabled.get()),
        // One stop for Tab with the others of its group or toolbar.
        ...(stop ? { tabindex: stop.tabindex(element.get()) } : {}),
        "data-pressed": flag(pressed.get()),
        "data-disabled": flag(disabled.get()),
        onClick: (event: Event) => setPressed(!pressed.peek(), details("press", event)),
        ...(stop
          ? { onFocus: (event: FocusEvent) => stop.focused(event.currentTarget as HTMLElement) }
          : {}),
      })),
      attach(target) {
        if (!stop) return NOTHING
        element.set(target)
        const leave = stop.join(target)
        return () => {
          leave()
          element.set(undefined)
        }
      },
    },
  }
}

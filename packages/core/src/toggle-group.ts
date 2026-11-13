import { bindable } from "./bindable.ts"
import type { DirectionAround } from "./direction.ts"
import { flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createTabStop } from "./services/roving.ts"
import type { Orientation, TabStop } from "./services/roving.ts"
import type { ToggleGroupLink } from "./toggle.ts"

export interface ToggleGroupProps<Value = unknown> {
  /** The values of the pressed toggles: none, one, or with `multiple` several. */
  value?: readonly Value[] | undefined
  defaultValue?: readonly Value[] | undefined
  onValueChange?: ((value: Value[], details: ChangeDetails) => void) | undefined
  /** Whether more than one can be pressed at a time. */
  multiple?: boolean | undefined
  disabled?: boolean | undefined
  orientation?: Orientation | undefined
  /** Whether the arrows go round from the last toggle to the first. Default: they do. */
  loop?: boolean | undefined
}

export interface ToggleGroup<Value = unknown> {
  readonly value: ReadonlySignal<readonly Value[]>
  mount(): () => void
  readonly root: Part
  readonly link: ToggleGroupLink
}

const NOTHING = () => {}
const NONE: readonly never[] = []

/**
 * Toggles that are one control: one stop for Tab, the arrows move between them, and one or
 * several are pressed. In a toolbar (`around.toolbar`) the stop and the arrows are the toolbar's.
 */
export function createToggleGroup<Value = unknown>(
  props: ReadonlySignal<ToggleGroupProps<Value>>,
  around: DirectionAround & {
    toolbar?: { readonly stop: TabStop; readonly disabled: ReadonlySignal<boolean> } | undefined
  } = {}
): ToggleGroup<Value> {
  const value = bindable<readonly Value[]>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? NONE,
    onChange: (next, by) => props.peek().onValueChange?.([...next], by),
    equals: (a, b) => a.length === b.length && a.every((each, at) => Object.is(each, b[at])),
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(around.toolbar?.disabled.get())
  )
  const stop = around.toolbar?.stop ?? createTabStop()
  const orientation = computed(() => props.get().orientation ?? "horizontal")

  return {
    value,
    mount: () => NOTHING,
    link: {
      disabled,
      stop,
      has: (item) => value.get().some((each) => Object.is(each, item)),
      set(item, pressed, by) {
        const now = value.peek()
        const without = now.filter((each) => !Object.is(each, item))
        if (!pressed) return value.set(without, by)
        value.set(props.peek().multiple ? [...without, item as Value] : [item as Value], by)
      },
    },
    root: {
      props: computed(() => ({
        role: "group",
        "data-orientation": orientation.get(),
        "data-multiple": flag(props.get().multiple),
        "data-disabled": flag(disabled.get()),
        onKeyDown(event: KeyboardEvent) {
          // In a toolbar the arrows are the toolbar's, which hears the key next.
          if (around.toolbar) return
          stop.roving.move(event, {
            orientation: orientation.peek(),
            loop: props.peek().loop ?? true,
            direction: around.direction,
          })
        },
      })),
      attach: () => NOTHING,
    },
  }
}

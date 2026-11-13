import type { DirectionAround } from "./direction.ts"
import { flag } from "./part.ts"
import type { Part, PartProps } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createTabStop } from "./services/roving.ts"
import type { Orientation, TabStop } from "./services/roving.ts"

export interface ToolbarProps {
  orientation?: Orientation | undefined
  /** Whether the arrows go round from the last item to the first. Default: they do. */
  loop?: boolean | undefined
  disabled?: boolean | undefined
}

export interface ToolbarItemOptions {
  disabled?: boolean | undefined
}

export interface Toolbar {
  readonly stop: TabStop
  readonly disabled: ReadonlySignal<boolean>
  mount(): () => void
  readonly root: Part
  button(options?: () => ToolbarItemOptions): Part
  link(): Part
  /** A text input: the arrows are its own until the caret is at an end. */
  input(options?: () => ToolbarItemOptions): Part
  group(options?: () => ToolbarItemOptions): Part
  readonly separator: Part
}

const NOTHING = () => {}

/** Whether an arrow in a text input is still the text's: the caret is not at that end. */
function inText(event: KeyboardEvent): boolean {
  const target = event.target
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement))
    return false
  if (event.key === "Home" || event.key === "End") return true
  const { selectionStart, selectionEnd, value } = target
  // An input with no caret to read (a number, a date) keeps its arrows.
  if (selectionStart === null || selectionEnd === null) return true
  if (selectionStart !== selectionEnd) return true
  const back = event.key === "ArrowLeft" || event.key === "ArrowUp"
  return back ? selectionStart > 0 : selectionStart < value.length
}

/**
 * A row of controls that is one stop for Tab: the arrows move between its buttons, links,
 * inputs and toggles.
 */
export function createToolbar(
  props: ReadonlySignal<ToolbarProps>,
  around: DirectionAround = {}
): Toolbar {
  const stop = createTabStop()
  const disabled = computed(() => Boolean(props.get().disabled))
  const orientation = computed(() => props.get().orientation ?? "horizontal")

  /** An item: a stop of the toolbar's own. */
  function item(extra: (off: boolean) => PartProps, options: () => ToolbarItemOptions): Part {
    const element = signal<HTMLElement | undefined>(undefined)
    return {
      props: computed(() => {
        const off = Boolean(options().disabled) || disabled.get()
        return {
          ...extra(off),
          tabindex: stop.tabindex(element.get()),
          "data-orientation": orientation.get(),
          "data-disabled": flag(off),
          onFocus: (event: FocusEvent) => stop.focused(event.currentTarget as HTMLElement),
        }
      }),
      attach(target) {
        element.set(target)
        const leave = stop.join(target)
        return () => {
          leave()
          element.set(undefined)
        }
      },
    }
  }

  return {
    stop,
    disabled,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        role: "toolbar",
        "aria-orientation": orientation.get(),
        "data-orientation": orientation.get(),
        "data-disabled": flag(disabled.get()),
        onKeyDown(event: KeyboardEvent) {
          if (inText(event)) return
          stop.roving.move(event, {
            orientation: orientation.peek(),
            loop: props.peek().loop ?? true,
            direction: around.direction,
          })
        },
      })),
      attach: () => NOTHING,
    },
    button: (options = () => ({})) =>
      item((off) => ({ type: "button", disabled: flag(off) }), options),
    link: () =>
      item(
        () => ({}),
        () => ({})
      ),
    input: (options = () => ({})) => item((off) => ({ disabled: flag(off) }), options),
    group: (options = () => ({})) => ({
      props: computed(() => ({
        role: "group",
        "data-orientation": orientation.get(),
        "data-disabled": flag(Boolean(options().disabled) || disabled.get()),
      })),
      attach: () => NOTHING,
    }),
    separator: {
      props: computed(() => {
        // Across the toolbar: a row's separator stands.
        const across = orientation.get() === "horizontal" ? "vertical" : "horizontal"
        return { role: "separator", "aria-orientation": across, "data-orientation": across }
      }),
      attach: () => NOTHING,
    },
  }
}

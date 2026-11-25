import type { DirectionAround } from "./direction.ts"
import { flag } from "./part.ts"
import type { Part, PartProps } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createTabStop } from "./services/roving.ts"
import type { Orientation, TabStop } from "./services/roving.ts"

export interface ToolbarProps {
  /**
   * Whether the controls are laid out across (the default) or down: the arrows that move between
   * them follow.
   */
  orientation?: Orientation | undefined
  /** Whether the arrows go round from the last item to the first. Default: they do. */
  loopFocus?: boolean | undefined
  /**
   * Whether the arrows wrap from the last item to the first.
   * @deprecated Use `loopFocus`, which wins when both are given.
   */
  loop?: boolean | undefined
  /** Disables every control of the toolbar. */
  disabled?: boolean | undefined
}

export interface ToolbarItemOptions {
  /** Disables this control. */
  disabled?: boolean | undefined
  /**
   * Keeps this control focusable while disabled, as Base UI's: the arrows still reach it and it
   * still says what it is, but a press, a click and the keys (Tab apart) do nothing. Default
   * `true`. With `false`, a disabled control is the element's own `disabled`, and the arrows
   * pass it.
   */
  focusableWhenDisabled?: boolean | undefined
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
  // A disabled input that keeps focus takes no keys: the arrows are the toolbar's.
  if (target.getAttribute("aria-disabled") === "true") return false
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

  /**
   * An item: a stop of the toolbar's own. `extra` is given whether the element's own `disabled`
   * is to be written; `keeps` says whether the item can keep focus while disabled.
   */
  function item(
    extra: (blocked: boolean) => PartProps,
    options: () => ToolbarItemOptions,
    keeps = true
  ): Part {
    const element = signal<HTMLElement | undefined>(undefined)
    return {
      props: computed(() => {
        const off = Boolean(options().disabled) || disabled.get()
        const focusable = keeps && (options().focusableWhenDisabled ?? true)
        // Disabled, and still focusable: what the element's own `disabled` would stop is
        // stopped here, and the arrows reach it (`data-focusable` tells the roving set so).
        const held = off && focusable
        const block = (event: Event) => {
          if (held) event.preventDefault()
        }
        return {
          ...extra(off && !focusable),
          "aria-disabled": held ? "true" : undefined,
          tabindex: stop.tabindex(element.get()),
          "data-orientation": orientation.get(),
          "data-disabled": flag(off),
          "data-focusable": flag(focusable),
          onFocus: (event: FocusEvent) => stop.focused(event.currentTarget as HTMLElement),
          onClick: block,
          onPointerDown: block,
          onKeyDown(event: KeyboardEvent) {
            // Tab leaves it; no other key does what it would.
            if (held && event.key !== "Tab") event.preventDefault()
          },
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
            loop: props.peek().loopFocus ?? props.peek().loop ?? true,
            direction: around.direction,
          })
        },
      })),
      attach: () => NOTHING,
    },
    button: (options = () => ({})) =>
      item((blocked) => ({ type: "button", disabled: flag(blocked) }), options),
    link: () =>
      item(
        () => ({}),
        () => ({}),
        false
      ),
    input: (options = () => ({})) => item((blocked) => ({ disabled: flag(blocked) }), options),
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

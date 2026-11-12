import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { createHover } from "./services/hover.ts"
import { pushLayer } from "./services/layers.ts"
import { POSITION_DEFAULTS, createPosition, sameOptions } from "./services/position.ts"
import type { PositionOptions } from "./services/position.ts"
import { createPresence } from "./services/presence.ts"

export interface HoverPopupProps {
  id: string
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  /** How long the pointer rests on the trigger before the popup opens, in milliseconds. */
  delay?: number | undefined
  /** How long after the pointer leaves the popup closes, in milliseconds. */
  closeDelay?: number | undefined
  disabled?: boolean | undefined
}

export interface HoverPopup {
  readonly open: ReadonlySignal<boolean>
  readonly mounted: ReadonlySignal<boolean>
  setOpen(open: boolean, details: ChangeDetails): void
  /** Where the positioner goes; its part's adapter writes its own props here. */
  readonly positioning: Signal<Partial<PositionOptions>>
  mount(): () => void
  readonly trigger: Part
  readonly positioner: Part
  readonly popup: Part
  /** An element that points at the trigger, placed along the popup's edge. */
  readonly arrow: Part
}

const NOTHING = () => {}

/**
 * What a tooltip and a hover card share: a popup placed against its trigger that the pointer or
 * the keyboard's focus opens. They differ in what the popup is to the trigger (a description, or
 * a preview of where a link goes) and in how long they wait.
 */
export function createHoverPopup(
  props: ReadonlySignal<HoverPopupProps>,
  kind: { name: string; delay: number; closeDelay: number; describes: boolean }
): HoverPopup {
  const id = props.peek().id
  const popupId = `${id}-popup`
  const open = bindable({
    value: () => props.get().open,
    defaultValue: props.peek().defaultOpen ?? false,
    onChange: (value, by) => props.peek().onOpenChange?.(value, by),
  })
  const presence = createPresence(open)
  const positioning = signal<Partial<PositionOptions>>({})
  const position = createPosition(
    computed(() => ({ ...POSITION_DEFAULTS, side: "top", ...positioning.get() }), sameOptions)
  )
  let trigger: HTMLElement | undefined
  let popup: HTMLElement | undefined

  const setOpen = (next: boolean, by: ChangeDetails) => open.set(next, by)
  const hover = createHover({
    open,
    setOpen,
    options: () => ({
      delay: props.peek().delay ?? kind.delay,
      closeDelay: props.peek().closeDelay ?? kind.closeDelay,
      disabled: Boolean(props.peek().disabled),
    }),
    trigger: () => trigger,
    popup: () => popup,
  })

  const placed = () => ({
    "data-side": position.side.get(),
    "data-align": position.align.get(),
  })

  return {
    open,
    mounted: presence.mounted,
    setOpen,
    positioning,
    mount() {
      const stops = [presence.start(), hover.start()]
      return () => {
        for (const stop of stops) stop()
      }
    },
    trigger: {
      props: computed(() => ({
        // A tooltip is the trigger's description while it shows, and only then.
        "aria-describedby": kind.describes && presence.mounted.get() ? popupId : undefined,
        "data-popup-open": flag(open.get()),
        ...hover.handlers(),
      })),
      attach(element) {
        trigger = element
        return () => {
          if (trigger === element) trigger = undefined
        }
      },
    },
    positioner: {
      props: computed(() => ({
        role: "presentation",
        "data-open": flag(open.get()),
        "data-closed": flag(!open.get()),
        ...placed(),
      })),
      attach(element) {
        if (!trigger) return NOTHING
        return position.attach(element, trigger)
      },
    },
    popup: {
      props: computed(() => {
        const status = presence.status.get()
        return {
          id: popupId,
          role: kind.describes ? "tooltip" : undefined,
          "data-open": flag(open.get()),
          "data-closed": flag(!open.get()),
          "data-starting-style": flag(status === "starting"),
          "data-ending-style": flag(status === "ending"),
          "data-instant": hover.instant.get(),
          ...placed(),
        }
      }),
      attach(element) {
        popup = element
        const stops = [
          presence.attach(element),
          // For Escape only: a press outside is not this popup's business.
          pushLayer({
            element,
            kind: kind.name,
            branches: () => [trigger],
            onEscape: (event) => setOpen(false, details("escape-key", event)),
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          if (popup === element) popup = undefined
        }
      },
    },
    arrow: {
      props: computed(() => ({
        "aria-hidden": "true",
        ...placed(),
        "data-uncentered": flag(position.uncentered.get()),
      })),
      attach: (element) => position.arrow(element),
    },
  }
}

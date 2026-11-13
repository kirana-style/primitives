import { bindable } from "./bindable.ts"
import { flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { createHover } from "./services/hover.ts"
import { createPopup } from "./services/popup.ts"
import { createPlacement } from "./services/position.ts"
import type { PositionOptions } from "./services/position.ts"

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
  let element: HTMLElement | undefined

  const setOpen = (next: boolean, by: ChangeDetails) => open.set(next, by)
  const placement = createPlacement({ side: "top" })
  const popup = createPopup({
    open,
    setOpen,
    kind: kind.name,
    // Escape only: a press outside is not this popup's business, and focus stays where it is.
    outsidePress: () => false,
    placement,
  })
  const hover = createHover({
    open,
    setOpen,
    options: () => ({
      delay: props.peek().delay ?? kind.delay,
      closeDelay: props.peek().closeDelay ?? kind.closeDelay,
      disabled: Boolean(props.peek().disabled),
    }),
    trigger: popup.trigger,
    popup: () => element,
  })

  return {
    open,
    mounted: popup.mounted,
    setOpen,
    positioning: placement.positioning,
    mount() {
      const stops = [popup.start(), hover.start()]
      return () => {
        for (const stop of stops) stop()
      }
    },
    trigger: {
      props: computed(() => ({
        // A tooltip is the trigger's description while it shows, and only then.
        "aria-describedby": kind.describes && popup.mounted.get() ? popupId : undefined,
        "data-popup-open": flag(open.get()),
        ...hover.handlers(),
      })),
      attach: (given) => popup.attachTrigger(given),
    },
    positioner: popup.positioner,
    popup: {
      props: computed(() => ({
        id: popupId,
        role: kind.describes ? "tooltip" : undefined,
        ...popup.state(),
        "data-instant": hover.instant.get(),
        ...popup.placed(),
      })),
      attach(given) {
        element = given
        const detach = popup.attach(given)
        return () => {
          detach()
          if (element === given) element = undefined
        }
      },
    },
    arrow: popup.arrow,
  }
}

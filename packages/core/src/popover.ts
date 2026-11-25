import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { clearGeometry, setGeometry } from "./services/geometry.ts"
import { createHover } from "./services/hover.ts"
import { lockPage, popupFocus } from "./services/popup-focus.ts"
import { popupSize } from "./services/popup-size.ts"
import { createPopup, instantOf } from "./services/popup.ts"
import type { Instant } from "./services/popup.ts"
import { createPlacement } from "./services/position.ts"
import type { PositionOptions } from "./services/position.ts"

export interface PopoverProps {
  id: string
  /** Whether it is open, when the caller holds it. */
  open?: boolean | undefined
  /** Whether it starts open, when the caller does not hold `open`. Read once. */
  defaultOpen?: boolean | undefined
  /** Heard as it is about to open or close: `details.cancel()` keeps it as it was. */
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  /**
   * What the page behind it may do while it is open. `false` (the default): everything.
   * `true`: nothing, the page is inert and does not scroll, and Tab stays inside the popover.
   * `"trap-focus"`: Tab stays inside the popover, and the page can still be pressed and
   * scrolled. A popover the pointer opened holds nothing until it is pressed. Read as it opens.
   */
  modal?: boolean | "trap-focus" | undefined
}

/** What a popover's trigger takes of its own. */
export interface PopoverTriggerOptions {
  /**
   * Whether the pointer resting on the trigger opens the popover too. A press and the keyboard
   * still open it, and a press on one the pointer opened keeps it open. Default `false`.
   */
  openOnHover?: boolean | undefined
  /** How long the pointer rests on the trigger before the popover opens, in milliseconds. Default 300. */
  delay?: number | undefined
  /** How long after the pointer leaves a popover it opened closes, in milliseconds. Default 0. */
  closeDelay?: number | undefined
}

export interface Popover {
  readonly open: ReadonlySignal<boolean>
  readonly mounted: ReadonlySignal<boolean>
  setOpen(open: boolean, details: ChangeDetails): void
  /** Where the positioner goes; its part's adapter writes its own props here. */
  readonly positioning: Signal<Partial<PositionOptions>>
  /** The trigger's own options; its part's adapter writes them here. Read as the pointer comes. */
  readonly hovering: Signal<PopoverTriggerOptions>
  mount(): () => void
  readonly trigger: Part
  /** A layer over the page behind the popover. */
  readonly backdrop: Part
  readonly positioner: Part
  readonly popup: Part
  readonly title: Part
  readonly description: Part
  readonly close: Part
  /** An element that points at the trigger, placed along the popup's edge. */
  readonly arrow: Part
}

const NOTHING = () => {}
// A press this soon after the pointer opened it was on its way already: it keeps the popover.
const PATIENT = 500

export function createPopover(props: ReadonlySignal<PopoverProps>): Popover {
  const id = props.peek().id
  const popupId = `${id}-popup`
  const open = bindable({
    value: () => props.get().open,
    defaultValue: props.peek().defaultOpen ?? false,
    onChange: (value, by) => props.peek().onOpenChange?.(value, by),
  })
  const titled = signal(false)
  const described = signal(false)

  // Why its motion should be skipped, and whether a press on the trigger opened it: each said
  // by the last change that went through.
  const instant = signal<Instant | undefined>(undefined)
  const pressed = signal(false)
  const setOpen = (next: boolean, by: ChangeDetails) => {
    open.set(next, by)
    if (by.canceled) return
    batch(() => {
      instant.set(instantOf(next, by))
      pressed.set(next && by.reason === "trigger-press")
    })
  }
  const placement = createPlacement()
  const hovering = signal<PopoverTriggerOptions>({})
  // Open because the pointer rested on the trigger, and not pressed since: focus stays where
  // it is and the page is not held, as for a hover card.
  const hovered = signal(false)
  let hoveredAt = -Infinity
  let element: HTMLElement | undefined
  const focus = popupFocus(undefined, () => props.peek().modal === "trap-focus")
  const popup = createPopup({
    open,
    setOpen,
    kind: "popover",
    placement,
    mode: hovered,
    modal: () => props.peek().modal === true && !hovered.peek(),
    focus: (given, context) => (hovered.peek() ? NOTHING : focus(given, context)),
    hold: lockPage,
    size: popupSize(true),
  })
  const hover = createHover({
    // Only one the pointer opened is the pointer's to close.
    open: computed(() => open.get() && hovered.get()),
    setOpen(next, by) {
      if (!next) return setOpen(false, by)
      // Open already, by a press: the pointer changes nothing.
      if (open.peek()) return
      batch(() => {
        hovered.set(true)
        setOpen(true, by)
      })
      if (by.canceled) hovered.set(false)
      else hoveredAt = performance.now()
    },
    options: () => ({
      delay: hovering.peek().delay ?? 300,
      closeDelay: hovering.peek().closeDelay ?? 0,
      disabled: !hovering.peek().openOnHover,
    }),
    trigger: popup.trigger,
    popup: () => element,
  })
  // The pointer's two only: a popover does not open for the keyboard's focus, and a press
  // has its own rule.
  const { onPointerEnter, onPointerLeave } = hover.handlers()

  return {
    open,
    mounted: popup.mounted,
    setOpen,
    positioning: placement.positioning,
    hovering,
    mount() {
      const stops = [
        popup.start(),
        hover.start(),
        // Once it has left the page it is nobody's: the next opening says how it opened.
        effect(() => {
          if (!popup.mounted.get()) hovered.set(false)
        }),
        // Open by a press, kept by one, or closed some other way: no longer the pointer's.
        effect(() => {
          if (!(open.get() && hovered.get())) hover.forget()
        }),
      ]
      return () => {
        for (const stop of stops) stop()
      }
    },
    trigger: {
      props: computed(() => ({
        type: "button",
        "aria-haspopup": "dialog",
        ...popup.expanded(popupId),
        "data-pressed": flag(open.get() && pressed.get()),
        // Always there, and deaf unless the trigger asks (`openOnHover`): what it asks is
        // read when the pointer comes, so writing it draws nothing again.
        onPointerEnter,
        onPointerLeave,
        onClick(event: Event) {
          if (open.peek() && hovered.peek()) {
            // Pressed just as the pointer opened it: the press meant to open it, and now has.
            // It is a pressed popover from here on. Later, a press closes it like any other.
            if (performance.now() - hoveredAt < PATIENT) return hovered.set(false)
            return setOpen(false, details("trigger-press", event))
          }
          hovered.set(false)
          setOpen(!open.peek(), details("trigger-press", event))
        },
      })),
      attach: (given) => popup.attachTrigger(given),
    },
    backdrop: {
      props: computed(() => ({ role: "presentation", ...popup.state() })),
      attach(given) {
        const stops = [
          popup.attachBackdrop(given),
          // Under a popover the pointer opened, the page is still the pointer's: the trigger
          // is under the backdrop, and must hear the pointer leave and a press.
          effect(() => {
            if (hovered.get()) setGeometry(given, "pointer-events", "none")
            else clearGeometry(given, "pointer-events")
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
        }
      },
    },
    positioner: popup.positioner,
    popup: {
      props: computed(() => ({
        id: popupId,
        role: "dialog",
        tabindex: "-1",
        "aria-labelledby": titled.get() ? `${id}-title` : undefined,
        "aria-describedby": described.get() ? `${id}-description` : undefined,
        ...popup.state(),
        ...popup.placed(),
        "data-instant": instant.get(),
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
    title: {
      props: computed(() => ({ id: `${id}-title` })),
      attach() {
        titled.set(true)
        return () => titled.set(false)
      },
    },
    description: {
      props: computed(() => ({ id: `${id}-description` })),
      attach() {
        described.set(true)
        return () => described.set(false)
      },
    },
    close: {
      props: computed(() => ({
        type: "button",
        onClick: (event: Event) => setOpen(false, details("close-press", event)),
      })),
      attach: () => NOTHING,
    },
    arrow: popup.arrow,
  }
}

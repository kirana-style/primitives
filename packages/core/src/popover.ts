import { bindable } from "./bindable.ts"
import { details } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { popupFocus } from "./services/popup-focus.ts"
import { createPopup } from "./services/popup.ts"
import { createPlacement } from "./services/position.ts"
import type { PositionOptions } from "./services/position.ts"

export interface PopoverProps {
  id: string
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
}

export interface Popover {
  readonly open: ReadonlySignal<boolean>
  readonly mounted: ReadonlySignal<boolean>
  setOpen(open: boolean, details: ChangeDetails): void
  /** Where the positioner goes; its part's adapter writes its own props here. */
  readonly positioning: Signal<Partial<PositionOptions>>
  mount(): () => void
  readonly trigger: Part
  readonly positioner: Part
  readonly popup: Part
  readonly title: Part
  readonly description: Part
  readonly close: Part
}

const NOTHING = () => {}

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

  const setOpen = (next: boolean, by: ChangeDetails) => open.set(next, by)
  const placement = createPlacement()
  const popup = createPopup({ open, setOpen, kind: "popover", placement, focus: popupFocus() })

  return {
    open,
    mounted: popup.mounted,
    setOpen,
    positioning: placement.positioning,
    mount: () => popup.start(),
    trigger: {
      props: computed(() => ({
        type: "button",
        "aria-haspopup": "dialog",
        ...popup.expanded(popupId),
        onClick: (event: Event) => setOpen(!open.peek(), details("trigger-press", event)),
      })),
      attach: (element) => popup.attachTrigger(element),
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
      })),
      attach: (element) => popup.attach(element),
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
  }
}

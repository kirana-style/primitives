import { bindable } from "./bindable.ts"
import { defineComponent, details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { focusScope } from "./services/focus.ts"
import { pushLayer } from "./services/layers.ts"
import { POSITION_DEFAULTS, createPosition, sameOptions } from "./services/position.ts"
import type { PositionOptions } from "./services/position.ts"
import { createPresence } from "./services/presence.ts"

export interface PopoverProps {
  id: string
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
}

const SIDE = { attribute: "data-side", values: ["top", "right", "bottom", "left"] } as const
const ALIGN = { attribute: "data-align", values: ["start", "center", "end"] } as const

export const popoverVocabulary = defineComponent({
  trigger: { states: { popupOpen: "data-popup-open" } },
  positioner: {
    states: { open: "data-open", closed: "data-closed", side: SIDE, align: ALIGN },
    exclusive: [["open", "closed"]],
    variables: [
      "--anchor-width",
      "--anchor-height",
      "--available-width",
      "--available-height",
      "--transform-origin",
    ],
  },
  popup: {
    states: {
      open: "data-open",
      closed: "data-closed",
      startingStyle: "data-starting-style",
      endingStyle: "data-ending-style",
      side: SIDE,
      align: ALIGN,
    },
    exclusive: [["open", "closed"]],
  },
  title: {},
  description: {},
  close: {},
})

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
  const presence = createPresence(open)
  const positioning = signal<Partial<PositionOptions>>({})
  const position = createPosition(
    computed(() => ({ ...POSITION_DEFAULTS, ...positioning.get() }), sameOptions)
  )
  const titled = signal(false)
  const described = signal(false)
  let trigger: HTMLElement | undefined

  const setOpen = (next: boolean, by: ChangeDetails) => open.set(next, by)

  return {
    open,
    mounted: presence.mounted,
    setOpen,
    positioning,
    mount: () => presence.start(),
    trigger: {
      props: computed(() => ({
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": String(open.get()),
        "aria-controls": presence.mounted.get() ? popupId : undefined,
        "data-popup-open": flag(open.get()),
        onClick: (event: Event) => setOpen(!open.peek(), details("trigger-press", event)),
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
        "data-side": position.side.get(),
        "data-align": position.align.get(),
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
          role: "dialog",
          tabindex: "-1",
          "aria-labelledby": titled.get() ? `${id}-title` : undefined,
          "aria-describedby": described.get() ? `${id}-description` : undefined,
          "data-open": flag(open.get()),
          "data-closed": flag(!open.get()),
          "data-starting-style": flag(status === "starting"),
          "data-ending-style": flag(status === "ending"),
          "data-side": position.side.get(),
          "data-align": position.align.get(),
        }
      }),
      attach(element) {
        const stops = [
          presence.attach(element),
          pushLayer({
            element,
            kind: "popover",
            branches: () => [trigger],
            onEscape: (event) => setOpen(false, details("escape-key", event)),
            onOutsidePress: (event) => setOpen(false, details("outside-press", event)),
          }),
          focusScope(element, { restore: () => trigger }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
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
  }
}

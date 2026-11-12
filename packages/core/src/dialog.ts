import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { focusScope, isolate } from "./services/focus.ts"
import { setGeometry } from "./services/geometry.ts"
import { layersAbove, layersChanged, pushLayer } from "./services/layers.ts"
import { createPresence } from "./services/presence.ts"
import { lockScroll } from "./services/scroll-lock.ts"

export interface DialogProps {
  id: string
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  /** Blocks the page behind it and traps focus. Default `true`. */
  modal?: boolean | undefined
  /** Whether a press outside closes it. Default `true`. */
  dismissible?: boolean | undefined
}

export interface Dialog {
  readonly open: ReadonlySignal<boolean>
  readonly mounted: ReadonlySignal<boolean>
  setOpen(open: boolean, details: ChangeDetails): void
  mount(): () => void
  readonly trigger: Part
  readonly backdrop: Part
  readonly popup: Part
  readonly title: Part
  readonly description: Part
  readonly close: Part
}

const NOTHING = () => {}

export function createDialog(
  props: ReadonlySignal<DialogProps>,
  /** An alert dialog asks for an answer: a press outside does not dismiss it. */
  kind: { alert: boolean } = { alert: false }
): Dialog {
  const id = props.peek().id
  const popupId = `${id}-popup`
  const open = bindable({
    value: () => props.get().open,
    defaultValue: props.peek().defaultOpen ?? false,
    onChange: (value, by) => props.peek().onOpenChange?.(value, by),
  })
  const presence = createPresence(open)
  const modal = () => props.peek().modal ?? true

  // Which of the optional parts are in the page: the popup names them only then.
  const titled = signal(false)
  const described = signal(false)
  const nested = signal(0)
  let trigger: HTMLElement | undefined
  let backdrop: HTMLElement | undefined

  const setOpen = (next: boolean, by: ChangeDetails) => open.set(next, by)

  const transition = () => {
    const status = presence.status.get()
    return {
      "data-open": flag(open.get()),
      "data-closed": flag(!open.get()),
      "data-starting-style": flag(status === "starting"),
      "data-ending-style": flag(status === "ending"),
    }
  }

  return {
    open,
    mounted: presence.mounted,
    setOpen,
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
    backdrop: {
      props: computed(() => ({ role: "presentation", ...transition() })),
      attach(element) {
        backdrop = element
        return () => {
          if (backdrop === element) backdrop = undefined
        }
      },
    },
    popup: {
      props: computed(() => ({
        id: popupId,
        role: kind.alert ? "alertdialog" : "dialog",
        tabindex: "-1",
        "aria-modal": props.get().modal === false ? undefined : "true",
        "aria-labelledby": titled.get() ? `${id}-title` : undefined,
        "aria-describedby": described.get() ? `${id}-description` : undefined,
        ...transition(),
        "data-nested-dialog-open": flag(nested.get() > 0),
      })),
      attach(element) {
        const stops: (() => void)[] = [presence.attach(element)]
        stops.push(
          pushLayer({
            element,
            // An alert dialog stacks with the others.
            kind: "dialog",
            branches: () => [trigger],
            modal: modal(),
            onEscape: (event) => setOpen(false, details("escape-key", event)),
            onOutsidePress(event) {
              if (kind.alert || props.peek().dismissible === false) return
              setOpen(false, details("outside-press", event))
            },
          })
        )
        // How many dialogs are open above this one, for a design that stacks them.
        stops.push(
          effect(() => {
            layersChanged.get()
            const above = layersAbove(element, "dialog")
            nested.set(above)
            setGeometry(element, "--nested-dialogs", String(above))
          })
        )
        // Undone in reverse: the page is no longer inert when focus goes back to the trigger.
        stops.push(focusScope(element, { trap: modal(), restore: () => trigger }))
        if (modal()) {
          stops.push(lockScroll(element.ownerDocument))
          stops.push(isolate(element, () => [backdrop]))
        }
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

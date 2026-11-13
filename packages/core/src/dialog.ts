import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { setGeometry } from "./services/geometry.ts"
import { layersAbove, layersChanged } from "./services/layers.ts"
import { lockPage, popupFocus } from "./services/popup-focus.ts"
import { createPopup } from "./services/popup.ts"

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
  // Which of the optional parts are in the page: the popup names them only then.
  const titled = signal(false)
  const described = signal(false)
  const nested = signal(0)

  const setOpen = (next: boolean, by: ChangeDetails) => open.set(next, by)
  const popup = createPopup({
    open,
    setOpen,
    // An alert dialog stacks with the others.
    kind: "dialog",
    modal: () => props.peek().modal ?? true,
    // An alert dialog asks for an answer.
    outsidePress: () => !kind.alert && props.peek().dismissible !== false,
    focus: popupFocus(),
    hold: lockPage,
  })

  return {
    open,
    mounted: popup.mounted,
    setOpen,
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
    backdrop: {
      props: computed(() => ({ role: "presentation", ...popup.state() })),
      attach: (element) => popup.attachBackdrop(element),
    },
    popup: {
      props: computed(() => ({
        id: popupId,
        role: kind.alert ? "alertdialog" : "dialog",
        tabindex: "-1",
        "aria-modal": props.get().modal === false ? undefined : "true",
        "aria-labelledby": titled.get() ? `${id}-title` : undefined,
        "aria-describedby": described.get() ? `${id}-description` : undefined,
        ...popup.state(),
        "data-nested-dialog-open": flag(nested.get() > 0),
      })),
      attach(element) {
        const stops = [
          popup.attach(element),
          // How many dialogs are open above this one, for a design that stacks them.
          effect(() => {
            layersChanged.get()
            const above = layersAbove(element, "dialog")
            nested.set(above)
            setGeometry(element, "--nested-dialogs", String(above))
          }),
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

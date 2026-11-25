import { bindable } from "./bindable.ts"
import { carryDirection } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { setGeometry } from "./services/geometry.ts"
import { layersAbove, layersBelow, layersChanged } from "./services/layers.ts"
import { lockPage, popupFocus } from "./services/popup-focus.ts"
import { createPopup } from "./services/popup.ts"

export interface DialogProps {
  id: string
  /** Whether it is open, when the caller holds it. */
  open?: boolean | undefined
  /** Whether it starts open, when the caller does not hold `open`. Read once. */
  defaultOpen?: boolean | undefined
  /** Heard as it is about to open or close: `details.cancel()` keeps it as it was. */
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  /** Blocks the page behind it and traps focus. Default `true`. */
  modal?: boolean | undefined
  /**
   * Keeps it open when the pointer presses outside it. Default `false`. Escape always closes
   * it: a caller who must keep it open cancels the change whose `details.reason` is
   * `"escape-key"`.
   */
  disablePointerDismissal?: boolean | undefined
  /**
   * Whether a press outside closes it. Default `true`.
   * @deprecated Base UI's name is `disablePointerDismissal`, the other way round, which wins
   * when both are given.
   */
  closeOnOutsidePress?: boolean | undefined
  /**
   * Whether a press outside closes it. Default `true`.
   * @deprecated Base UI's name is `disablePointerDismissal`, the other way round, which wins
   * over this and over `closeOnOutsidePress`.
   */
  dismissible?: boolean | undefined
}

/** What a dialog's trigger, or one of its close buttons, takes of its own. */
export interface DialogButtonOptions {
  /** It cannot be pressed: the button is disabled, and says so (`data-disabled`). */
  disabled?: boolean | undefined
}

export interface Dialog {
  readonly open: ReadonlySignal<boolean>
  readonly mounted: ReadonlySignal<boolean>
  setOpen(open: boolean, details: ChangeDetails): void
  mount(): () => void
  readonly trigger: Part
  /** A trigger with options of its own: `trigger` is this with none. */
  triggerPart(options: () => DialogButtonOptions): Part
  /** A close button with options of its own: `close` is this with none. */
  closePart(options: () => DialogButtonOptions): Part
  readonly backdrop: Part
  /**
   * What a long dialog scrolls in: an element between the backdrop and the popup, which may be
   * left out. A press on it beside the popup is a press outside; one on its scrollbar is not.
   */
  readonly viewport: Part
  readonly popup: Part
  readonly title: Part
  readonly description: Part
  readonly close: Part
}

const NOTHING = () => {}

/** Whether a press is on the scrollbar of the element it landed on: it scrolls, and closes nothing. */
function onScrollbar(event: PointerEvent, element: HTMLElement): boolean {
  // A finger meets no scrollbar.
  if (event.pointerType === "touch") return false
  const box = element.getBoundingClientRect()
  // Inside its borders and its scrollbars, wherever the browser draws them.
  const x = event.clientX - box.left - element.clientLeft
  const y = event.clientY - box.top - element.clientTop
  return (
    (element.scrollHeight > element.clientHeight && (x < 0 || x >= element.clientWidth)) ||
    (element.scrollWidth > element.clientWidth && (y < 0 || y >= element.clientHeight))
  )
}

export function createDialog(
  props: ReadonlySignal<DialogProps>,
  around: DirectionAround = {},
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
  // Whether it opened over another dialog: kept through its exit, when it has left the stack.
  const over = signal(false)
  const viewport = signal<HTMLElement | undefined>(undefined)

  const setOpen = (next: boolean, by: ChangeDetails) => open.set(next, by)
  const popup = createPopup({
    open,
    setOpen,
    // An alert dialog stacks with the others.
    kind: "dialog",
    modal: () => props.peek().modal ?? true,
    // An alert dialog asks for an answer.
    outsidePress(event) {
      const given = props.peek()
      // Base UI's name first, then the two older ones, which say the opposite.
      const kept =
        given.disablePointerDismissal ?? (given.closeOnOutsidePress ?? given.dismissible) === false
      if (kind.alert || kept) return false
      const within = viewport.peek()
      // Its viewport's own scrollbar scrolls the dialog.
      return !(within && event.target === within && onScrollbar(event, within))
    },
    focus: popupFocus(),
    hold: lockPage,
  })

  const triggerPart = (options: () => DialogButtonOptions): Part => ({
    props: computed(() => {
      const off = Boolean(options().disabled)
      return {
        type: "button",
        "aria-haspopup": "dialog",
        ...popup.expanded(popupId),
        disabled: flag(off),
        "data-disabled": flag(off),
        onClick(event: Event) {
          if (!off) setOpen(!open.peek(), details("trigger-press", event))
        },
      }
    }),
    attach: (element) => popup.attachTrigger(element),
  })
  const closePart = (options: () => DialogButtonOptions): Part => ({
    props: computed(() => {
      const off = Boolean(options().disabled)
      return {
        type: "button",
        disabled: flag(off),
        "data-disabled": flag(off),
        onClick(event: Event) {
          if (!off) setOpen(false, details("close-press", event))
        },
      }
    }),
    attach: () => NOTHING,
  })

  return {
    open,
    mounted: popup.mounted,
    setOpen,
    mount: () => popup.start(),
    trigger: triggerPart(() => ({})),
    triggerPart,
    closePart,
    backdrop: {
      props: computed(() => ({ role: "presentation", ...popup.state() })),
      attach: (element) => popup.attachBackdrop(element),
    },
    viewport: {
      props: computed(() => ({
        role: "presentation",
        ...popup.state(),
        "data-nested": flag(over.get()),
        "data-nested-dialog-open": flag(nested.get() > 0),
      })),
      attach(element) {
        viewport.set(element)
        return () => {
          if (viewport.peek() === element) viewport.set(undefined)
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
        ...popup.state(),
        "data-nested": flag(over.get()),
        "data-nested-dialog-open": flag(nested.get() > 0),
      })),
      attach(element) {
        const stops = [
          // On its way out the viewport lies over the page and takes no press, as the popup
          // takes none. Written here and before the popup follows `open`, not by a framework
          // in its own time: reopened, the popup takes focus at once, which nothing inside an
          // inert element can.
          effect(() => {
            const holder = viewport.get()
            const live = open.get()
            if (!holder) return
            if (live) holder.removeAttribute("inert")
            else holder.setAttribute("inert", "")
          }),
          popup.attach(element),
          // Moved to the end of `<body>`, it reads the way its provider states, which it may have
          // no trigger to take from. With no provider the page's own `dir` decides.
          around.direction
            ? effect(() => carryDirection(element, around.direction!.get()))
            : NOTHING,
          // How many dialogs are open above this one, for a design that stacks them.
          effect(() => {
            layersChanged.get()
            const above = layersAbove(element, "dialog")
            nested.set(above)
            setGeometry(element, "--nested-dialogs", String(above))
            const under = layersBelow(element, "dialog")
            if (under >= 0) over.set(under > 0)
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
    close: closePart(() => ({})),
  }
}

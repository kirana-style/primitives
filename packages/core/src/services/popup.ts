import type { Bindable } from "../bindable.ts"
import { details, flag } from "../part.ts"
import type { ChangeDetails, Part } from "../part.ts"
import { computed, effect, untracked } from "../reactivity.ts"
import type { ReadonlySignal } from "../reactivity.ts"
import { pushLayer } from "./layers.ts"
import type { PopupSize } from "./popup-size.ts"
import type { Anchor, PopupPlacement } from "./position.ts"
import { createPresence } from "./presence.ts"
import type { TransitionStatus } from "./presence.ts"

export interface PopupOptions {
  open: Bindable<boolean>
  /** How the popup closes itself: the controller's own `setOpen`, which may refuse. */
  setOpen(open: boolean, details: ChangeDetails): void
  /** What it is (`"dialog"`, `"popover"`, `"select"`, `"tooltip"`), for a part counting its own kind. */
  kind: string
  /** Blocks what is behind it: the page inert, its scroll locked, Tab kept inside. Read as it opens. */
  modal?: () => boolean
  /** Whether a press outside closes it. Default: it does. Asked at each press. */
  outsidePress?: (event: PointerEvent) => boolean
  /**
   * What focus does while the popup is open (`popupFocus` from `popup-focus.ts`): it moves in,
   * goes back as the popup closes, and a modal popup keeps it and blocks the page. Left out,
   * focus stays where it is (a tooltip). Given, not made here: a popup that leaves focus alone
   * does not carry the code.
   */
  focus?: PopupFocus
  /**
   * Holds the page without making it inert: a press outside closes the popup and reaches
   * nothing, and `hold` applies. For a menu, whose trigger must stay live. Read as it opens.
   */
  swallow?: () => boolean
  /** Elements that count as inside it beside its trigger: a second button that opens it. */
  branches?: () => readonly (Element | null | undefined)[]
  /** What a modal popup holds for as long as it is in the page, its exit included (`lockPage`). */
  hold?: (element: HTMLElement) => () => void
  /**
   * Placed against its trigger (`createPlacement`). Given, not made here: a popup that is not
   * placed, a dialog, does not carry the positioning code.
   */
  placement?: PopupPlacement
  /**
   * What it is placed against, when that is not its trigger: a point, for a context menu. Asked
   * each time the popup is placed; with nothing given back, the trigger. A positioner's own
   * `anchor` comes before both.
   */
  anchor?: () => Anchor | undefined
  /**
   * While its place is kept up with its trigger: while it is open, when left out. A popup that
   * places itself another way, once placed, says when.
   */
  following?: ReadonlySignal<boolean>
  /**
   * What it is open as, for a popup that can change while it is open (a popover the pointer
   * opened, once it is pressed). When it changes the popup lets go of what it holds and takes
   * hold again: `modal` and `focus` are asked once more, and so is `hold`.
   */
  mode?: ReadonlySignal<unknown>
  /**
   * Follows the open popup's size (`popupSize` from `popup-size.ts`): `--positioner-width` and
   * `--positioner-height` on its positioner, and the popup's own when asked. Given, not made
   * here: a popup whose size is not followed does not carry the code.
   */
  size?: PopupSize
}

/** What a popup's focus is told: whether the popup is modal, and its other elements. */
export interface PopupContext {
  readonly modal: boolean
  trigger(): HTMLElement | undefined
  backdrop(): HTMLElement | undefined
}

/** Takes focus for an open popup's element; returns how it is given back. */
export type PopupFocus = (element: HTMLElement, context: PopupContext) => () => void

export interface Popup {
  readonly open: ReadonlySignal<boolean>
  /** Whether the popup is in the page: while open, and through its exit. */
  readonly mounted: ReadonlySignal<boolean>
  readonly status: ReadonlySignal<TransitionStatus>
  /** Starts following `open`; a controller's `mount()` calls it. */
  start(): () => void
  /** The trigger, while it is in the page. */
  trigger(): HTMLElement | undefined
  /** For the trigger's `attach`: where the popup is placed, and where focus goes back. */
  attachTrigger(element: HTMLElement): () => void
  /** For a backdrop's `attach`: it is the popup's own, and stays live under a modal one. */
  attachBackdrop(element: HTMLElement): () => void
  /** For the popup's `attach`: its presence, its place in the stack, focus and modality. */
  attach(element: HTMLElement): () => void
  /** What a trigger says of its popup: whether it is open, and which element it is. */
  expanded(popupId: string): Record<string, string | undefined>
  /** Open or closed, and the first and last frames of the way between: for the popup and what moves with it. */
  state(): Record<string, "" | undefined>
  /** The side and alignment it was placed on, once it is. */
  placed(): Record<string, string | undefined>
  /** Whether its anchor is out of view, for a part that says so beside its positioner. */
  hidden(): Record<string, "" | undefined>
  /** The element that is placed against the trigger. */
  readonly positioner: Part
  /** An element that points at the trigger, placed along the popup's edge. */
  readonly arrow: Part
}

const NOTHING = () => {}

/** The reasons Base UI names for skipping a popup's motion that every popup can give. */
export type Instant = "click" | "dismiss"

/**
 * Why a popup's motion should be skipped after a change, as Base UI's `data-instant` says it:
 * `"click"` when the keyboard pressed its trigger or one of its items (a click with no pointer
 * behind it), `"dismiss"` when Escape closed it. Asked for each change that went through, open
 * or closed; nothing otherwise.
 */
export function instantOf(next: boolean, by: ChangeDetails): Instant | undefined {
  const event = by.event as MouseEvent | undefined
  const pressed = by.reason === "trigger-press" || by.reason === "item-press"
  if (pressed && event?.type === "click" && event.detail === 0) return "click"
  if (!next && by.reason === "escape-key") return "dismiss"
  return undefined
}

/**
 * What every popup does, once: it is in the page while open and through its exit; it takes its
 * place in the stack of open popups, where Escape closes the top one and a press outside closes
 * what it is outside of; focus moves in and goes back; a modal one blocks the page; and it is
 * placed against its trigger. A dialog, a popover, a tooltip, a select and a menu differ only in
 * the options they give.
 *
 * A popup is live only while it is open. As it starts to close it leaves the stack, gives focus
 * back and lets the page go, and is inert through its exit: a key or a press meant for what is
 * under it reaches that, not a popup on its way out.
 */
export function createPopup(options: PopupOptions): Popup {
  const { open, kind } = options
  const presence = createPresence(open)
  const position = options.placement?.position
  let trigger: HTMLElement | undefined
  let backdrop: HTMLElement | undefined
  let positioner: HTMLElement | undefined
  // The open popup's size, while its element is in the page and its size is followed.
  let sizer: ReturnType<PopupSize> | undefined

  const dismiss = (reason: string, event: Event) => options.setOpen(false, details(reason, event))

  /** Everything the popup holds while it is open. Returns the release, undone in reverse. */
  function engage(element: HTMLElement): () => void {
    const modal = options.modal?.() ?? false
    const undo: (() => void)[] = [
      pushLayer({
        element,
        kind,
        branches: () => [trigger, ...(options.branches?.() ?? [])],
        modal,
        ...(options.swallow ? { swallow: options.swallow } : {}),
        onEscape: (event) => dismiss("escape-key", event),
        onOutsidePress(event) {
          if (options.outsidePress?.(event) === false) return
          dismiss("outside-press", event)
        },
      }),
    ]
    if (options.focus) {
      undo.push(options.focus(element, { modal, trigger: () => trigger, backdrop: () => backdrop }))
    }
    return () => {
      for (const each of undo.reverse()) each()
    }
  }

  const placed = () => ({
    "data-side": position?.side.get(),
    "data-align": position?.align.get(),
  })
  const hidden = () => ({ "data-anchor-hidden": flag(position?.anchorHidden.get()) })

  return {
    open,
    mounted: presence.mounted,
    status: presence.status,
    start: () => presence.start(),
    trigger: () => trigger,
    attachTrigger(element) {
      trigger = element
      return () => {
        if (trigger === element) trigger = undefined
      }
    },
    attachBackdrop(element) {
      backdrop = element
      return () => {
        if (backdrop === element) backdrop = undefined
      }
    },
    attach(element) {
      let release: (() => void) | undefined
      let closing = false
      let was: unknown
      const stops = [
        presence.attach(element),
        effect(() => {
          const now = open.get()
          const as = options.mode?.get()
          untracked(() => {
            // Open as something else than it was engaged as: let go, to take hold again.
            if (now && release && as !== was) {
              release()
              release = undefined
            }
            was = as
            if (now && !release) {
              if (closing) element.removeAttribute("inert")
              closing = false
              release = engage(element)
              // Opened again: its first size is not a change from the last one it had.
              sizer?.reset()
            } else if (!now && release) {
              release()
              release = undefined
              // On its way out: nothing in it can be pressed or focused any more.
              closing = true
              element.setAttribute("inert", "")
            }
          })
        }),
      ]
      if (options.size) {
        const followed = options.size(
          element,
          () => positioner,
          () => open.peek()
        )
        sizer = followed
        stops.push(
          // Measured once it is open and placed: the place writes what its style may read (the
          // anchor's width, the room there is), in a microtask whichever part attached first.
          effect(() => {
            if (open.get() && (position?.placed.get() ?? true)) untracked(() => followed.measure())
          }),
          () => {
            followed.stop()
            if (sizer === followed) sizer = undefined
          }
        )
      }
      // The page's scroll is held until the popup has left, so nothing shifts under its exit.
      const hold = options.hold
      const mode = options.mode
      if (hold && (mode || options.modal?.() || options.swallow?.())) {
        let unlock: (() => void) | undefined
        stops.push(
          effect(() => {
            mode?.get()
            // One that changes while open is asked each time; another was asked as it attached.
            const held =
              presence.mounted.get() &&
              (!mode || untracked(() => Boolean(options.modal?.() || options.swallow?.())))
            if (held && !unlock) unlock = hold(element)
            else if (!held && unlock) {
              unlock()
              unlock = undefined
            }
          }),
          () => unlock?.()
        )
      }
      return () => {
        release?.()
        release = undefined
        for (const stop of stops.reverse()) stop()
      }
    },
    expanded: (popupId) => ({
      "aria-expanded": String(open.get()),
      "aria-controls": presence.mounted.get() ? popupId : undefined,
      "data-popup-open": flag(open.get()),
    }),
    state() {
      const status = presence.status.get()
      return {
        "data-open": flag(open.get()),
        "data-closed": flag(!open.get()),
        "data-starting-style": flag(status === "starting"),
        "data-ending-style": flag(status === "ending"),
      }
    },
    placed,
    hidden,
    positioner: {
      props: computed(() => ({
        role: "presentation",
        "data-open": flag(open.get()),
        "data-closed": flag(!open.get()),
        ...placed(),
        ...hidden(),
      })),
      attach(element) {
        positioner = element
        const forget = () => {
          if (positioner === element) positioner = undefined
        }
        if (!position) return forget
        // Asked each time it is placed: its own anchor, or its trigger.
        const anchor = () => options.anchor?.() ?? trigger
        const detach = position.attach(element, anchor, options.following ?? open)
        return () => {
          detach()
          forget()
        }
      },
    },
    arrow: {
      props: computed(() => ({
        "aria-hidden": "true",
        // It fades with its popup.
        "data-open": flag(open.get()),
        "data-closed": flag(!open.get()),
        ...placed(),
        "data-uncentered": flag(position?.uncentered.get()),
      })),
      attach: (element) => position?.arrow(element) ?? NOTHING,
    },
  }
}

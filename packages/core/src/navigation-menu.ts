import { bindable } from "./bindable.ts"
import type { Bindable } from "./bindable.ts"
import type { DirectionAround } from "./direction.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { tabbables } from "./services/focus.ts"
import { setGeometry } from "./services/geometry.ts"
import { popupFocus } from "./services/popup-focus.ts"
import { createPopup } from "./services/popup.ts"
import { createPlacement } from "./services/position.ts"
import type { PositionOptions } from "./services/position.ts"
import { createPresence } from "./services/presence.ts"
import { createRoving } from "./services/roving.ts"
import type { Orientation } from "./services/roving.ts"

export interface NavigationMenuProps<Value = unknown> {
  id: string
  /** The item whose content is shown; `null` is "none". */
  value?: Value | null | undefined
  defaultValue?: Value | null | undefined
  onValueChange?: ((value: Value | null, details: ChangeDetails) => void) | undefined
  /** How long the pointer rests on a trigger before its content shows, in milliseconds. */
  delay?: number | undefined
  /** How long after the pointer leaves the content goes, in milliseconds. */
  closeDelay?: number | undefined
  orientation?: Orientation | undefined
}

export interface NavigationMenuLinkOptions {
  /** The link is the page the reader is on. */
  active?: boolean | undefined
  /** Whether following it closes the menu. Default: it does. */
  closeOnClick?: boolean | undefined
}

/** One item of the menu: a trigger, and the content it shows. */
export interface NavigationMenuItem {
  readonly open: ReadonlySignal<boolean>
  /** Whether the content is in the page: while it is shown, and through its exit. */
  readonly mounted: ReadonlySignal<boolean>
  readonly trigger: Part
  /** A mark on the trigger that shows whether its content is open. */
  readonly icon: Part
  readonly content: Part
  mount(): () => void
}

export interface NavigationMenu<Value = unknown> {
  readonly value: ReadonlySignal<Value | null>
  readonly open: ReadonlySignal<boolean>
  /** Whether the popup is in the page. */
  readonly mounted: ReadonlySignal<boolean>
  setValue(value: Value | null, details: ChangeDetails): void
  readonly positioning: Signal<Partial<PositionOptions>>
  /** Where every item's content is drawn, once it is in the page. */
  readonly viewportElement: ReadonlySignal<HTMLElement | undefined>
  mount(): () => void
  readonly root: Part
  readonly list: Part
  /** An item, by its value: asked for again, the same. */
  item(value: Value): NavigationMenuItem
  /** A link, in the list or in an item's content. */
  link(options?: () => NavigationMenuLinkOptions): Part
  readonly positioner: Part
  readonly popup: Part
  readonly viewport: Part
  readonly arrow: Part
  readonly backdrop: Part
}

export const NAVIGATION_DELAY = 50
/** How soon after the pointer opened an item a press on its trigger is still that opening. */
const HOVER_PRESS = 300
const NOTHING = () => {}

/**
 * A site's navigation: a row of links and of triggers that show a panel of more links. The
 * panels share one popup, which moves and resizes from one item to the next.
 */
export function createNavigationMenu<Value = unknown>(
  props: ReadonlySignal<NavigationMenuProps<Value>>,
  around: DirectionAround = {}
): NavigationMenu<Value> {
  const id = props.peek().id
  // `undefined` means "not controlled", so "none" is `null`.
  const value = bindable<Value | null>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? null,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  const isOpen = computed(() => value.get() !== null)
  const orientation = computed(() => props.get().orientation ?? "horizontal")
  // Which way the content came from, for a design that slides it: the item before, or after.
  const from = signal<"left" | "right" | undefined>(undefined)
  const viewportElement = signal<HTMLElement | undefined>(undefined)
  const roving = createRoving()
  const placement = createPlacement({ align: "start" })

  let list: HTMLElement | undefined
  let popup: HTMLElement | undefined
  let positioner: HTMLElement | undefined
  // The trigger the popup is placed against: the open item's, and the last one's as it closes.
  let anchor: HTMLElement | undefined
  let opening: ReturnType<typeof setTimeout> | undefined
  let closing: ReturnType<typeof setTimeout> | undefined
  let hovered = -Infinity
  // An item whose content takes focus as it is drawn: opened with the arrow that goes into it.
  let entering: Value | typeof NOTHING = NOTHING

  const triggers = new Map<Value, HTMLElement>()
  const contents = new Map<Value, HTMLElement>()
  const items = new Map<Value, NavigationMenuItem>()

  const clear = () => {
    clearTimeout(opening)
    clearTimeout(closing)
    opening = closing = undefined
  }

  function setValue(next: Value | null, by: ChangeDetails) {
    clear()
    const before = value.peek()
    if (next !== null && before !== null) {
      const a = triggers.get(before)
      const b = triggers.get(next)
      const after = a && b && a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
      from.set(after ? "right" : "left")
    } else from.set(undefined)
    value.set(next, by)
  }

  const open: Bindable<boolean> = {
    get: () => isOpen.get(),
    peek: () => isOpen.peek(),
    subscribe: (listener) => isOpen.subscribe(listener),
    set(next, by) {
      if (!next) setValue(null, by)
    },
  }

  const layer = createPopup({
    open,
    setOpen: (next, by) => open.set(next, by),
    kind: "navigation-menu",
    placement,
    // Focus goes in with Tab or the arrow, never by itself; it comes back to the trigger.
    focus: popupFocus("none"),
    anchor: () => ({
      getBoundingClientRect: () => (anchor ?? list)?.getBoundingClientRect() ?? new DOMRect(),
      ...(anchor ? { contextElement: anchor } : {}),
    }),
    // Another trigger of the list is not outside: pressing it shows its content.
    branches: () => [list],
  })

  /** The open content's size, for a popup that grows and shrinks from one item to the next. */
  function size() {
    const current = value.peek()
    const element = current === null ? undefined : contents.get(current)
    if (!element) return
    for (const target of [popup, positioner]) {
      if (!target) continue
      const name = target === popup ? "popup" : "positioner"
      setGeometry(target, `--${name}-width`, `${element.offsetWidth}px`)
      setGeometry(target, `--${name}-height`, `${element.offsetHeight}px`)
    }
  }
  // Content that changes size while it is shown. Written a task later: the popup is nearer the
  // root than the content, and resizing it while the content's size is reported is a size the
  // browser cannot deliver in that frame.
  let observer: ResizeObserver | undefined
  const watch = (element: HTMLElement) => {
    observer ??=
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => void setTimeout(size))
    observer?.observe(element)
    return () => observer?.unobserve(element)
  }

  const leaveSoon = (event: Event) => {
    clearTimeout(closing)
    closing = setTimeout(() => {
      closing = undefined
      if (value.peek() !== null) setValue(null, details("trigger-hover", event))
    }, props.peek().closeDelay ?? NAVIGATION_DELAY)
  }

  function item(key: Value): NavigationMenuItem {
    const found = items.get(key)
    if (found) return found
    const contentId = `${id}-content-${items.size}`
    const shown = computed(() => Object.is(value.get(), key))
    const presence = createPresence(shown)

    const made: NavigationMenuItem = {
      open: shown,
      mounted: presence.mounted,
      mount: () => presence.start(),
      trigger: {
        props: computed(() => ({
          type: "button",
          "aria-expanded": String(shown.get()),
          "aria-controls": presence.mounted.get() ? contentId : undefined,
          "data-popup-open": flag(shown.get()),
          onClick(event: Event) {
            // The pointer opened it a moment ago: the press that follows is not a second wish.
            if (shown.peek() && performance.now() - hovered < HOVER_PRESS) return
            setValue(shown.peek() ? null : key, details("trigger-press", event))
          },
          onPointerEnter(event: PointerEvent) {
            if (event.pointerType !== "mouse") return
            clear()
            if (shown.peek()) return
            opening = setTimeout(() => {
              opening = undefined
              hovered = performance.now()
              setValue(key, details("trigger-hover", event))
            }, props.peek().delay ?? NAVIGATION_DELAY)
          },
          onPointerLeave(event: PointerEvent) {
            if (event.pointerType !== "mouse") return
            clearTimeout(opening)
            opening = undefined
            if (value.peek() !== null) leaveSoon(event)
          },
          onKeyDown(event: KeyboardEvent) {
            const into = orientation.peek() === "horizontal" ? "ArrowDown" : "ArrowRight"
            if (event.key === into) {
              event.preventDefault()
              entering = key
              if (shown.peek()) enter(key)
              else setValue(key, details("list-navigation", event))
            } else if (event.key === "Tab" && !event.shiftKey && shown.peek()) {
              // The content is drawn elsewhere in the page: Tab goes on into it all the same.
              const first = tabbables(contents.get(key) ?? (event.currentTarget as HTMLElement))[0]
              if (!first || !contents.has(key)) return
              event.preventDefault()
              first.focus()
            }
          },
        })),
        attach(element) {
          triggers.set(key, element)
          const leave = roving.register(element)
          return () => {
            leave()
            if (triggers.get(key) === element) triggers.delete(key)
          }
        },
      },
      icon: {
        props: computed(() => ({ "aria-hidden": "true", "data-popup-open": flag(shown.get()) })),
        attach: () => NOTHING,
      },
      content: {
        props: computed(() => {
          const status = presence.status.get()
          return {
            id: contentId,
            "data-open": flag(shown.get()),
            "data-closed": flag(!shown.get()),
            "data-starting-style": flag(status === "starting"),
            "data-ending-style": flag(status === "ending"),
            "data-activation-direction": from.get(),
          }
        }),
        attach(element) {
          contents.set(key, element)
          const stops = [presence.attach(element), watch(element)]
          if (shown.peek()) {
            size()
            if (entering === key) queueMicrotask(() => enter(key))
          }
          return () => {
            for (const stop of stops.reverse()) stop()
            if (contents.get(key) === element) contents.delete(key)
          }
        },
      },
    }
    items.set(key, made)
    return made
  }

  /** Focus into an item's content: its first stop, or the content itself. */
  function enter(key: Value) {
    const element = contents.get(key)
    if (!element || !Object.is(value.peek(), key)) return
    entering = NOTHING
    tabbables(element)[0]?.focus()
  }

  const hover = {
    onPointerEnter(event: PointerEvent) {
      if (event.pointerType === "mouse") clear()
    },
    onPointerLeave(event: PointerEvent) {
      if (event.pointerType === "mouse" && value.peek() !== null) leaveSoon(event)
    },
  }

  return {
    value,
    open,
    mounted: layer.mounted,
    setValue,
    positioning: placement.positioning,
    viewportElement,
    item,
    mount() {
      const stops = [
        layer.start(),
        // The popup follows the open item's trigger, and gives focus back to it.
        effect(() => {
          const current = value.get()
          untracked(() => {
            const trigger = current === null ? undefined : triggers.get(current)
            if (!trigger) return
            anchor = trigger
            layer.attachTrigger(trigger)
            placement.position.refresh()
            size()
          })
        }),
      ]
      return () => {
        clear()
        observer?.disconnect()
        observer = undefined
        for (const stop of stops.reverse()) stop()
      }
    },
    root: {
      props: computed(() => ({ "data-orientation": orientation.get() })),
      attach: () => NOTHING,
    },
    list: {
      props: computed(() => ({
        "data-orientation": orientation.get(),
        onKeyDown(event: KeyboardEvent) {
          // Along the triggers and the links of the list itself.
          roving.move(event, {
            orientation: orientation.peek(),
            loop: false,
            direction: around.direction,
          })
        },
      })),
      attach(element) {
        list = element
        return () => {
          if (list === element) list = undefined
        }
      },
    },
    link(options = () => ({})) {
      return {
        props: computed(() => ({
          "aria-current": options().active ? "page" : undefined,
          "data-active": flag(options().active),
          onClick(event: Event) {
            if (options().closeOnClick === false || value.peek() === null) return
            setValue(null, details("link-press", event))
          },
        })),
        attach(element) {
          let leave: (() => void) | undefined
          // A link of the list is a stop of the list's arrows; one in a content is not. Known
          // once the list is in the page, whichever of the two a framework attaches first.
          queueMicrotask(() => {
            if (element.isConnected && list?.contains(element)) leave = roving.register(element)
          })
          return () => leave?.()
        },
      }
    },
    positioner: {
      props: layer.positioner.props,
      attach(element) {
        positioner = element
        const detach = layer.positioner.attach(element)
        size()
        return () => {
          detach()
          if (positioner === element) positioner = undefined
        }
      },
    },
    popup: {
      props: computed(() => ({
        ...layer.state(),
        ...layer.placed(),
        ...hover,
        onKeyDown(event: KeyboardEvent) {
          if (event.key !== "Tab") return
          const current = value.peek()
          const content = current === null ? undefined : contents.get(current)
          const trigger = current === null ? undefined : triggers.get(current)
          if (!content || !trigger) return
          const stops = tabbables(content)
          const active = content.ownerDocument.activeElement
          if (event.shiftKey && active === stops[0]) {
            event.preventDefault()
            trigger.focus()
          } else if (!event.shiftKey && active === stops[stops.length - 1]) {
            // Back to the trigger, and the key goes on from there: to what follows the trigger
            // in the page, as if the content had been written after it.
            trigger.focus()
            setValue(null, details("focus-out", event))
          }
        },
      })),
      attach(element) {
        popup = element
        const detach = layer.attach(element)
        size()
        return () => {
          detach()
          if (popup === element) popup = undefined
        }
      },
    },
    viewport: {
      props: computed(() => ({})),
      attach(element) {
        viewportElement.set(element)
        return () => {
          if (viewportElement.peek() === element) viewportElement.set(undefined)
        }
      },
    },
    arrow: layer.arrow,
    backdrop: {
      props: computed(() => ({ role: "presentation", ...layer.state() })),
      attach: () => NOTHING,
    },
  }
}

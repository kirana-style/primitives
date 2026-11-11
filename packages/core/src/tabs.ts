import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, keyed, signal } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { setGeometry } from "./services/geometry.ts"
import { createPresence } from "./services/presence.ts"
import { createRoving } from "./services/roving.ts"
import type { Orientation } from "./services/roving.ts"

export interface TabsProps<Value = unknown> {
  id: string
  /** The active tab's value; `null` is "none". */
  value?: Value | null | undefined
  /** Read once. Without one, the first tab that can be chosen is, once the page is there. */
  defaultValue?: Value | null | undefined
  onValueChange?: ((value: Value, details: ChangeDetails) => void) | undefined
  orientation?: Orientation | undefined
}

export interface TabsListOptions {
  /** Whether moving focus onto a tab with the arrows activates it. Default `false`. */
  activateOnFocus?: boolean
  /** Whether the arrows wrap from the last tab to the first. Default `true`. */
  loop?: boolean
}

export interface TabOptions {
  disabled?: boolean
}

/** A tab's panel: in the page while its tab is the active one, and through its exit. */
export interface TabPanel {
  readonly mounted: ReadonlySignal<boolean>
  readonly part: Part
  mount(): () => void
}

export type ActivationDirection = "left" | "right" | "up" | "down" | "none"

export interface Tabs<Value = unknown> {
  readonly value: ReadonlySignal<Value | null>
  setValue(value: Value, details: ChangeDetails): void
  /** How the list behaves; its part's adapter writes its own props here. */
  readonly listOptions: Signal<TabsListOptions>
  mount(): () => void
  readonly root: Part
  readonly list: Part
  /** The mark that sits under the active tab: it carries the tab's position and size. */
  readonly indicator: Part
  tab(value: Value, options?: () => TabOptions): Part
  panel(value: Value): TabPanel
}

const NOTHING = () => {}
const NONE = Symbol("none")

/** A value as part of an id: ids are separated by spaces where they are listed. */
const slug = (value: unknown) =>
  String(value).replace(/[^\w-]/g, (character) => `_${character.charCodeAt(0)}`)

export function createTabs<Value = unknown>(props: ReadonlySignal<TabsProps<Value>>): Tabs<Value> {
  const id = props.peek().id
  const value = bindable<Value | null>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? null,
    onChange: (next, by) => props.peek().onValueChange?.(next as Value, by),
  })
  const isActive = keyed(value as ReadonlySignal<Value | null>)
  const orientation = computed<Orientation>(() => props.get().orientation ?? "horizontal")
  const direction = signal<ActivationDirection>("none")
  const listOptions = signal<TabsListOptions>({})
  // The tab focus is on, which the arrows may have moved off the active one.
  const focused = signal<Value | typeof NONE>(NONE)

  const roving = createRoving()
  const values = new WeakMap<Element, Value>()
  const elements = new Map<Value, HTMLElement>()
  let list: HTMLElement | undefined

  function setValue(next: Value, by: ChangeDetails) {
    const from = value.peek()
    const before = from === null ? undefined : elements.get(from)
    const after = elements.get(next)
    let way: ActivationDirection = "none"
    if (before && after) {
      const a = before.getBoundingClientRect()
      const b = after.getBoundingClientRect()
      if (orientation.peek() === "horizontal") way = b.left > a.left ? "right" : "left"
      else way = b.top > a.top ? "down" : "up"
    }
    value.set(next, by)
    // Unless the caller kept the value. Not "once the value is `next`": a caller who holds the
    // value hands it back a moment later, in its framework's own time.
    if (!by.canceled) direction.set(way)
  }

  const shared = () => ({
    "data-orientation": orientation.get(),
    "data-activation-direction": direction.get(),
  })

  return {
    value,
    setValue,
    listOptions,
    mount() {
      // With nothing chosen, the first tab that can be: known only once the tabs are in the page.
      if (value.peek() === null) {
        const first = roving.enabled()[0]
        if (first) setValue(values.get(first)!, details("initial"))
      }
      return NOTHING
    },
    root: { props: computed(shared), attach: () => NOTHING },
    list: {
      props: computed(() => ({
        role: "tablist",
        "aria-orientation": orientation.get(),
        ...shared(),
        onKeyDown(event: KeyboardEvent) {
          const options = listOptions.peek()
          const next = roving.move(event, {
            orientation: orientation.peek(),
            loop: options.loop ?? true,
          })
          if (next && options.activateOnFocus) {
            setValue(values.get(next)!, details("focus", event))
          }
        },
        onBlur(event: FocusEvent) {
          // Focus left the list: the active tab is the way back in.
          if (!list?.contains(event.relatedTarget as Node | null)) focused.set(NONE)
        },
      })),
      attach(element) {
        list = element
        return () => {
          if (list === element) list = undefined
        }
      },
    },
    indicator: {
      props: computed(shared),
      attach(element) {
        // The active tab's box, relative to the list: where a design draws the mark.
        const measure = () => {
          const current = value.peek()
          const tab = current === null ? undefined : elements.get(current)
          if (!tab || !list) return
          const outer = list.getBoundingClientRect()
          const inner = tab.getBoundingClientRect()
          const left = inner.left - outer.left + list.scrollLeft
          const top = inner.top - outer.top + list.scrollTop
          setGeometry(element, "--active-tab-left", `${left}px`)
          setGeometry(element, "--active-tab-right", `${outer.width - left - inner.width}px`)
          setGeometry(element, "--active-tab-top", `${top}px`)
          setGeometry(element, "--active-tab-bottom", `${outer.height - top - inner.height}px`)
          setGeometry(element, "--active-tab-width", `${inner.width}px`)
          setGeometry(element, "--active-tab-height", `${inner.height}px`)
        }
        const view = element.ownerDocument.defaultView
        // The list resizing moves every tab; the active tab resizing (a heavier font once it is
        // active, written by the framework a moment after the value changes) moves the mark.
        const observer = view ? new view.ResizeObserver(measure) : undefined
        if (list) observer?.observe(list)
        let watched: HTMLElement | undefined
        const stop = effect(() => {
          const current = value.get()
          orientation.get()
          if (watched) observer?.unobserve(watched)
          watched = current === null ? undefined : elements.get(current)
          if (watched) observer?.observe(watched)
          queueMicrotask(measure)
        })
        return () => {
          stop()
          observer?.disconnect()
        }
      },
    },
    tab(item, options = () => ({})) {
      const active = isActive.is(item)
      return {
        props: computed(() => {
          const off = Boolean(options().disabled)
          const on = focused.get()
          const stop = on === NONE ? active.get() || value.get() === null : on === item
          return {
            type: "button",
            role: "tab",
            id: `${id}-tab-${slug(item)}`,
            tabindex: !off && stop ? "0" : "-1",
            "aria-selected": String(active.get()),
            "aria-controls": active.get() ? `${id}-panel-${slug(item)}` : undefined,
            "aria-disabled": off ? "true" : undefined,
            "data-active": flag(active.get()),
            "data-disabled": flag(off),
            "data-orientation": orientation.get(),
            onClick(event: Event) {
              if (off) return
              setValue(item, details("press", event))
            },
            onFocus: () => focused.set(item),
          }
        }),
        attach(element) {
          values.set(element, item)
          elements.set(item, element)
          const remove = roving.register(element)
          return () => {
            remove()
            if (elements.get(item) === element) elements.delete(item)
          }
        },
      }
    },
    panel(item) {
      const active = isActive.is(item)
      const presence = createPresence(active)
      return {
        mounted: presence.mounted,
        mount: () => presence.start(),
        part: {
          props: computed(() => {
            const status = presence.status.get()
            return {
              role: "tabpanel",
              id: `${id}-panel-${slug(item)}`,
              tabindex: "0",
              "aria-labelledby": `${id}-tab-${slug(item)}`,
              // Only seen on a panel its caller keeps in the page.
              hidden: flag(!presence.mounted.get()),
              "data-hidden": flag(!active.get()),
              ...shared(),
              "data-starting-style": flag(status === "starting"),
              "data-ending-style": flag(status === "ending"),
            }
          }),
          attach: (element) => presence.attach(element),
        },
      }
    },
  }
}

import { bindable } from "./bindable.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { directionOf } from "./direction.ts"
import { batch, computed, effect, keyed, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { createItemAlignment } from "./services/align-item.ts"
import { createFormControl } from "./services/form-control.ts"
import { popupFocus } from "./services/popup-focus.ts"
import { createPopup } from "./services/popup.ts"
import { createPresence } from "./services/presence.ts"
import { createPlacement } from "./services/position.ts"
import type { PositionOptions } from "./services/position.ts"
import { byPlace } from "./services/list-places.ts"
import { createList, pointerMoved } from "./services/list.ts"
import type { ListCollection, ListRow } from "./services/list.ts"
import { createTypeahead, printable, textOf } from "./services/typeahead.ts"

export interface SelectProps<Value = unknown> {
  id: string
  /** The chosen value; `null` is "none". */
  value?: Value | null | undefined
  defaultValue?: Value | null | undefined
  onValueChange?: ((value: Value | null, details: ChangeDetails) => void) | undefined
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  disabled?: boolean | undefined
  /** In a field, "none" is then wrong. */
  required?: boolean | undefined
  /** With a name, the value is submitted with the form around it. */
  name?: string | undefined
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
  /**
   * The labels of the values, for the trigger to show before the list has ever been opened. Not
   * needed for the list itself: its items are read from the markup.
   */
  items?: readonly { value: Value; label: string }[] | undefined
  /**
   * Every row, when only some are in the page (a virtualizer draws the ones in view). Each item
   * is then given its `index`.
   */
  virtualized?: ListCollection | undefined
}

export interface SelectItemOptions {
  disabled?: boolean
  /** What typeahead matches and the trigger shows; the item's text when left out. */
  label?: string
  /** Its place among all the rows, in a virtualized list. */
  index?: number
}

export interface Select<Value = unknown> {
  readonly open: ReadonlySignal<boolean>
  readonly mounted: ReadonlySignal<boolean>
  readonly value: ReadonlySignal<Value | null>
  /** The chosen value's label, `undefined` while nothing is chosen. */
  readonly label: ReadonlySignal<string | undefined>
  /** Whether the select has a name, its own or its field's: whether its hidden input is drawn. */
  readonly named: ReadonlySignal<boolean>
  setOpen(open: boolean, details: ChangeDetails): void
  setValue(value: Value | null, details: ChangeDetails): void
  readonly positioning: Signal<Partial<PositionOptions>>
  /**
   * Whether the list opens over its trigger, the chosen item's text on the trigger's own (as
   * a native select does), where there is room and unless a finger opened it. Its positioner's
   * adapter writes it here. Off unless asked for.
   */
  readonly alignItemWithTrigger: Signal<boolean>
  mount(): () => void
  readonly trigger: Part
  readonly valuePart: Part
  readonly positioner: Part
  readonly popup: Part
  /**
   * The items' own box inside the popup, when the popup holds more than its items (scroll
   * arrows): it is then the listbox, and what scrolls.
   */
  readonly list: Part
  /** A strip at the list's top or bottom that scrolls it while the pointer moves over it. */
  scrollArrow(direction: "up" | "down"): SelectScrollArrow
  /** The hidden input that submits the value. Rendered only when the select has a name. */
  readonly input: Part
  /** An item's part. One per item element, with no controller of its own. */
  item(value: Value, options?: () => SelectItemOptions): Part
  /** The part of an item that is its name: what the trigger shows once it is chosen. */
  itemText(value: Value): Part
  /** The mark an item shows while it is the chosen one. */
  itemIndicator(value: Value): Part
  /** Whether `value` is the chosen one, for an item's indicator. */
  selected(value: Value): ReadonlySignal<boolean>
}

/** In the page while there is more of the list its way, and through its exit. */
export interface SelectScrollArrow {
  readonly mounted: ReadonlySignal<boolean>
  readonly part: Part
  mount(): () => void
}

const NOTHING = () => {}
// How near an end of its scroll a list is taken to be at it, in pixels.
const NEAR = 1
const NO_PROPS = computed(() => ({}))
const INDICATOR_PROPS = computed(() => ({ "aria-hidden": "true" }))

export function createSelect<Value = unknown>(
  props: ReadonlySignal<SelectProps<Value>>,
  around: { field?: Field | undefined } = {}
): Select<Value> {
  const { field } = around
  let member: FieldMembership | undefined
  const id = props.peek().id
  const popupId = `${id}-popup`
  const open = bindable({
    value: () => props.get().open,
    defaultValue: props.peek().defaultOpen ?? false,
    onChange: (next, by) => props.peek().onOpenChange?.(next, by),
  })
  // `undefined` means "not controlled", so "none" is `null` on the way in and out.
  const value = bindable<Value | null>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? null,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  // What a form's reset goes back to: the value the select began with.
  const initial = value.peek()
  const inForm = createFormControl((event) => {
    const by = details("form-reset", event)
    value.set(initial, by)
    // What was asked for, not what is read back: a caller who holds the value gives it back
    // in their framework's time.
    const next = by.canceled ? value.peek() : initial
    member?.reset(next === null ? "" : String(next))
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )
  const name = computed(() => props.get().name ?? field?.name.get())
  const placement = createPlacement({ align: "start" })
  const alignItemWithTrigger = signal(false)
  // Whether the list lies over its trigger now, and whether a finger opened it.
  const aligned = signal(false)
  let touched = false
  const fingered = signal(false)
  const alignment = createItemAlignment()
  const layer = createPopup({
    open,
    setOpen,
    kind: "select",
    // The list moves focus itself, once its rows are in the page; the popup gives it back.
    focus: popupFocus("none"),
    placement,
    // Over its trigger, its place is its own: the usual one would take it back.
    following: computed(() => open.get() && !aligned.get()),
  })

  const isSelected = keyed(value as ReadonlySignal<Value | null>)
  // The rows are read from the page: nothing re-renders for one to be known.
  const list = createList({
    selector: '[role="option"]',
    places: byPlace(() => props.peek().virtualized),
  })
  const rows = new Map<Value, ListRow>()
  // The labels learned from the markup, so the trigger still names a value once the list is gone.
  const labels = new Map<Value, string>()
  const labelsChanged = signal(0)
  // Each item's text part while it is in the page, and the values a caller's `label` names.
  const texts = new Map<Value, HTMLElement>()
  const explicit = new Set<Value>()

  let trigger: HTMLElement | undefined
  let popup: HTMLElement | undefined
  let shown: HTMLElement | undefined
  // The items' own box, when there is one: the listbox, and what scrolls.
  const listed = signal<HTMLElement | undefined>(undefined)
  const scroller = () => listed.peek() ?? popup
  // Whether there is more of the list above and below what is in view.
  const more = { up: signal(false), down: signal(false) }

  function seen() {
    const box = scroller()
    if (!box) return
    const end = Math.max(0, box.scrollHeight - box.clientHeight)
    more.up.set(box.scrollTop > NEAR)
    more.down.set(box.scrollTop < end - NEAR)
  }

  function learn(item: Value, text: string) {
    if (labels.get(item) === text) return
    labels.set(item, text)
    // Only the chosen value's label is on screen: the others change nothing.
    if (Object.is(value.peek(), item)) labelsChanged.set(labelsChanged.peek() + 1)
  }

  // For choosing by a letter while the list is closed: the open list has its own.
  const typeahead = createTypeahead()

  function setOpen(next: boolean, by: ChangeDetails) {
    if (disabled.peek()) return
    // A finger's list is placed beside its trigger: over it, the finger would hide the item.
    if (next) {
      touched = by.source === "touch"
      fingered.set(touched)
    }
    open.set(next, by)
  }

  /** The text the list lines up with the trigger's: the chosen item's, else the first's. */
  function lead(): HTMLElement | undefined {
    const chosen = value.peek()
    const own = chosen === null ? undefined : texts.get(chosen)
    if (own?.isConnected) return own
    if (chosen !== null) return undefined
    let first: HTMLElement | undefined
    for (const each of texts.values()) {
      if (!each.isConnected) continue
      if (!first || each.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING)
        first = each
    }
    return first
  }

  function setValue(next: Value | null, by: ChangeDetails) {
    value.set(next, by)
    if (!by.canceled) member?.changed(next === null ? "" : String(next))
  }

  function choose(item: Value, event: Event) {
    batch(() => {
      setValue(item, details("item-press", event))
      setOpen(false, details("item-press", event))
    })
  }

  const label = computed(() => {
    const current = value.get()
    if (current === null) return undefined
    const given = props.get().items?.find((each) => Object.is(each.value, current))
    if (given) return given.label
    labelsChanged.get()
    return labels.get(current) || String(current)
  })

  return {
    open,
    mounted: layer.mounted,
    value,
    label,
    named: computed(() => name.get() !== undefined),
    setOpen,
    setValue,
    positioning: placement.positioning,
    alignItemWithTrigger,
    mount: () => layer.start(),
    selected: (item) => isSelected.is(item),
    trigger: {
      props: computed(() => ({
        type: "button",
        // In a field, the id its label is `for`.
        id: field?.controlId,
        role: "combobox",
        "aria-haspopup": "listbox",
        ...layer.expanded(listed.get() ? `${id}-list` : popupId),
        // The trigger is the select's element in a form: its reset is heard through it.
        form: props.get().form,
        disabled: flag(disabled.get()),
        "aria-required": props.get().required ? "true" : undefined,
        ...field?.aria(),
        ...field?.state(),
        "data-popup-open": flag(open.get()),
        "data-placeholder": flag(value.get() === null),
        "data-disabled": flag(disabled.get()),
        onFocus: () => member?.focused(true),
        onBlur(event: FocusEvent) {
          // Into its own list, focus has not left the select.
          if (!popup?.contains(event.relatedTarget as Node | null)) member?.focused(false)
        },
        onClick: (event: Event) => setOpen(!open.peek(), details("trigger-press", event)),
        onKeyDown(event: KeyboardEvent) {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            setOpen(true, details("trigger-press", event))
          } else if (printable(event) && !open.peek()) {
            // Closed, a letter chooses: only the labels the caller gave are known then.
            const items = props.peek().items ?? []
            const chosen = value.peek()
            const match = typeahead.match(
              event.key,
              items,
              items.findIndex((each) => Object.is(each.value, chosen))
            )
            if (match) setValue(match.value, details("typeahead", event))
          }
        },
      })),
      attach(element) {
        trigger = element
        const untrigger = layer.attachTrigger(element)
        const chosen = value.peek()
        member = field?.join({
          element,
          focus: () => element.focus(),
          kind: "select",
          required: () => Boolean(props.peek().required),
          value: chosen === null ? "" : String(chosen),
        })
        const leave = inForm.attach(element)
        return () => {
          leave()
          untrigger()
          member?.leave()
          member = undefined
          if (trigger === element) trigger = undefined
        }
      },
    },
    valuePart: {
      props: computed(() => ({ "data-placeholder": flag(value.get() === null) })),
      attach(element) {
        shown = element
        return () => {
          if (shown === element) shown = undefined
        }
      },
    },
    positioner: {
      props: computed(() => {
        const own = layer.positioner.props.get()
        // Over its trigger it is on no side of it.
        return aligned.get() ? { ...own, "data-side": "none" } : own
      }),
      attach(element) {
        const detach = layer.positioner.attach(element)
        const view = element.ownerDocument.defaultView
        // The window changed: what was measured no longer holds.
        const resized = (event: Event) => {
          if (aligned.peek()) setOpen(false, details("window-resize", event))
        }
        view?.addEventListener("resize", resized)
        let reopened = false
        const stops = [
          detach,
          () => view?.removeEventListener("resize", resized),
          // Each time it opens, once it has been placed the usual way: its variables are
          // written by then, and its items are in the page.
          effect(() => {
            const isOpen = open.get()
            const wanted = alignItemWithTrigger.get()
            const ready = placement.position.placed.get()
            untracked(() => {
              // Closing, it stays where it is through its exit.
              if (!isOpen) return void (reopened = true)
              // Placed, its room is known: whether there is more of the list than shows.
              if (ready) seen()
              // Kept in the page and opened again: placed afresh, its trigger may have moved.
              if (!wanted || reopened) {
                reopened = false
                if (aligned.peek()) alignment.clear()
                aligned.set(false)
                if (!wanted) return
              }
              if (!ready || aligned.peek() || touched || !trigger || !popup) return
              aligned.set(
                alignment.place({
                  trigger,
                  positioner: element,
                  popup,
                  scroller: scroller()!,
                  text: lead(),
                  value: shown,
                  rtl: directionOf(trigger) === "rtl",
                })
              )
              seen()
            })
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          alignment.clear()
          aligned.set(false)
        }
      },
    },
    popup: {
      props: computed(() => {
        return {
          id: popupId,
          // With a list inside, that is the listbox.
          role: listed.get() ? "presentation" : "listbox",
          tabindex: "-1",
          ...layer.state(),
          ...layer.placed(),
          onKeyDown(event: KeyboardEvent) {
            switch (event.key) {
              case " ":
                // Part of a name that is being typed, not a press.
                if (list.typing()) break
              // falls through
              case "Enter":
                event.preventDefault()
                // The row's own press: what a caller's handler on it hears too.
                return list.highlighted.peek()?.element()?.click()
              case "Tab":
                // The list is one stop: Tab leaves it, and the trigger takes focus back.
                event.preventDefault()
                return setOpen(false, details("focus-out", event))
            }
            list.key(event)
          },
        }
      }),
      attach(element) {
        popup = element
        const scrolled = () => {
          alignment.scrolled()
          seen()
        }
        // A scroll does not come up from the list inside: heard on its way down.
        element.addEventListener("scroll", scrolled, true)
        const stops = [
          () => element.removeEventListener("scroll", scrolled, true),
          list.attach(element),
          layer.attach(element),
          // Each time it opens: the items attach around the list, in an order each framework
          // chooses. Once all have, the chosen one takes focus, or the list itself. Unless it
          // closed in the meantime.
          effect(() => {
            if (!open.get()) return
            queueMicrotask(() => {
              if (popup !== element || !open.peek()) return
              const chosen = value.peek()
              const every = list.collection()
              const at = every && chosen !== null ? (every.indexOf?.(chosen) ?? -1) : -1
              // The chosen row may not be in the page: it is asked for by its place.
              if (at >= 0) return list.goto(at)
              const row = chosen === null ? undefined : rows.get(chosen)
              list.highlight(row?.element() && !row.disabled() ? row : undefined, true)
            })
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          if (popup === element) popup = undefined
        }
      },
    },
    list: {
      props: computed(() => ({ id: `${id}-list`, role: "listbox" })),
      attach(element) {
        listed.set(element)
        return () => {
          if (listed.peek() === element) listed.set(undefined)
        }
      },
    },
    scrollArrow(direction) {
      const up = direction === "up"
      // A finger scrolls the list itself: the arrows are for a pointer that hovers.
      const visible = computed(() => open.get() && more[direction].get() && !fingered.get())
      const presence = createPresence(visible)
      let own: HTMLElement | undefined
      let timer: ReturnType<typeof setTimeout> | undefined
      const stop = () => {
        clearTimeout(timer)
        timer = undefined
      }
      /** A row at a time, for as long as the pointer stays: the next row comes whole into view. */
      function step() {
        const box = scroller()
        if (!box) return stop()
        list.highlight(undefined)
        const end = Math.max(0, box.scrollHeight - box.clientHeight)
        const from = Math.min(end, Math.max(0, box.scrollTop))
        if (up ? from <= NEAR : from >= end - NEAR) return stop()
        const strip = own?.offsetHeight ?? 0
        const options = [...box.querySelectorAll<HTMLElement>('[role="option"]')]
        const top = (row: HTMLElement) =>
          row.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
        let to = up ? 0 : end
        if (up) {
          // The last row that starts above what is in view, under the strip.
          for (const row of options) {
            if (top(row) >= from + strip - NEAR) break
            to = top(row) - strip
          }
        } else {
          for (const row of options) {
            const bottom = top(row) + row.offsetHeight
            if (bottom > from + box.clientHeight - strip + NEAR) {
              to = bottom - box.clientHeight + strip
              break
            }
          }
        }
        box.scrollTop = Math.min(end, Math.max(0, to))
        timer = setTimeout(step, 40)
      }
      return {
        mounted: presence.mounted,
        mount: () => presence.start(),
        part: {
          props: computed(() => {
            const status = presence.status.get()
            return {
              "aria-hidden": "true",
              "data-direction": direction,
              "data-visible": flag(visible.get()),
              "data-side": aligned.get() ? "none" : placement.position.side.get(),
              "data-starting-style": flag(status === "starting"),
              "data-ending-style": flag(status === "ending"),
              style: { position: "absolute" },
              onMouseMove(event: MouseEvent) {
                // A list that scrolls under a pointer at rest sends a move of its own.
                if ((event.movementX === 0 && event.movementY === 0) || timer !== undefined) return
                timer = setTimeout(step, 40)
              },
              onMouseLeave: stop,
            }
          }),
          attach(element) {
            own = element
            const detach = presence.attach(element)
            return () => {
              detach()
              stop()
              if (own === element) own = undefined
            }
          },
        },
      }
    },
    input: {
      props: computed(() => {
        const current = value.get()
        return {
          type: "hidden",
          name: name.get(),
          form: props.get().form,
          value: current === null ? "" : String(current),
          disabled: flag(disabled.get()),
        }
      }),
      attach: () => NOTHING,
    },
    itemIndicator: () => ({ props: INDICATOR_PROPS, attach: () => NOTHING }),
    itemText(item) {
      return {
        props: NO_PROPS,
        attach(element) {
          texts.set(item, element)
          // A framework may write the text after the element attaches: read it a moment later.
          queueMicrotask(() => {
            if (!explicit.has(item) && element.isConnected) {
              learn(item, textOf(element))
            }
          })
          return () => {
            if (texts.get(item) === element) texts.delete(item)
          }
        },
      }
    },
    item(item, options = () => ({})) {
      const selected = isSelected.is(item)
      // Its name is its text part's when it has one, read when it is needed.
      const row = list.row(options, (element) => textOf(texts.get(item) ?? element))
      return {
        props: computed(() => {
          const off = Boolean(options().disabled)
          return {
            role: "option",
            tabindex: "-1",
            "aria-selected": String(selected.get()),
            "aria-disabled": off ? "true" : undefined,
            ...list.place(options().index),
            "data-selected": flag(selected.get()),
            "data-highlighted": flag(row.active.get()),
            "data-disabled": flag(off),
            onPointerMove(event: PointerEvent) {
              if (!pointerMoved(event) || off || row.active.peek()) return
              list.highlight(row, true)
            },
            onClick(event: Event) {
              if (!options().disabled) choose(item, event)
            },
          }
        }),
        attach(element) {
          const detach = row.attach(element)
          rows.set(item, row)
          // A label given names it; else its text part does (which may attach before or after
          // the item, as each framework orders them); else its whole text.
          const given = options().label
          if (given !== undefined) {
            explicit.add(item)
            learn(item, given)
          } else {
            queueMicrotask(() => {
              if (!texts.has(item) && element.isConnected) learn(item, row.label())
            })
          }
          return () => {
            detach()
            if (rows.get(item) === row) rows.delete(item)
          }
        },
      }
    },
  }
}

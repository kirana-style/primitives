import { bindable } from "./bindable.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { batch, computed, keyed, signal } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { pushLayer } from "./services/layers.ts"
import { POSITION_DEFAULTS, createPosition, sameOptions } from "./services/position.ts"
import type { PositionOptions } from "./services/position.ts"
import { createPresence } from "./services/presence.ts"
import { stepTo } from "./services/roving.ts"
import { createTypeahead, printable } from "./services/typeahead.ts"

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
  /**
   * The labels of the values, for the trigger to show before the list has ever been opened. Not
   * needed for the list itself: its items are read from the markup.
   */
  items?: readonly { value: Value; label: string }[] | undefined
}

export interface SelectItemOptions {
  disabled?: boolean
  /** What typeahead matches and the trigger shows; the item's text when left out. */
  label?: string
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
  mount(): () => void
  readonly trigger: Part
  readonly valuePart: Part
  readonly positioner: Part
  readonly popup: Part
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

const NOTHING = () => {}
const NO_PROPS = computed(() => ({}))
const INDICATOR_PROPS = computed(() => ({ "aria-hidden": "true" }))
const NONE = Symbol("none")

interface Row<Value> {
  value: Value
  options: () => SelectItemOptions
}

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
  const disabled = computed(() => Boolean(props.get().disabled) || Boolean(field?.disabled.get()))
  const name = computed(() => props.get().name ?? field?.name.get())
  const presence = createPresence(open)
  const positioning = signal<Partial<PositionOptions>>({})
  const position = createPosition(
    computed(() => ({ ...POSITION_DEFAULTS, align: "start", ...positioning.get() }), sameOptions)
  )

  const highlighted = signal<Value | typeof NONE>(NONE)
  const isHighlighted = keyed(highlighted)
  const isSelected = keyed(value as ReadonlySignal<Value | null>)

  // The items in the page, by element. Filled as each attaches: nothing re-renders for it.
  const rows = new WeakMap<Element, Row<Value>>()
  const elements = new Map<Value, HTMLElement>()
  // The labels learned from the markup, so the trigger still names a value once the list is gone.
  const labels = new Map<Value, string>()
  const labelsChanged = signal(0)
  // Each item's text part while it is in the page, and the values a caller's `label` names.
  const texts = new Map<Value, HTMLElement>()
  const explicit = new Set<Value>()

  let trigger: HTMLElement | undefined
  let popup: HTMLElement | undefined

  function labelOf(element: Element, row: Row<Value>): string {
    // Read when it is needed, from the page as it is now.
    const text = texts.get(row.value) ?? element
    return row.options().label ?? text.textContent?.trim() ?? ""
  }

  function learn(item: Value, text: string) {
    if (labels.get(item) === text) return
    labels.set(item, text)
    // Only the chosen value's label is on screen: the others change nothing.
    if (Object.is(value.peek(), item)) labelsChanged.set(labelsChanged.peek() + 1)
  }

  /** The items in document order, read from the list when a key needs them. */
  function enabled(): HTMLElement[] {
    if (!popup) return []
    return [...popup.querySelectorAll<HTMLElement>('[role="option"]')].filter((each) => {
      const row = rows.get(each)
      return row !== undefined && !row.options().disabled
    })
  }

  function highlight(element: HTMLElement | undefined, focus: boolean) {
    const row = element && rows.get(element)
    if (!element || !row) return
    highlighted.set(row.value)
    if (focus) {
      element.focus({ preventScroll: true })
      element.scrollIntoView({ block: "nearest" })
    }
  }

  function move(step: 1 | -1 | "first" | "last") {
    const list = enabled()
    if (list.length === 0) return
    const current = highlighted.peek()
    const index = current === NONE ? -1 : list.indexOf(elements.get(current)!)
    // With no row highlighted, up starts from the end.
    const to = index < 0 && step === -1 ? "last" : step
    highlight(list[stepTo(list.length, index, to, false)], true)
  }

  const typeahead = createTypeahead()

  function setOpen(next: boolean, by: ChangeDetails) {
    if (disabled.peek()) return
    if (next) highlighted.set(value.peek() ?? NONE)
    open.set(next, by)
  }

  function setValue(next: Value | null, by: ChangeDetails) {
    value.set(next, by)
    if (!by.canceled) member?.changed(next === null ? "" : String(next))
  }

  function choose(element: HTMLElement, event: Event) {
    const row = rows.get(element)
    if (!row || row.options().disabled) return
    batch(() => {
      setValue(row.value, details("item-press", event))
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
    mounted: presence.mounted,
    value,
    label,
    named: computed(() => name.get() !== undefined),
    setOpen,
    setValue,
    positioning,
    mount: () => presence.start(),
    selected: (item) => isSelected.is(item),
    trigger: {
      props: computed(() => ({
        type: "button",
        role: "combobox",
        "aria-haspopup": "listbox",
        "aria-expanded": String(open.get()),
        "aria-controls": presence.mounted.get() ? popupId : undefined,
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
        const chosen = value.peek()
        member = field?.join({
          element,
          focus: () => element.focus(),
          kind: "select",
          required: () => Boolean(props.peek().required),
          value: chosen === null ? "" : String(chosen),
        })
        return () => {
          member?.leave()
          member = undefined
          if (trigger === element) trigger = undefined
        }
      },
    },
    valuePart: {
      props: computed(() => ({ "data-placeholder": flag(value.get() === null) })),
      attach: () => NOTHING,
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
          role: "listbox",
          tabindex: "-1",
          "data-open": flag(open.get()),
          "data-closed": flag(!open.get()),
          "data-starting-style": flag(status === "starting"),
          "data-ending-style": flag(status === "ending"),
          "data-side": position.side.get(),
          "data-align": position.align.get(),
          onKeyDown(event: KeyboardEvent) {
            switch (event.key) {
              case "ArrowDown":
                event.preventDefault()
                return move(1)
              case "ArrowUp":
                event.preventDefault()
                return move(-1)
              case "Home":
                event.preventDefault()
                return move("first")
              case "End":
                event.preventDefault()
                return move("last")
              case "Enter":
              case " ": {
                event.preventDefault()
                const current = highlighted.peek()
                const element = current === NONE ? undefined : elements.get(current)
                if (element) choose(element, event)
                return
              }
              case "Tab":
                // The list is one stop: Tab leaves it, and the trigger takes focus back.
                event.preventDefault()
                return setOpen(false, details("focus-out", event))
            }
            if (printable(event)) {
              const list = enabled()
              const current = highlighted.peek()
              const match = typeahead.match(
                event.key,
                list.map((element) => ({ label: labelOf(element, rows.get(element)!), element })),
                current === NONE ? -1 : list.indexOf(elements.get(current)!)
              )
              if (match) highlight(match.element, true)
            }
          },
        }
      }),
      attach(element) {
        popup = element
        const stops = [
          presence.attach(element),
          pushLayer({
            element,
            kind: "select",
            branches: () => [trigger],
            onEscape: (event) => setOpen(false, details("escape-key", event)),
            onOutsidePress: (event) => setOpen(false, details("outside-press", event)),
          }),
        ]
        // The items attach around the list, in an order each framework chooses: once all have,
        // the chosen one takes focus, or the list itself.
        queueMicrotask(() => {
          if (popup !== element) return
          const current = highlighted.peek()
          const target = current === NONE ? undefined : elements.get(current)
          if (target) highlight(target, true)
          else element.focus({ preventScroll: true })
        })
        return () => {
          for (const stop of stops.reverse()) stop()
          if (popup === element) popup = undefined
          highlighted.set(NONE)
          // Focus goes back to the trigger unless the person moved it elsewhere meanwhile.
          const active = element.ownerDocument.activeElement
          if (active === element.ownerDocument.body || element.contains(active)) {
            trigger?.focus({ preventScroll: true })
          }
        }
      },
    },
    input: {
      props: computed(() => {
        const current = value.get()
        return {
          type: "hidden",
          name: name.get(),
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
              learn(item, element.textContent?.trim() ?? "")
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
      const active = isHighlighted.is(item)
      return {
        props: computed(() => {
          const off = Boolean(options().disabled)
          return {
            role: "option",
            tabindex: "-1",
            "aria-selected": String(selected.get()),
            "aria-disabled": off ? "true" : undefined,
            "data-selected": flag(selected.get()),
            "data-highlighted": flag(active.get()),
            "data-disabled": flag(off),
            onPointerMove(event: PointerEvent) {
              if (off || active.peek()) return
              highlight(event.currentTarget as HTMLElement, true)
            },
            onClick: (event: Event) => choose(event.currentTarget as HTMLElement, event),
          }
        }),
        attach(element) {
          const row = { value: item, options }
          rows.set(element, row)
          elements.set(item, element)
          // A label given names it; else its text part does (which may attach before or after
          // the item, as each framework orders them); else its whole text.
          const given = options().label
          if (given !== undefined) {
            explicit.add(item)
            learn(item, given)
          } else {
            queueMicrotask(() => {
              if (!texts.has(item) && element.isConnected) learn(item, labelOf(element, row))
            })
          }
          return () => {
            if (elements.get(item) === element) elements.delete(item)
          }
        },
      }
    },
  }
}

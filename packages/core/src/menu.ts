import { bindable } from "./bindable.ts"
import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part, PartProps } from "./part.ts"
import { computed, effect, keyed, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"
import { createList } from "./services/list.ts"
import type { List, ListRow } from "./services/list.ts"
import { popupFocus } from "./services/popup-focus.ts"
import { createPopup } from "./services/popup.ts"
import { createPlacement } from "./services/position.ts"
import type { PositionOptions } from "./services/position.ts"
import { createSafeArea } from "./services/safe-area.ts"

export interface MenuProps {
  id: string
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  /** The trigger cannot be pressed; a submenu's is passed over. */
  disabled?: boolean | undefined
  /** Whether the arrows go round from the last item to the first. Default: they do. */
  loop?: boolean | undefined
}

export interface MenuItemOptions {
  disabled?: boolean | undefined
  /** What typing matches; the item's text when left out. */
  label?: string | undefined
  /**
   * Whether choosing the item closes the menu. Default: it does for an item, and does not for a
   * checkbox or a radio item.
   */
  closeOnClick?: boolean | undefined
}

export interface MenuCheckboxItemProps extends MenuItemOptions {
  checked?: boolean | undefined
  defaultChecked?: boolean | undefined
  onCheckedChange?: ((checked: boolean, details: ChangeDetails) => void) | undefined
}

export interface MenuRadioGroupProps<Value = unknown> {
  /** The chosen value; `null` is "none". */
  value?: Value | null | undefined
  defaultValue?: Value | null | undefined
  onValueChange?: ((value: Value, details: ChangeDetails) => void) | undefined
  disabled?: boolean | undefined
}

/** A group of items, and the label that names it. */
export interface MenuGroup {
  readonly root: Part
  readonly label: Part
}

export interface MenuCheckboxItem {
  readonly checked: ReadonlySignal<boolean>
  readonly part: Part
  /** The mark the item shows while it is checked. */
  readonly indicator: Part
  mount(): () => void
}

export interface MenuRadioGroup<Value = unknown> {
  readonly value: ReadonlySignal<Value | null>
  readonly root: Part
  item(value: Value, options?: () => MenuItemOptions): Part
  /** Whether `value` is the chosen one, for an item's indicator. */
  checked(value: Value): ReadonlySignal<boolean>
  /** The mark an item shows while it is the chosen one. */
  indicator(value: Value): Part
  mount(): () => void
}

/** What a submenu needs of the menu it is in. Not for a caller. */
export interface MenuLink {
  readonly list: List
  readonly open: ReadonlySignal<boolean>
  /** Closes this menu and every one it was opened from. */
  closeAll(details: ChangeDetails): void
  /** Set by an open submenu: whether a pointer move over this menu's rows is on its way to it. */
  onTheWay: ((event: PointerEvent) => boolean) | undefined
}

export interface Menu {
  readonly open: ReadonlySignal<boolean>
  readonly mounted: ReadonlySignal<boolean>
  setOpen(open: boolean, details: ChangeDetails): void
  readonly positioning: Signal<Partial<PositionOptions>>
  mount(): () => void
  /** The button that opens the menu; in a submenu, the item of the menu around it that does. */
  readonly trigger: Part
  readonly positioner: Part
  readonly popup: Part
  readonly arrow: Part
  /** An item's part. One per item element, with no controller of its own. */
  item(options?: () => MenuItemOptions): Part
  /** A group; `id` is its element's, and what its label's is made from. */
  group(id: string): MenuGroup
  /** A label that is in no group: it names nothing, and is valid there. */
  readonly label: Part
  readonly separator: Part
  checkboxItem(props: ReadonlySignal<MenuCheckboxItemProps>): MenuCheckboxItem
  radioGroup<Value = unknown>(
    props: ReadonlySignal<MenuRadioGroupProps<Value>>
  ): MenuRadioGroup<Value>
  readonly link: MenuLink
}

/** Where focus goes as the menu opens: a row, the menu itself, or nowhere (opened by hovering). */
type Entry = "first" | "last" | "popup" | "stay"

const NOTHING = () => {}
const ROWS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'
/** How long the pointer rests on a submenu's trigger before it opens, in milliseconds. */
export const SUBMENU_DELAY = 100

const LABEL: Part = { props: computed(() => ({ role: "presentation" })), attach: () => NOTHING }
const SEPARATOR: Part = {
  props: computed(() => ({ role: "separator", "aria-orientation": "horizontal" })),
  attach: () => NOTHING,
}

const checkedState = (on: boolean) => ({
  "data-checked": flag(on),
  "data-unchecked": flag(!on),
})

/** A click the keyboard made (Enter, Space, the menu's own press of the highlighted row). */
const byKeyboard = (event: Event) => (event as MouseEvent).detail === 0

/**
 * A menu: a button that opens a list of actions. Given the menu it is inside (`around.parent`),
 * it is a submenu, and its trigger is an item of that menu.
 */
export function createMenu(
  props: ReadonlySignal<MenuProps>,
  around: { parent?: Menu | undefined } & DirectionAround = {}
): Menu {
  const parent = around.parent?.link
  const id = props.peek().id
  const popupId = `${id}-popup`
  const triggerId = `${id}-trigger`
  const open = bindable({
    value: () => props.get().open,
    defaultValue: props.peek().defaultOpen ?? false,
    onChange: (next, by) => props.peek().onOpenChange?.(next, by),
  })
  const disabled = computed(() => Boolean(props.get().disabled))
  // A submenu opens beside its trigger, on the side the text runs to.
  const beside = signal<"left" | "right">("right")
  const placement = createPlacement(
    parent ? () => ({ side: beside.get(), align: "start" }) : { align: "start" }
  )
  const layer = createPopup({
    open,
    setOpen,
    kind: "menu",
    // The menu moves focus itself, to the row it was opened for; the popup gives it back.
    focus: popupFocus("none"),
    placement,
  })
  const list = createList({ selector: ROWS, loop: () => props.peek().loop ?? true })
  const way = createSafeArea()

  let trigger: HTMLElement | undefined
  let popup: HTMLElement | undefined
  let entry: Entry = "popup"
  let opening: ReturnType<typeof setTimeout> | undefined
  // Where the pointer last was on a submenu's trigger.
  let rested: [number, number] | undefined

  function setOpen(next: boolean, by: ChangeDetails) {
    if (next && disabled.peek()) return
    open.set(next, by)
  }

  function openFor(where: Entry, by: ChangeDetails) {
    clearTimeout(opening)
    opening = undefined
    if (open.peek()) {
      // Open already (by hovering): the key still takes focus in.
      if (where !== "stay") enter(where)
      return
    }
    entry = where
    setOpen(true, by)
  }

  function enter(where: Entry) {
    if (where === "stay") return
    if (where !== "popup") {
      list.highlight(undefined)
      list.move(where)
      if (list.highlighted.peek()) return
    }
    list.highlight(undefined, true)
  }

  const link: MenuLink = {
    list,
    open,
    onTheWay: undefined,
    closeAll(by) {
      // The innermost first: each gives focus back to the row it was opened from.
      setOpen(false, by)
      if (!by.canceled) parent?.closeAll(by)
    },
  }

  /** Whether a pointer move over one of this menu's rows is a pointer going to its submenu. */
  const passing = (event: PointerEvent) =>
    event.pointerType === "touch" || Boolean(link.onTheWay?.(event))

  /** Whether an event the popup hears is from one of its own rows, not a menu inside it. */
  const own = (event: Event) =>
    popup !== undefined && (event.target as Element).closest?.('[role="menu"]') === popup

  /** What every kind of item shares: a row of the list that takes the highlight and a press. */
  function rowPart(
    role: string,
    options: () => MenuItemOptions,
    closes: boolean,
    extra: () => PartProps,
    press: (event: Event) => void
  ): Part {
    const row = list.row(options)
    return {
      props: computed(() => {
        const off = Boolean(options().disabled)
        return {
          role,
          tabindex: "-1",
          "aria-disabled": off ? "true" : undefined,
          ...extra(),
          "data-highlighted": flag(row.active.get()),
          "data-disabled": flag(off),
          onPointerMove(event: PointerEvent) {
            if (off || row.active.peek() || passing(event)) return
            list.highlight(row, true)
          },
          onPointerLeave(event: PointerEvent) {
            // Off every row, the menu itself has focus: the keys still work from there.
            if (row.active.peek() && !passing(event)) list.highlight(undefined, true)
          },
          onClick(event: Event) {
            if (options().disabled) return
            press(event)
            if (options().closeOnClick ?? closes) link.closeAll(details("item-press", event))
          },
        }
      }),
      attach: (element) => row.attach(element),
    }
  }

  // A submenu's trigger is a row of the menu around it.
  const triggerRow: ListRow | undefined = parent?.list.row(() => ({ disabled: disabled.peek() }))

  const rootTrigger = (): PartProps => ({
    type: "button",
    id: triggerId,
    "aria-haspopup": "menu",
    ...layer.expanded(popupId),
    disabled: flag(disabled.get()),
    "data-disabled": flag(disabled.get()),
    onClick(event: Event) {
      if (open.peek()) setOpen(false, details("trigger-press", event))
      // From the keyboard, the first item takes focus; from a pointer, the menu itself.
      else openFor(byKeyboard(event) ? "first" : "popup", details("trigger-press", event))
    },
    onKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
      event.preventDefault()
      openFor(event.key === "ArrowDown" ? "first" : "last", details("trigger-press", event))
    },
  })

  const forward = (element: Element) =>
    directionOf(element, around.direction) === "rtl" ? "ArrowLeft" : "ArrowRight"

  const subTrigger = (row: ListRow, within: MenuLink): PartProps => ({
    role: "menuitem",
    tabindex: "-1",
    id: triggerId,
    "aria-haspopup": "menu",
    ...layer.expanded(popupId),
    "aria-disabled": disabled.get() ? "true" : undefined,
    "data-highlighted": flag(row.active.get()),
    "data-disabled": flag(disabled.get()),
    onPointerMove(event: PointerEvent) {
      if (disabled.peek() || event.pointerType === "touch") return
      rested = [event.clientX, event.clientY]
      if (!row.active.peek()) {
        if (within.onTheWay?.(event)) return
        within.list.highlight(row, true)
      }
      if (open.peek() || opening) return
      opening = setTimeout(() => {
        opening = undefined
        // Focus stays on the trigger until the pointer or a key goes in.
        openFor("stay", details("trigger-hover", event))
      }, SUBMENU_DELAY)
    },
    onPointerLeave(event: PointerEvent) {
      clearTimeout(opening)
      opening = undefined
      // Open, the trigger keeps the highlight, and the pointer may be on its way to the popup:
      // from where it last was on the trigger, not from where it is by now.
      if (open.peek()) way.leave(...(rested ?? [event.clientX, event.clientY]))
      else if (row.active.peek() && !within.onTheWay?.(event))
        within.list.highlight(undefined, true)
    },
    onClick(event: Event) {
      if (disabled.peek()) return
      openFor(byKeyboard(event) ? "first" : "popup", details("trigger-press", event))
    },
    onKeyDown(event: KeyboardEvent) {
      if (disabled.peek() || event.key !== forward(event.currentTarget as Element)) return
      event.preventDefault()
      openFor("first", details("list-navigation", event))
    },
  })

  function radioGroup<Value>(
    groupProps: ReadonlySignal<MenuRadioGroupProps<Value>>
  ): MenuRadioGroup<Value> {
    // `undefined` means "not controlled", so "none" is `null`.
    const value = bindable<Value | null>({
      value: () => groupProps.get().value,
      defaultValue: groupProps.peek().defaultValue ?? null,
      onChange: (next, by) => groupProps.peek().onValueChange?.(next as Value, by),
    })
    const isChecked = keyed(value as ReadonlySignal<Value | null>)
    return {
      value,
      mount: () => () => isChecked.dispose(),
      checked: (item) => isChecked.is(item),
      root: {
        props: computed(() => ({
          role: "group",
          "data-disabled": flag(groupProps.get().disabled),
        })),
        attach: () => NOTHING,
      },
      item(item, options = () => ({})) {
        const on = isChecked.is(item)
        return rowPart(
          "menuitemradio",
          () => ({
            ...options(),
            disabled: Boolean(options().disabled) || Boolean(groupProps.get().disabled),
          }),
          false,
          () => ({ "aria-checked": String(on.get()), ...checkedState(on.get()) }),
          (event) => value.set(item, details("item-press", event))
        )
      },
      indicator(item) {
        const on = isChecked.is(item)
        return {
          props: computed(() => ({ "aria-hidden": "true", ...checkedState(on.get()) })),
          attach: () => NOTHING,
        }
      },
    }
  }

  return {
    open,
    mounted: layer.mounted,
    setOpen,
    positioning: placement.positioning,
    link,
    mount() {
      const stops = [layer.start()]
      if (parent && triggerRow) {
        stops.push(
          // A submenu is open only while its menu is, and while its trigger has the highlight.
          effect(() => {
            const stays = parent.open.get() && parent.list.highlighted.get() === triggerRow
            if (stays) return
            untracked(() => {
              clearTimeout(opening)
              opening = undefined
              if (open.peek()) setOpen(false, details("focus-out"))
            })
          }),
          effect(() => {
            if (!open.get()) return
            // While it is open, the rows between its trigger and its popup let the pointer by.
            const guard = (event: PointerEvent) =>
              popup !== undefined &&
              way.holds(event.clientX, event.clientY, popup.getBoundingClientRect())
            parent.onTheWay = guard
            return () => {
              if (parent.onTheWay === guard) parent.onTheWay = undefined
              way.clear()
            }
          })
        )
      }
      return () => {
        clearTimeout(opening)
        for (const stop of stops.reverse()) stop()
      }
    },
    trigger: {
      props: computed(() =>
        parent && triggerRow ? subTrigger(triggerRow, parent) : rootTrigger()
      ),
      attach(element) {
        trigger = element
        const stops = [layer.attachTrigger(element)]
        if (triggerRow) {
          stops.push(triggerRow.attach(element))
          beside.set(directionOf(element, around.direction) === "rtl" ? "left" : "right")
        }
        return () => {
          for (const stop of stops.reverse()) stop()
          if (trigger === element) trigger = undefined
        }
      },
    },
    positioner: layer.positioner,
    arrow: layer.arrow,
    popup: {
      props: computed(() => ({
        id: popupId,
        role: "menu",
        tabindex: "-1",
        "aria-labelledby": triggerId,
        ...layer.state(),
        ...layer.placed(),
        onPointerEnter: () => way.clear(),
        onKeyDown(event: KeyboardEvent) {
          // React hands a key pressed in a submenu to the menu it was drawn inside as well.
          if (!own(event)) return
          switch (event.key) {
            case "Enter":
            case " ":
              event.preventDefault()
              // The row's own press: what a caller's handler on it hears too.
              return list.highlighted.peek()?.element()?.click()
            case "Tab":
              // The menu is one stop: Tab leaves it, and the trigger takes focus back.
              event.preventDefault()
              return link.closeAll(details("focus-out", event))
            case "ArrowLeft":
            case "ArrowRight":
              // Back out of a submenu, to its trigger.
              if (parent && event.key !== forward(event.currentTarget as Element)) {
                event.preventDefault()
                setOpen(false, details("list-navigation", event))
              }
              return
          }
          list.key(event)
        },
      })),
      attach(element) {
        popup = element
        const stops = [
          list.attach(element),
          layer.attach(element),
          effect(() => {
            if (!open.get()) return untracked(() => list.highlight(undefined))
            // The items attach around the menu, in an order each framework chooses: once all
            // have, focus goes where the menu was opened for. Unless it closed in the meantime.
            const where = entry
            entry = "popup"
            queueMicrotask(() => {
              if (popup === element && open.peek()) enter(where)
            })
          }),
        ]
        return () => {
          for (const stop of stops.reverse()) stop()
          if (popup === element) popup = undefined
        }
      },
    },
    item: (options = () => ({})) =>
      rowPart(
        "menuitem",
        options,
        true,
        () => ({}),
        () => {}
      ),
    label: LABEL,
    separator: SEPARATOR,
    group(groupId) {
      const labelled = signal(false)
      const labelId = `${groupId}-label`
      return {
        root: {
          props: computed(() => ({
            id: groupId,
            role: "group",
            "aria-labelledby": labelled.get() ? labelId : undefined,
          })),
          attach: () => NOTHING,
        },
        label: {
          props: computed(() => ({ id: labelId, role: "presentation" })),
          attach() {
            labelled.set(true)
            return () => labelled.set(false)
          },
        },
      }
    },
    checkboxItem(itemProps) {
      const checked = bindable({
        value: () => itemProps.get().checked,
        defaultValue: itemProps.peek().defaultChecked ?? false,
        onChange: (next, by) => itemProps.peek().onCheckedChange?.(next, by),
      })
      return {
        checked,
        mount: () => NOTHING,
        part: rowPart(
          "menuitemcheckbox",
          () => itemProps.get(),
          false,
          () => ({ "aria-checked": String(checked.get()), ...checkedState(checked.get()) }),
          (event) => checked.set(!checked.peek(), details("item-press", event))
        ),
        indicator: {
          props: computed(() => ({ "aria-hidden": "true", ...checkedState(checked.get()) })),
          attach: () => NOTHING,
        },
      }
    },
    radioGroup,
  }
}

import type { ReadonlySignal } from "@kirana-ui/core"
import { createMenu } from "@kirana-ui/core/menu"
import type {
  Menu,
  MenuAround,
  MenuCheckboxItem,
  MenuCheckboxItemProps,
  MenuGroup,
  MenuProps,
  MenuRadioGroup,
  MenuRadioGroupProps,
} from "@kirana-ui/core/menu"

import { once, positioner, valueOf } from "./around.ts"
import type { Placed } from "./around.ts"
import { defineElement, hostAround, partAround, partProps } from "./runtime.ts"
import type { Drawn, ElementOf, Told } from "./runtime.ts"

const MENUS = ["kui-menu", "kui-context-menu"]

/**
 * An item's own options: `kui-disabled`, `kui-label`, `kui-close-on-select="false"`.
 */
const options = (element: HTMLElement) => () => ({
  ...(element.hasAttribute("kui-disabled") ? { disabled: true } : {}),
  ...(element.hasAttribute("kui-label") ? { label: element.getAttribute("kui-label")! } : {}),
  ...(element.hasAttribute("kui-close-on-select")
    ? { closeOnSelect: element.getAttribute("kui-close-on-select") !== "false" }
    : {}),
  ...(element.hasAttribute("kui-close-on-click")
    ? { closeOnClick: element.getAttribute("kui-close-on-click") !== "false" }
    : {}),
})

interface Made<Controller> {
  controller: Controller
  mount(): () => void
}
const groups = new WeakMap<HTMLElement, MenuGroup>()
const boxes = new WeakMap<HTMLElement, Made<MenuCheckboxItem>>()
const radios = new WeakMap<HTMLElement, Made<MenuRadioGroup<string>>>()
let made = 0

const ITEM = {
  disabled: "boolean",
  label: "string",
  "close-on-select": "boolean",
  "close-on-click": "boolean",
} as const

const boxOf = (menu: Menu, element: HTMLElement | null) =>
  once(boxes, element, (item) => {
    const { props, mount } = partProps<MenuCheckboxItemProps>(
      item,
      { ...ITEM, checked: "boolean", "default-checked": "boolean" },
      { onCheckedChange: { event: "checked-change", prop: "checked" } }
    )
    const controller = menu.checkboxItem(props)
    return { controller, mount: both(mount, () => controller.mount()) }
  })

const radioOf = (menu: Menu, element: HTMLElement | null) =>
  once(radios, element, (group) => {
    const { props, mount } = partProps<MenuRadioGroupProps<string>>(
      group,
      { value: "string", "default-value": "string", disabled: "boolean" },
      { onValueChange: { event: "value-change", prop: "value" } }
    )
    const controller = menu.radioGroup<string>(props)
    return { controller, mount: both(mount, () => controller.mount()) }
  })

const both = (one: () => () => void, other: () => () => void) => () => {
  const stops = [one(), other()]
  return () => stops.forEach((stop) => stop())
}

type Parts = Record<
  string,
  (controller: Menu, element: HTMLElement) => Drawn["part"] | Drawn | undefined
>

/** A menu's parts but for its trigger, which a context menu has as an area. */
const PARTS: Parts = {
  positioner,
  popup: (controller) => controller.popup,
  arrow: (controller) => controller.arrow,
  separator: (controller) => controller.separator,
  item: (controller, element) => controller.item(options(element)),
  group: (controller, element) =>
    once(groups, element, (group) =>
      controller.group(group.getAttribute("kui-id") ?? `kui-menu-group-${++made}`)
    )?.root,
  // With no group around it, it is plain text.
  "group-label": (controller, element) =>
    groups.get(partAround(element, "group")!)?.label ?? controller.label,
  "checkbox-item"(controller, element) {
    const box = boxOf(controller, element)!
    return { part: box.controller.part, mount: box.mount }
  },
  "checkbox-item-indicator"(controller, element) {
    const box = boxOf(controller, partAround(element, "checkbox-item"))
    // In the page while checked, and through its exit.
    const mark = box?.controller.indicator
    return mark && { part: mark, mounted: mark.mounted, mount: mark.mount }
  },
  "radio-group"(controller, element) {
    const group = radioOf(controller, element)!
    return { part: group.controller.root, mount: group.mount }
  },
  "radio-item"(controller, element) {
    const group = radioOf(controller, partAround(element, "radio-group"))
    return group?.controller.item(valueOf(element), options(element))
  },
  "radio-item-indicator"(controller, element) {
    const group = radioOf(controller, partAround(element, "radio-group"))?.controller
    const value = valueOf(partAround(element, "radio-item"))
    // In the page while chosen, and through its exit.
    const mark = group?.indicator(value)
    return mark && { part: mark, mounted: mark.mounted, mount: mark.mount }
  },
}

const PROPS = {
  open: "boolean",
  "default-open": "boolean",
  disabled: "boolean",
  "loop-focus": "boolean",
  loop: "boolean",
  modal: "boolean",
} as const

const menu = (
  tag: string,
  around: (host: HTMLElement) => MenuAround,
  trigger: (controller: Menu) => Drawn["part"]
) =>
  defineElement<MenuProps, Menu>({
    tag,
    props: PROPS,
    create: (props: ReadonlySignal<MenuProps>, host) => createMenu(props, around(host)),
    changes: { onOpenChange: { event: "open-change", prop: "open" } },
    parts: { ...PARTS, trigger },
  })

/**
 * `<kui-menu>` around a `kui-part="trigger"` and a `portal` with a `positioner` (its
 * `kui-side` and the like) around the `popup`, which holds its `item`s (`kui-disabled`,
 * `kui-label`, `kui-close-on-select="false"`), `separator`s, `group`s with a `group-label`,
 * `checkbox-item`s (`kui-checked`, `kui-default-checked`; it tells `checked-change`) with a
 * `checkbox-item-indicator`, and a `radio-group` (`kui-value`, `kui-default-value`; it tells
 * `value-change`) of `radio-item`s (`kui-value`) with a `radio-item-indicator`. A `<kui-menu>`
 * inside a menu is its submenu, its trigger an item of the menu; inside a `<kui-menubar>`, one
 * of the bar's. `open`, `default-open`, `disabled`, `loop-focus`, `modal`; it tells `open-change`.
 */
export const tag = menu(
  "kui-menu",
  (host) => {
    // The nearest: a menu written inside a bar's menu is that menu's, not the bar's.
    const around = hostAround(host, [...MENUS, "kui-menubar"])
    return around?.tag === "kui-menubar"
      ? { menubar: around.controller as NonNullable<MenuAround["menubar"]> }
      : around
        ? { parent: around.controller as Menu }
        : {}
  },
  (controller) => controller.trigger
)

export { menu as defineMenu }

declare global {
  interface HTMLElementTagNameMap {
    "kui-menu": ElementOf<
      typeof tag,
      { "open-change": ["onOpenChange", "open"] },
      { "checked-change": Told<"checked", boolean>; "value-change": Told<"value", string> }
    > &
      Placed
  }
}

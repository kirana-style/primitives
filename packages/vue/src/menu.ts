import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createMenu } from "@kirana-ui/core/menu"
import type {
  Menu as Controller,
  MenuCheckboxItem,
  MenuCheckboxItemProps,
  MenuGroup,
  MenuItemOptions,
  MenuProps,
  MenuRadioGroup,
  MenuRadioGroupProps,
} from "@kirana-ui/core/menu"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType, PublicProps } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { MENUBAR } from "./menubar-context.ts"
import { positionerComponent } from "./popover.ts"
import {
  context,
  controller,
  fromSignal,
  optional,
  partComponent,
  portalComponent,
  toSignal,
} from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PartGiven,
  PartInstance,
  PlainComponent,
  StatesOf,
} from "./runtime.ts"

export type { PositionerProps } from "./popover.ts"
export type { PortalProps } from "./runtime.ts"

type State = StatesOf<"menu">

const scope = context<Controller>("Menu")
const GROUP: InjectionKey<MenuGroup | null> = Symbol("MenuGroup")
const CHECKBOX: InjectionKey<MenuCheckboxItem> = Symbol("MenuCheckboxItem")
const RADIO_GROUP: InjectionKey<MenuRadioGroup> = Symbol("MenuRadioGroup")
const RADIO_ITEM: InjectionKey<unknown> = Symbol("MenuRadioItem")
const ANY = null as unknown as PropType<unknown>

function inside<T>(key: InjectionKey<T>, parent: string): T {
  const found = inject(key, undefined)
  if (!found) throw new Error(`A Menu part must be inside <Menu.${parent}>`)
  return found
}

export type RootProps = Omit<MenuProps, "id" | "onOpenChange"> & { id?: string | undefined }
export type SubmenuRootProps = RootProps
export type ContextRootProps = RootProps

export type RootEmits = Changes<"open", boolean>
export type SubmenuRootEmits = RootEmits

/** `v-model:open`; `@open-change` carries the details. */
function root(name: string, kind: "menu" | "submenu" | "context") {
  return defineComponent({
    name,
    props: {
      open: optional(Boolean),
      defaultOpen: Boolean,
      disabled: Boolean,
      loop: optional(Boolean),
      modal: Boolean,
      id: String,
    },
    emits: ["update:open", "openChange"],
    setup(props, { slots, emit }) {
      const generated = useId()
      const parent = kind === "submenu" ? scope.use() : undefined
      const direction = useDirectionAround()
      const menubar = kind === "menu" ? (inject(MENUBAR, null) ?? undefined) : undefined
      const around = { parent, direction, menubar, context: kind === "context" }
      scope.provide(
        controller(within(createMenu, around), () => ({
          id: props.id ?? generated,
          open: props.open,
          defaultOpen: props.defaultOpen,
          disabled: props.disabled,
          loop: props.loop,
          modal: props.modal,
          onOpenChange(open: boolean, details: ChangeDetails) {
            emit("openChange", open, details)
            if (!details.canceled) emit("update:open", open)
          },
        }))
      )
      // A group around a submenu is not a group of the submenu's own items; nor is a menu
      // written inside a bar's menu one of the bar's.
      provide(GROUP, null)
      provide(MENUBAR, null)
      return () => slots.default?.()
    },
  }) as unknown as PlainComponent<RootProps, RootEmits>
}

const ITEM_PROPS = {
  disabled: optional(Boolean),
  label: String,
  closeOnSelect: optional(Boolean),
  closeOnClick: optional(Boolean),
}

export interface ItemProps extends MenuItemOptions, PartComponentProps {}

const Item = defineComponent({
  name: "MenuItem",
  inheritAttrs: false,
  props: ITEM_PROPS,
  setup(props, { attrs, slots }) {
    const options = toSignal(() => ({ ...props }))
    const part = scope.use().item(() => defined(options.get()))
    const Element = partComponent("MenuItemElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["item"], ItemProps>

export type LinkItemProps = ItemProps

/** An item that is a link: `href` and the rest go to its `<a>`. */
const LinkItem = defineComponent({
  name: "MenuLinkItem",
  inheritAttrs: false,
  props: ITEM_PROPS,
  setup(props, { attrs, slots }) {
    const options = toSignal(() => ({ ...props }))
    const part = scope.use().item(() => defined(options.get()))
    const Element = partComponent("MenuLinkItemElement", "a", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"a", State["linkItem"], LinkItemProps>

export interface GroupProps extends PartComponentProps {
  id?: string | undefined
}

const Group = defineComponent({
  name: "MenuGroup",
  inheritAttrs: false,
  props: { id: String },
  setup(props, { attrs, slots }) {
    const generated = useId()
    const group = scope.use().group(props.id ?? generated)
    provide(GROUP, group)
    const Element = partComponent("MenuGroupElement", "div", () => group.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["group"], GroupProps>

/** Names the group it is in. With no group around it, it is plain text. */
const GroupLabel = partComponent<"div", State["groupLabel"]>(
  "MenuGroupLabel",
  "div",
  () => inject(GROUP, null)?.label ?? scope.use().label
)

export type CheckboxItemProps = Omit<MenuCheckboxItemProps, "onCheckedChange"> & PartComponentProps

export type CheckboxItemEmits = Changes<"checked", boolean>

/** `v-model:checked`; `@checked-change` carries the details. */
const CheckboxItem = defineComponent({
  name: "MenuCheckboxItem",
  inheritAttrs: false,
  props: { ...ITEM_PROPS, checked: optional(Boolean), defaultChecked: Boolean },
  emits: ["update:checked", "checkedChange"],
  setup(props, { attrs, slots, emit }) {
    const item = controller(scope.use().checkboxItem, () => ({
      checked: props.checked,
      defaultChecked: props.defaultChecked,
      disabled: props.disabled,
      label: props.label,
      closeOnSelect: props.closeOnSelect,
      closeOnClick: props.closeOnClick,
      onCheckedChange(checked: boolean, details: ChangeDetails) {
        emit("checkedChange", checked, details)
        if (!details.canceled) emit("update:checked", checked)
      },
    }))
    provide(CHECKBOX, item)
    const Element = partComponent("MenuCheckboxItemElement", "div", () => item.part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["checkboxItem"], CheckboxItemProps, CheckboxItemEmits>

export interface CheckboxItemIndicatorProps extends PartComponentProps {
  /** Keeps the mark in the page while the item is unchecked. */
  keepMounted?: boolean | undefined
}

const CheckboxItemIndicator = defineComponent({
  name: "MenuCheckboxItemIndicator",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const item = inside(CHECKBOX, "CheckboxItem")
    const checked = fromSignal(item.checked)
    const Element = partComponent("MenuCheckboxItemIndicatorElement", "span", () => item.indicator)
    return () => (checked.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
}) as unknown as PartComponent<"span", State["checkboxItemIndicator"], CheckboxItemIndicatorProps>

export type RadioGroupProps<Value = unknown> = Omit<MenuRadioGroupProps<Value>, "onValueChange"> &
  PartComponentProps

export type RadioGroupEmits<Value = unknown> = Changes<"value", Value>

/** `v-model:value`; `@value-change` carries the details. */
const RadioGroup = defineComponent({
  name: "MenuRadioGroup",
  inheritAttrs: false,
  props: {
    value: { type: ANY, default: undefined as unknown },
    defaultValue: { type: ANY, default: null as unknown },
    disabled: Boolean,
  },
  emits: ["update:value", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const group = controller(scope.use().radioGroup<unknown>, () => ({
      value: props.value,
      defaultValue: props.defaultValue,
      disabled: props.disabled,
      onValueChange(value: unknown, details: ChangeDetails) {
        emit("valueChange", value, details)
        if (!details.canceled) emit("update:value", value)
      },
    }))
    provide(RADIO_GROUP, group)
    const Element = partComponent("MenuRadioGroupElement", "div", () => group.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as new <Value = unknown, As extends string = "div">(
  props: PartGiven<As, RadioGroupProps<Value>, RadioGroupEmits<Value>> & PublicProps
) => PartInstance<
  As,
  RadioGroupProps<Value>,
  RadioGroupEmits<Value>,
  { state: State["radioGroup"] }
>

export interface RadioItemProps extends MenuItemOptions, PartComponentProps {
  /** What the group's value is while this item is the chosen one. */
  value: unknown
}

const RadioItem = defineComponent({
  name: "MenuRadioItem",
  inheritAttrs: false,
  props: { ...ITEM_PROPS, value: { type: ANY, required: true } },
  setup(props, { attrs, slots }) {
    // An item is its value for as long as it is in the page.
    const value = props.value
    const options = toSignal(() => ({
      disabled: props.disabled,
      label: props.label,
      closeOnSelect: props.closeOnSelect,
      closeOnClick: props.closeOnClick,
    }))
    const part = inside(RADIO_GROUP, "RadioGroup").item(value, () => defined(options.get()))
    provide(RADIO_ITEM, value)
    const Element = partComponent("MenuRadioItemElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["radioItem"], RadioItemProps>

export interface RadioItemIndicatorProps extends PartComponentProps {
  /** Keeps the mark in the page while its item is not the chosen one. */
  keepMounted?: boolean | undefined
}

const RadioItemIndicator = defineComponent({
  name: "MenuRadioItemIndicator",
  inheritAttrs: false,
  props: { keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const group = inside(RADIO_GROUP, "RadioGroup")
    const value = inject(RADIO_ITEM)
    const checked = fromSignal(group.checked(value))
    const Element = partComponent("MenuRadioItemIndicatorElement", "span", () =>
      group.indicator(value)
    )
    return () => (checked.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
}) as unknown as PartComponent<"span", State["radioItemIndicator"], RadioItemIndicatorProps>

export type TriggerProps = PartComponentProps
export type PopupProps = PartComponentProps
export type ArrowProps = PartComponentProps
export type GroupLabelProps = PartComponentProps
export type SeparatorProps = PartComponentProps
export type SubmenuTriggerProps = PartComponentProps
export type ContextTriggerProps = PartComponentProps
export const Menu = {
  Root: root("MenuRoot", "menu"),
  Trigger: partComponent<"button", State["trigger"]>(
    "MenuTrigger",
    "button",
    () => scope.use().trigger
  ),
  Portal: portalComponent("MenuPortal", () => scope.use().mounted),
  Positioner: positionerComponent<State["positioner"]>(
    "MenuPositioner",
    () => scope.use(),
    partComponent("MenuPositionerElement", "div", () => scope.use().positioner)
  ),
  Popup: partComponent<"div", State["popup"]>("MenuPopup", "div", () => scope.use().popup),
  Arrow: partComponent<"div", State["arrow"]>("MenuArrow", "div", () => scope.use().arrow),
  Item,
  LinkItem,
  Group,
  GroupLabel,
  Separator: partComponent<"div", State["separator"]>(
    "MenuSeparator",
    "div",
    () => scope.use().separator
  ),
  CheckboxItem,
  CheckboxItemIndicator,
  RadioGroup,
  RadioItem,
  RadioItemIndicator,
  /** A menu that one of this menu's items opens. Its trigger is `Menu.SubmenuTrigger`. */
  SubmenuRoot: root("MenuSubmenuRoot", "submenu"),
  SubmenuTrigger: partComponent<"div", State["submenuTrigger"]>(
    "MenuSubmenuTrigger",
    "div",
    () => scope.use().trigger
  ),
}

export const ContextMenu = {
  ...Menu,
  /** A menu for an area of the page, opened at the pointer. Its trigger is the area. */
  Root: root("ContextMenuRoot", "context"),
  /** The area a secondary press, or a long press on a touch screen, opens the menu in. */
  Trigger: partComponent<"div", StatesOf<"contextMenu">["trigger"]>(
    "ContextMenuTrigger",
    "div",
    () => scope.use().area
  ),
}

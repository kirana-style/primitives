import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createMenu } from "@kirana-ui/core/menu"
import type {
  Menu as Controller,
  MenuCheckboxItem,
  MenuGroup,
  MenuRadioGroup,
} from "@kirana-ui/core/menu"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
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

/** `v-model:open`; `@open-change` carries the details. */
function root(name: string, sub: boolean) {
  return defineComponent({
    name,
    props: {
      open: optional(Boolean),
      defaultOpen: Boolean,
      disabled: Boolean,
      loop: optional(Boolean),
      id: String,
    },
    emits: ["update:open", "openChange"],
    setup(props, { slots, emit }) {
      const generated = useId()
      const parent = sub ? scope.use() : undefined
      const direction = useDirectionAround()
      scope.provide(
        controller(within(createMenu, { parent, direction }), () => ({
          id: props.id ?? generated,
          open: props.open,
          defaultOpen: props.defaultOpen,
          disabled: props.disabled,
          loop: props.loop,
          onOpenChange(open: boolean, details: ChangeDetails) {
            emit("openChange", open, details)
            if (!details.canceled) emit("update:open", open)
          },
        }))
      )
      // A group around a submenu is not a group of the submenu's own items.
      provide(GROUP, null)
      return () => slots.default?.()
    },
  })
}

const ITEM_PROPS = {
  disabled: optional(Boolean),
  label: String,
  closeOnClick: optional(Boolean),
}

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
})

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
})

/** Names the group it is in. With no group around it, it is plain text. */
const GroupLabel = partComponent(
  "MenuGroupLabel",
  "div",
  () => inject(GROUP, null)?.label ?? scope.use().label
)

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
})

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
})

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
})

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
      closeOnClick: props.closeOnClick,
    }))
    const part = inside(RADIO_GROUP, "RadioGroup").item(value, () => defined(options.get()))
    provide(RADIO_ITEM, value)
    const Element = partComponent("MenuRadioItemElement", "div", () => part)
    return () => h(Element, attrs, slots)
  },
})

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
})

export const Menu = {
  Root: root("MenuRoot", false),
  Trigger: partComponent("MenuTrigger", "button", () => scope.use().trigger),
  Portal: portalComponent("MenuPortal", () => scope.use().mounted),
  Positioner: positionerComponent(
    "MenuPositioner",
    () => scope.use(),
    partComponent("MenuPositionerElement", "div", () => scope.use().positioner)
  ),
  Popup: partComponent("MenuPopup", "div", () => scope.use().popup),
  Arrow: partComponent("MenuArrow", "div", () => scope.use().arrow),
  Item,
  Group,
  GroupLabel,
  Separator: partComponent("MenuSeparator", "div", () => scope.use().separator),
  CheckboxItem,
  CheckboxItemIndicator,
  RadioGroup,
  RadioItem,
  RadioItemIndicator,
  /** A menu that one of this menu's items opens. Its trigger is `Menu.SubmenuTrigger`. */
  SubmenuRoot: root("MenuSubmenuRoot", true),
  SubmenuTrigger: partComponent("MenuSubmenuTrigger", "div", () => scope.use().trigger),
}

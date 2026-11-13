import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createMenu } from "@kirana-ui/core/menu"
import type {
  Menu as Controller,
  MenuCheckboxItem,
  MenuGroup,
  MenuRadioGroup,
} from "@kirana-ui/core/menu"
import { Show, createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { positioned } from "./popover.tsx"
import type { PositionerProps } from "./popover.tsx"
import { Part, Portal as BodyPortal, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
const GroupContext = createContext<MenuGroup | null>(null)
const CheckboxContext = createContext<MenuCheckboxItem>()
const RadioGroupContext = createContext<MenuRadioGroup>()
const RadioItemContext = createContext<unknown>()

function useMenu(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Menu part must be inside <Menu.Root>")
  return made
}

function inside<T>(found: T | undefined, parent: string): T {
  if (!found) throw new Error(`A Menu part must be inside <Menu.${parent}>`)
  return found
}

export type RootProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ChangeDetails) => void
  disabled?: boolean
  loop?: boolean
  id?: string
  children?: JSX.Element
}

function make(props: RootProps, parent: Controller | undefined): JSX.Element {
  const generated = createUniqueId()
  const direction = useContext(DirectionContext)
  const made = controller(within(createMenu, { parent, direction }), () => ({
    id: props.id ?? generated,
    open: props.open,
    defaultOpen: props.defaultOpen,
    disabled: props.disabled,
    loop: props.loop,
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  return (
    <Context.Provider value={made}>
      {/* A group around a submenu is not a group of the submenu's own items. */}
      <GroupContext.Provider value={null}>{props.children}</GroupContext.Provider>
    </Context.Provider>
  )
}

const Root = (props: RootProps) => make(props, undefined)
/** A menu that one of this menu's items opens. Its trigger is `<Menu.SubmenuTrigger>`. */
const SubmenuRoot = (props: RootProps) => make(props, useMenu())

const Portal = (props: { children?: JSX.Element }) => (
  <BodyPortal mounted={useMenu().mounted}>{props.children}</BodyPortal>
)

function Positioner(props: PositionerProps): JSX.Element {
  const made = useMenu()
  return <Part part={made.positioner} tag="div" {...positioned(props, made.positioning)} />
}

type ItemOptions = { disabled?: boolean; label?: string; closeOnClick?: boolean }
const ITEM = ["disabled", "label", "closeOnClick"] as const

function Item(props: PartComponentProps & ItemOptions): JSX.Element {
  const [local, rest] = splitProps(props, ITEM)
  const options = toSignal(() => ({ ...local }))
  const part = useMenu().item(() => defined(options.get()))
  return <Part part={part} tag="div" {...rest} />
}

function Group(props: PartComponentProps & { id?: string }): JSX.Element {
  const [local, rest] = splitProps(props, ["id"])
  const generated = createUniqueId()
  const group = useMenu().group(untrack(() => local.id) ?? generated)
  return (
    <GroupContext.Provider value={group}>
      <Part part={group.root} tag="div" {...rest} />
    </GroupContext.Provider>
  )
}

/** Names the group it is in. With no group around it, it is plain text. */
const GroupLabel = (props: PartComponentProps) => (
  <Part part={useContext(GroupContext)?.label ?? useMenu().label} tag="div" {...props} />
)

function CheckboxItem(
  props: PartComponentProps &
    ItemOptions & {
      checked?: boolean
      defaultChecked?: boolean
      onCheckedChange?: (checked: boolean, details: ChangeDetails) => void
    }
): JSX.Element {
  const [local, rest] = splitProps(props, [...ITEM, "checked", "defaultChecked", "onCheckedChange"])
  const item = controller(useMenu().checkboxItem, () => ({
    checked: local.checked,
    defaultChecked: local.defaultChecked,
    disabled: local.disabled,
    label: local.label,
    closeOnClick: local.closeOnClick,
    onCheckedChange: (checked: boolean, details: ChangeDetails) =>
      local.onCheckedChange?.(checked, details),
  }))
  return (
    <CheckboxContext.Provider value={item}>
      <Part part={item.part} tag="div" {...rest} />
    </CheckboxContext.Provider>
  )
}

type IndicatorProps = PartComponentProps & { keepMounted?: boolean }

function CheckboxItemIndicator(props: IndicatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const item = inside(useContext(CheckboxContext), "CheckboxItem")
  const checked = fromSignal(item.checked)
  return (
    <Show when={checked() || local.keepMounted}>
      <Part part={item.indicator} tag="span" {...rest} />
    </Show>
  )
}

function RadioGroup(
  props: PartComponentProps & {
    value?: unknown
    defaultValue?: unknown
    onValueChange?: (value: unknown, details: ChangeDetails) => void
    disabled?: boolean
  }
): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "defaultValue", "onValueChange", "disabled"])
  const group = controller(useMenu().radioGroup<unknown>, () => ({
    value: local.value,
    defaultValue: local.defaultValue,
    disabled: local.disabled,
    onValueChange: (value: unknown, details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <RadioGroupContext.Provider value={group}>
      <Part part={group.root} tag="div" {...rest} />
    </RadioGroupContext.Provider>
  )
}

function RadioItem(props: PartComponentProps & ItemOptions & { value: unknown }): JSX.Element {
  const [local, rest] = splitProps(props, [...ITEM, "value"])
  // An item is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  const options = toSignal(() => ({
    disabled: local.disabled,
    label: local.label,
    closeOnClick: local.closeOnClick,
  }))
  const part = inside(useContext(RadioGroupContext), "RadioGroup").item(value, () =>
    defined(options.get())
  )
  return (
    <RadioItemContext.Provider value={value}>
      <Part part={part} tag="div" {...rest} />
    </RadioItemContext.Provider>
  )
}

function RadioItemIndicator(props: IndicatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const group = inside(useContext(RadioGroupContext), "RadioGroup")
  const value = useContext(RadioItemContext)
  const checked = fromSignal(group.checked(value))
  return (
    <Show when={checked() || local.keepMounted}>
      <Part part={group.indicator(value)} tag="span" {...rest} />
    </Show>
  )
}

const part =
  (name: "trigger" | "popup" | "arrow" | "separator", tag: string) =>
  (props: PartComponentProps) => <Part part={useMenu()[name]} tag={tag} {...props} />

export const Menu = {
  Root,
  Portal,
  Positioner,
  Trigger: part("trigger", "button"),
  Popup: part("popup", "div"),
  Arrow: part("arrow", "div"),
  Item,
  Group,
  GroupLabel,
  Separator: part("separator", "div"),
  CheckboxItem,
  CheckboxItemIndicator,
  RadioGroup,
  RadioItem,
  RadioItemIndicator,
  SubmenuRoot,
  SubmenuTrigger: part("trigger", "div"),
}

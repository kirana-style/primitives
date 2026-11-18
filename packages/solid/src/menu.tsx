import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createMenu } from "@kirana-ui/core/menu"
import type {
  Menu as Controller,
  MenuCheckboxItem,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioGroupProps,
} from "@kirana-ui/core/menu"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { MenubarContext } from "./menubar-context.ts"
import { positioned } from "./popover.tsx"
import type { PortalProps, PositionerOptions } from "./popover.tsx"
import { Part, Portal as BodyPortal, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["menu"]

export type { PortalProps }

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
  modal?: boolean
  id?: string
  children?: JSX.Element
}

function make(props: RootProps, kind: "menu" | "submenu" | "context"): JSX.Element {
  const generated = createUniqueId()
  const direction = useContext(DirectionContext)
  const parent = kind === "submenu" ? useMenu() : undefined
  const menubar = kind === "menu" ? (useContext(MenubarContext) ?? undefined) : undefined
  const around = { parent, direction, menubar, context: kind === "context" }
  const made = controller(within(createMenu, around), () => ({
    id: props.id ?? generated,
    open: props.open,
    defaultOpen: props.defaultOpen,
    disabled: props.disabled,
    loop: props.loop,
    modal: props.modal,
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  return (
    <Context.Provider value={made}>
      {/* A group around a submenu is not a group of the submenu's own items; nor is a menu
          written inside a bar's menu one of the bar's. */}
      <MenubarContext.Provider value={null}>
        <GroupContext.Provider value={null}>{props.children}</GroupContext.Provider>
      </MenubarContext.Provider>
    </Context.Provider>
  )
}

export type ContextRootProps = RootProps
export type SubmenuRootProps = RootProps

const Root = (props: RootProps) => make(props, "menu")
/** A menu for an area of the page, opened at the pointer. Its trigger is the area. */
const ContextRoot = (props: ContextRootProps) => make(props, "context")
/** A menu that one of this menu's items opens. Its trigger is `<Menu.SubmenuTrigger>`. */
const SubmenuRoot = (props: SubmenuRootProps) => make(props, "submenu")

const Portal = (props: PortalProps) => (
  <BodyPortal mounted={useMenu().mounted}>{props.children}</BodyPortal>
)

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>

function Positioner(props: PositionerProps): JSX.Element {
  const made = useMenu()
  return <Part of={made.positioner} tag="div" {...positioned(props, made.positioning)} />
}

type ItemOptions = { disabled?: boolean; label?: string; closeOnClick?: boolean }
const ITEM = ["disabled", "label", "closeOnClick"] as const

export type ItemProps = PartComponentProps<"div", StateOf<Parts["item"]>, ItemOptions>

function Item(props: ItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ITEM)
  const options = toSignal(() => ({ ...local }))
  const part = useMenu().item(() => defined(options.get()))
  return <Part of={part} tag="div" {...rest} />
}

export type LinkItemProps = PartComponentProps<"a", StateOf<Parts["linkItem"]>, ItemOptions>

/** An item that is a link: `href` and the rest go to its `<a>`. */
function LinkItem(props: LinkItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ITEM)
  const options = toSignal(() => ({ ...local }))
  const part = useMenu().item(() => defined(options.get()))
  return <Part of={part} tag="a" {...rest} />
}

export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, { id?: string }>

function Group(props: GroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["id"])
  const generated = createUniqueId()
  const group = useMenu().group(untrack(() => local.id) ?? generated)
  return (
    <GroupContext.Provider value={group}>
      <Part of={group.root} tag="div" {...rest} />
    </GroupContext.Provider>
  )
}

export type GroupLabelProps = PartComponentProps<"div", StateOf<Parts["groupLabel"]>>

/** Names the group it is in. With no group around it, it is plain text. */
const GroupLabel = (props: GroupLabelProps) => (
  <Part of={useContext(GroupContext)?.label ?? useMenu().label} tag="div" {...props} />
)

export type CheckboxItemProps = PartComponentProps<
  "div",
  StateOf<Parts["checkboxItem"]>,
  ItemOptions & {
    checked?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean, details: ChangeDetails) => void
  }
>

function CheckboxItem(props: CheckboxItemProps): JSX.Element {
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
      <Part of={item.part} tag="div" {...rest} />
    </CheckboxContext.Provider>
  )
}

export type CheckboxItemIndicatorProps = PartComponentProps<
  "span",
  StateOf<Parts["checkboxItemIndicator"]>,
  { keepMounted?: boolean }
>

function CheckboxItemIndicator(props: CheckboxItemIndicatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const item = inside(useContext(CheckboxContext), "CheckboxItem")
  const checked = fromSignal(item.checked)
  return (
    <Show when={checked() || local.keepMounted}>
      <Part of={item.indicator} tag="span" {...rest} />
    </Show>
  )
}

/** `Value` is what a radio item's `value` is: the group's `value` holds the chosen one. */
export type RadioGroupProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["radioGroup"]>,
  MenuRadioGroupProps<Value>
>

function RadioGroup<Value = unknown>(props: RadioGroupProps<Value>): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "defaultValue", "onValueChange", "disabled"])
  const group = controller(useMenu().radioGroup<Value>, () => ({
    value: local.value,
    defaultValue: local.defaultValue,
    disabled: local.disabled,
    onValueChange: (value: Value, details: ChangeDetails) => local.onValueChange?.(value, details),
  }))
  return (
    <RadioGroupContext.Provider value={group}>
      <Part of={group.root} tag="div" {...rest} />
    </RadioGroupContext.Provider>
  )
}

export type RadioItemProps = PartComponentProps<
  "div",
  StateOf<Parts["radioItem"]>,
  ItemOptions & { value: unknown }
>

function RadioItem(props: RadioItemProps): JSX.Element {
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
      <Part of={part} tag="div" {...rest} />
    </RadioItemContext.Provider>
  )
}

export type RadioItemIndicatorProps = PartComponentProps<
  "span",
  StateOf<Parts["radioItemIndicator"]>,
  { keepMounted?: boolean }
>

function RadioItemIndicator(props: RadioItemIndicatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const group = inside(useContext(RadioGroupContext), "RadioGroup")
  const value = useContext(RadioItemContext)
  const checked = fromSignal(group.checked(value))
  return (
    <Show when={checked() || local.keepMounted}>
      <Part of={group.indicator(value)} tag="span" {...rest} />
    </Show>
  )
}

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type ArrowProps = PartComponentProps<"div", StateOf<Parts["arrow"]>>
export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>
export type SubmenuTriggerProps = PartComponentProps<"div", StateOf<Parts["submenuTrigger"]>>
export type ContextTriggerProps = PartComponentProps<
  "div",
  StateOf<Vocabulary["contextMenu"]["trigger"]>
>

const part =
  <Props extends Record<string, unknown>>(
    name: "trigger" | "popup" | "arrow" | "separator" | "area",
    tag: string
  ) =>
  (props: Props): JSX.Element => <Part of={useMenu()[name]} tag={tag} {...props} />

export const Menu = {
  Root,
  Portal,
  Positioner,
  Trigger: part<TriggerProps>("trigger", "button"),
  Popup: part<PopupProps>("popup", "div"),
  Arrow: part<ArrowProps>("arrow", "div"),
  Item,
  LinkItem,
  Group,
  GroupLabel,
  Separator: part<SeparatorProps>("separator", "div"),
  CheckboxItem,
  CheckboxItemIndicator,
  RadioGroup,
  RadioItem,
  RadioItemIndicator,
  SubmenuRoot,
  SubmenuTrigger: part<SubmenuTriggerProps>("trigger", "div"),
}

export const ContextMenu = {
  ...Menu,
  Root: ContextRoot,
  /** The area a secondary press, or a long press on a touch screen, opens the menu in. */
  Trigger: part<ContextTriggerProps>("area", "div"),
}

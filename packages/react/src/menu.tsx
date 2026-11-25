import { defined, within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
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
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { MenubarContext } from "./menubar-context.ts"
import {
  Portal as BodyPortal,
  PartElement,
  parts,
  useController,
  useOptions,
  usePart,
  usePositioning,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps, PortalProps, PositionerOptions } from "./runtime.tsx"

export type { PortalProps }

type Parts = Vocabulary["menu"]

const Context = createContext<Controller | null>(null)
const GroupContext = createContext<MenuGroup | null>(null)
const CheckboxContext = createContext<MenuCheckboxItem | null>(null)
const RadioGroupContext = createContext<MenuRadioGroup | null>(null)
const RadioItemContext = createContext<unknown>(undefined)

function useMenu(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Menu.${part}> must be inside <Menu.Root>`)
  return controller
}

function inside<T>(context: React.Context<T | null>, part: string, parent: string): T {
  const found = useContext(context)
  if (!found) throw new Error(`<Menu.${part}> must be inside <Menu.${parent}>`)
  return found
}

export type RootProps = Omit<MenuProps, "id"> & { id?: string; children?: ReactNode }
export type SubmenuRootProps = RootProps

function provided(controller: Controller, children: ReactNode): ReactElement {
  return (
    <Context.Provider value={controller}>
      {/* A group around a submenu is not a group of the submenu's own items; nor is a menu
          written inside a bar's menu one of the bar's. */}
      <MenubarContext.Provider value={null}>
        <GroupContext.Provider value={null}>{children}</GroupContext.Provider>
      </MenubarContext.Provider>
    </Context.Provider>
  )
}

function Root({ children, ...props }: RootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const menubar = useContext(MenubarContext) ?? undefined
  return provided(useController(within(createMenu, { direction, menubar }), props), children)
}

/** A menu for an area of the page, opened at the pointer. Its trigger is the area. */
function ContextRoot({ children, ...props }: RootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  return provided(useController(within(createMenu, { direction, context: true }), props), children)
}

export type ContextTriggerProps = PartComponentProps<
  "div",
  StateOf<Vocabulary["contextMenu"]["trigger"]>
>

/** The area a secondary press, or a long press on a touch screen, opens the menu in. */
const ContextTrigger = (props: ContextTriggerProps) =>
  usePart(useMenu("Trigger").area, "div", props)

/** A menu that one of this menu's items opens. Its trigger is `<Menu.SubmenuTrigger>`. */
function SubmenuRoot({ children, ...props }: SubmenuRootProps): ReactElement {
  const parent = useMenu("SubmenuRoot")
  const direction = useContext(DirectionContext) ?? undefined
  return provided(useController(within(createMenu, { parent, direction }), props), children)
}

function Portal({ children }: PortalProps): ReactElement | null {
  const mounted = useSignal(useMenu("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>

function Positioner(props: PositionerProps): ReactElement {
  const controller = useMenu("Positioner")
  return usePart(controller.positioner, "div", usePositioning(controller.positioning, props))
}

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type SubmenuTriggerProps = PartComponentProps<"div", StateOf<Parts["submenuTrigger"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type ArrowProps = PartComponentProps<"div", StateOf<Parts["arrow"]>>
export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>

const Trigger = (props: TriggerProps) => usePart(useMenu("Trigger").trigger, "button", props)
const SubmenuTrigger = (props: SubmenuTriggerProps) =>
  usePart(useMenu("SubmenuTrigger").trigger, "div", props)
const Popup = (props: PopupProps) => usePart(useMenu("Popup").popup, "div", props)
const Arrow = (props: ArrowProps) => usePart(useMenu("Arrow").arrow, "div", props)
const Separator = (props: SeparatorProps) => usePart(useMenu("Separator").separator, "div", props)

export type ItemProps = PartComponentProps<"div", StateOf<Parts["item"]>, MenuItemOptions>

function Item({ disabled, label, closeOnSelect, closeOnClick, ...props }: ItemProps): ReactElement {
  const controller = useMenu("Item")
  const options = useOptions({ disabled, label, closeOnSelect, closeOnClick })
  const part = useMemo(() => controller.item(() => defined(options.get())), [controller, options])
  return usePart(part, "div", props)
}

export type LinkItemProps = PartComponentProps<"a", StateOf<Parts["linkItem"]>, MenuItemOptions>

/** An item that is a link: `href` and the rest go to its `<a>`. */
function LinkItem({
  disabled,
  label,
  closeOnSelect,
  closeOnClick,
  ...props
}: LinkItemProps): ReactElement {
  const controller = useMenu("LinkItem")
  const options = useOptions({ disabled, label, closeOnSelect, closeOnClick })
  const part = useMemo(() => controller.item(() => defined(options.get())), [controller, options])
  return usePart(part, "a", props)
}

export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, { id?: string }>

function Group({ id, ...props }: GroupProps): ReactElement {
  const controller = useMenu("Group")
  const generated = useId()
  const group = useMemo(() => controller.group(id ?? generated), [controller, id, generated])
  return (
    <GroupContext.Provider value={group}>{usePart(group.root, "div", props)}</GroupContext.Provider>
  )
}

export type GroupLabelProps = PartComponentProps<"div", StateOf<Parts["groupLabel"]>>

/** Names the group it is in. With no group around it, it is plain text. */
function GroupLabel(props: GroupLabelProps): ReactElement {
  const controller = useMenu("GroupLabel")
  const group = useContext(GroupContext)
  return usePart(group ? group.label : controller.label, "div", props)
}

export type CheckboxItemProps = PartComponentProps<
  "div",
  StateOf<Parts["checkboxItem"]>,
  MenuCheckboxItemProps
>

function CheckboxItem({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  label,
  closeOnSelect,
  closeOnClick,
  ...props
}: CheckboxItemProps): ReactElement {
  const controller = useMenu("CheckboxItem")
  const item = useController(controller.checkboxItem, {
    checked,
    defaultChecked,
    onCheckedChange,
    disabled,
    label,
    closeOnSelect,
    closeOnClick,
  })
  return (
    <CheckboxContext.Provider value={item}>
      {usePart(item.part, "div", props)}
    </CheckboxContext.Provider>
  )
}

/** What an item's mark takes of its own. */
export interface IndicatorOptions {
  /** Keeps the mark in the page while its item is not checked. */
  keepMounted?: boolean
}

export type CheckboxItemIndicatorProps = PartComponentProps<
  "span",
  StateOf<Parts["checkboxItemIndicator"]>,
  IndicatorOptions
>
export type RadioItemIndicatorProps = PartComponentProps<
  "span",
  StateOf<Parts["radioItemIndicator"]>,
  IndicatorOptions
>
/** @deprecated The mark's own: `CheckboxItemIndicatorProps` or `RadioItemIndicatorProps`. */
export type IndicatorProps = CheckboxItemIndicatorProps

function CheckboxItemIndicator({
  keepMounted,
  ...props
}: CheckboxItemIndicatorProps): ReactElement | null {
  const item = inside(CheckboxContext, "CheckboxItemIndicator", "CheckboxItem")
  const checked = useSignal(item.checked)
  return checked || keepMounted ? <PartElement of={item.indicator} tag="span" {...props} /> : null
}

/** `Value` is what tells a radio item from the others: the type of `value`. */
export type RadioGroupProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["radioGroup"]>,
  MenuRadioGroupProps<Value>
>

function RadioGroup<Value = unknown>({
  value,
  defaultValue,
  onValueChange,
  disabled,
  ...props
}: RadioGroupProps<Value>): ReactElement {
  const controller = useMenu("RadioGroup")
  const group: MenuRadioGroup = useController<MenuRadioGroupProps<Value>, MenuRadioGroup<Value>>(
    controller.radioGroup,
    { value, defaultValue, onValueChange, disabled }
  )
  return (
    <RadioGroupContext.Provider value={group}>
      {usePart(group.root, "div", props)}
    </RadioGroupContext.Provider>
  )
}

export type RadioItemProps = PartComponentProps<
  "div",
  StateOf<Parts["radioItem"]>,
  MenuItemOptions & {
    /** What the radio group's value is while this item is the chosen one. */
    value: unknown
  }
>

function RadioItem({
  value,
  disabled,
  label,
  closeOnSelect,
  closeOnClick,
  ...props
}: RadioItemProps): ReactElement {
  const group = inside(RadioGroupContext, "RadioItem", "RadioGroup")
  const options = useOptions({ disabled, label, closeOnSelect, closeOnClick })
  const part = useMemo(
    () => group.item(value, () => defined(options.get())),
    [group, value, options]
  )
  return (
    <RadioItemContext.Provider value={value}>
      {usePart(part, "div", props)}
    </RadioItemContext.Provider>
  )
}

function RadioItemIndicator({
  keepMounted,
  ...props
}: RadioItemIndicatorProps): ReactElement | null {
  const group = inside(RadioGroupContext, "RadioItemIndicator", "RadioGroup")
  const value = useContext(RadioItemContext)
  const checked = useSignal(group.checked(value))
  const part = useMemo(() => group.indicator(value), [group, value])
  return checked || keepMounted ? <PartElement of={part} tag="span" {...props} /> : null
}

export const Menu = /* @__PURE__ */ parts("Menu", {
  Root,
  Trigger,
  Portal,
  Positioner,
  Popup,
  Arrow,
  Item,
  LinkItem,
  Group,
  GroupLabel,
  Separator,
  CheckboxItem,
  CheckboxItemIndicator,
  RadioGroup,
  RadioItem,
  RadioItemIndicator,
  SubmenuRoot,
  SubmenuTrigger,
})

export const ContextMenu = /* @__PURE__ */ parts("ContextMenu", {
  ...Menu,
  Root: ContextRoot,
  Trigger: ContextTrigger,
})

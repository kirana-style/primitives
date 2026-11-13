import { defined, within } from "@kirana-ui/core"
import type { Part, PositionOptions } from "@kirana-ui/core"
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
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { MenubarContext } from "./menubar-context.ts"
import { Portal as BodyPortal, useController, useOptions, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

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

/** The area a secondary press, or a long press on a touch screen, opens the menu in. */
const ContextTrigger = (props: PartComponentProps) => usePart(useMenu("Trigger").area, "div", props)

/** A menu that one of this menu's items opens. Its trigger is `<Menu.SubmenuTrigger>`. */
function SubmenuRoot({ children, ...props }: RootProps): ReactElement {
  const parent = useMenu("SubmenuRoot")
  const direction = useContext(DirectionContext) ?? undefined
  return provided(useController(within(createMenu, { parent, direction }), props), children)
}

function Portal({ children }: { children?: ReactNode }): ReactElement | null {
  const mounted = useSignal(useMenu("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

export type PositionerProps = PartComponentProps & Partial<PositionOptions>

function Positioner({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  ...props
}: PositionerProps) {
  const controller = useMenu("Positioner")
  controller.positioning.set(defined({ side, align, sideOffset, alignOffset, collisionPadding }))
  return usePart(controller.positioner, "div", props)
}

const PartElement = ({ part, tag, ...props }: PartComponentProps & { part: Part; tag: string }) =>
  usePart(part, tag, props)

const Trigger = (props: PartComponentProps) => usePart(useMenu("Trigger").trigger, "button", props)
const SubmenuTrigger = (props: PartComponentProps) =>
  usePart(useMenu("SubmenuTrigger").trigger, "div", props)
const Popup = (props: PartComponentProps) => usePart(useMenu("Popup").popup, "div", props)
const Arrow = (props: PartComponentProps) => usePart(useMenu("Arrow").arrow, "div", props)
const Separator = (props: PartComponentProps) =>
  usePart(useMenu("Separator").separator, "div", props)

export type ItemProps = PartComponentProps & MenuItemOptions

function Item({ disabled, label, closeOnClick, ...props }: ItemProps): ReactElement {
  const controller = useMenu("Item")
  const options = useOptions({ disabled, label, closeOnClick })
  const part = useMemo(() => controller.item(() => defined(options.get())), [controller, options])
  return usePart(part, "div", props)
}

function Group({ id, ...props }: PartComponentProps & { id?: string }): ReactElement {
  const controller = useMenu("Group")
  const generated = useId()
  const group = useMemo(() => controller.group(id ?? generated), [controller, id, generated])
  return (
    <GroupContext.Provider value={group}>{usePart(group.root, "div", props)}</GroupContext.Provider>
  )
}

/** Names the group it is in. With no group around it, it is plain text. */
function GroupLabel(props: PartComponentProps): ReactElement {
  const controller = useMenu("GroupLabel")
  const group = useContext(GroupContext)
  return usePart(group ? group.label : controller.label, "div", props)
}

export type CheckboxItemProps = PartComponentProps & MenuCheckboxItemProps

function CheckboxItem({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  label,
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
    closeOnClick,
  })
  return (
    <CheckboxContext.Provider value={item}>
      {usePart(item.part, "div", props)}
    </CheckboxContext.Provider>
  )
}

export interface IndicatorProps extends PartComponentProps {
  keepMounted?: boolean
}

function CheckboxItemIndicator({ keepMounted, ...props }: IndicatorProps): ReactElement | null {
  const item = inside(CheckboxContext, "CheckboxItemIndicator", "CheckboxItem")
  const checked = useSignal(item.checked)
  return checked || keepMounted ? <PartElement part={item.indicator} tag="span" {...props} /> : null
}

export type RadioGroupProps = PartComponentProps & MenuRadioGroupProps

function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  disabled,
  ...props
}: RadioGroupProps): ReactElement {
  const controller = useMenu("RadioGroup")
  const group = useController<MenuRadioGroupProps, MenuRadioGroup>(controller.radioGroup, {
    value,
    defaultValue,
    onValueChange,
    disabled,
  })
  return (
    <RadioGroupContext.Provider value={group}>
      {usePart(group.root, "div", props)}
    </RadioGroupContext.Provider>
  )
}

export type RadioItemProps = PartComponentProps & MenuItemOptions & { value: unknown }

function RadioItem({ value, disabled, label, closeOnClick, ...props }: RadioItemProps) {
  const group = inside(RadioGroupContext, "RadioItem", "RadioGroup")
  const options = useOptions({ disabled, label, closeOnClick })
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

function RadioItemIndicator({ keepMounted, ...props }: IndicatorProps): ReactElement | null {
  const group = inside(RadioGroupContext, "RadioItemIndicator", "RadioGroup")
  const value = useContext(RadioItemContext)
  const checked = useSignal(group.checked(value))
  const part = useMemo(() => group.indicator(value), [group, value])
  return checked || keepMounted ? <PartElement part={part} tag="span" {...props} /> : null
}

export const Menu = {
  Root,
  Trigger,
  Portal,
  Positioner,
  Popup,
  Arrow,
  Item,
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
}

export const ContextMenu = { ...Menu, Root: ContextRoot, Trigger: ContextTrigger }

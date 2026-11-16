import { defined, within } from "@kirana-ui/core"
import type { Part, PositionOptions } from "@kirana-ui/core"
import { createSelect } from "@kirana-ui/core/select"
import type {
  Select as Controller,
  SelectGroup,
  SelectProps,
  SelectScrollArrow,
} from "@kirana-ui/core/select"
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"

import { FieldContext } from "./field-context.ts"
import {
  Portal as BodyPortal,
  useController,
  useMount,
  useOptions,
  usePart,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<unknown>(undefined)

function useSelect(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Select.${part}> must be inside <Select.Root>`)
  return controller
}

export type RootProps<Value> = Omit<SelectProps<Value>, "id"> & {
  id?: string
  children?: ReactNode
}

function Root<Value>({ children, ...props }: RootProps<Value>): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const controller = useController(
    within(createSelect<Value>, { field }),
    props
  ) as unknown as Controller
  const named = useSignal(controller.named)
  return (
    <Context.Provider value={controller}>
      {children}
      {named ? <HiddenInput /> : null}
    </Context.Provider>
  )
}

const HiddenInput = () => usePart(useSelect("Root").input, "input", {})

const Trigger = (props: PartComponentProps) =>
  usePart(useSelect("Trigger").trigger, "button", props)

export interface ValueProps extends PartComponentProps {
  /** Shown while nothing is chosen. */
  placeholder?: ReactNode
}

function Value({ placeholder, children, ...props }: ValueProps): ReactElement {
  const controller = useSelect("Value")
  const label = useSignal(controller.label)
  return usePart(controller.valuePart, "span", {
    ...props,
    children: children ?? label ?? placeholder,
  })
}

function Portal({ children }: { children?: ReactNode }): ReactElement | null {
  const mounted = useSignal(useSelect("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

export type PositionerProps = PartComponentProps &
  Partial<PositionOptions> & {
    /**
     * The list opens over its trigger, the chosen item's text on the trigger's own, where
     * there is room and unless a finger opened it.
     */
    alignItemWithTrigger?: boolean
  }

function Positioner({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  alignItemWithTrigger,
  ...props
}: PositionerProps) {
  const controller = useSelect("Positioner")
  controller.alignItemWithTrigger.set(Boolean(alignItemWithTrigger))
  controller.positioning.set(defined({ side, align, sideOffset, alignOffset, collisionPadding }))
  return usePart(controller.positioner, "div", props)
}

const Popup = (props: PartComponentProps) => usePart(useSelect("Popup").popup, "div", props)
const GroupContext = createContext<SelectGroup | null>(null)

/** Items that belong together, named by their `<Select.GroupLabel>`. */
function Group({ id, ...props }: PartComponentProps & { id?: string }): ReactElement {
  const controller = useSelect("Group")
  const generated = useId()
  const group = useMemo(() => controller.group(id ?? generated), [controller, id, generated])
  return (
    <GroupContext.Provider value={group}>{usePart(group.root, "div", props)}</GroupContext.Provider>
  )
}

/** A group's name. Outside a group it is plain text, and names nothing. */
function GroupLabel(props: PartComponentProps): ReactElement {
  const lone = useSelect("GroupLabel").groupLabel
  return usePart(useContext(GroupContext)?.label ?? lone, "div", props)
}

/** A line between groups. */
const Separator = (props: PartComponentProps) =>
  usePart(useSelect("Separator").separator, "div", props)

/** The items' own box inside the popup, when the popup also holds scroll arrows. */
const List = (props: PartComponentProps) => usePart(useSelect("List").list, "div", props)

function ScrollArrowElement({
  arrow,
  ...props
}: PartComponentProps & { arrow: SelectScrollArrow }): ReactElement | null {
  useMount(arrow)
  const mounted = useSignal(arrow.mounted)
  return mounted ? <ArrowPart part={arrow.part} {...props} /> : null
}

const ArrowPart = ({ part, ...props }: PartComponentProps & { part: Part }) =>
  usePart(part, "div", props)

/** In the page while there is more of the list above: it scrolls it while the pointer moves over it. */
function ScrollUpArrow(props: PartComponentProps): ReactElement {
  const controller = useSelect("ScrollUpArrow")
  const arrow = useMemo(() => controller.scrollArrow("up"), [controller])
  return <ScrollArrowElement arrow={arrow} {...props} />
}

/** In the page while there is more of the list below. */
function ScrollDownArrow(props: PartComponentProps): ReactElement {
  const controller = useSelect("ScrollDownArrow")
  const arrow = useMemo(() => controller.scrollArrow("down"), [controller])
  return <ScrollArrowElement arrow={arrow} {...props} />
}

export interface ItemProps extends PartComponentProps {
  value: unknown
  disabled?: boolean
  /** What typeahead matches and the trigger shows; the item's text when left out. */
  label?: string
  /** Its place among all the rows, in a virtualized list. */
  index?: number
}

function Item({ value, disabled, label, index, ...props }: ItemProps): ReactElement {
  const controller = useSelect("Item")
  const options = useOptions({ disabled, label, index })
  const part = useMemo(
    () => controller.item(value, () => defined(options.get())),
    [controller, value, options]
  )
  return <ItemContext.Provider value={value}>{usePart(part, "div", props)}</ItemContext.Provider>
}

function ItemText(props: PartComponentProps): ReactElement {
  const controller = useSelect("ItemText")
  const value = useContext(ItemContext)
  const part = useMemo(() => controller.itemText(value), [controller, value])
  return usePart(part, "span", props)
}

export interface ItemIndicatorProps extends PartComponentProps {
  keepMounted?: boolean
}

function ItemIndicator({ keepMounted, render: _render, ref: _ref, ...rest }: ItemIndicatorProps) {
  const selected = useSignal(useSelect("ItemIndicator").selected(useContext(ItemContext)))
  if (!selected && !keepMounted) return null
  return <span aria-hidden="true" {...(rest as object)} />
}

export const Select = {
  Root,
  Trigger,
  Value,
  Portal,
  Positioner,
  Popup,
  List,
  ScrollUpArrow,
  ScrollDownArrow,
  Group,
  GroupLabel,
  Separator,
  Item,
  ItemText,
  ItemIndicator,
}

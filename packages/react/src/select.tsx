import { defined, within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createSelect } from "@kirana-ui/core/select"
import type { Select as Controller, SelectGroup, SelectProps } from "@kirana-ui/core/select"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"

import { FieldContext } from "./field-context.ts"
import {
  Portal as BodyPortal,
  PartElement,
  parts,
  useController,
  useMount,
  useOptions,
  usePart,
  usePositioning,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps, PortalProps, PositionerOptions } from "./runtime.tsx"

export type { PortalProps }

type Parts = Vocabulary["select"]

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<unknown>(undefined)

function useSelect(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Select.${part}> must be inside <Select.Root>`)
  return controller
}

/**
 * `Value` is what tells an item from the others. `Multiple` is inferred from `multiple`: with
 * `multiple`, `value`, `defaultValue` and `onValueChange` hold a list of them.
 */
export type RootProps<Value = unknown, Multiple extends boolean | undefined = false> = Omit<
  SelectProps<Value, Multiple>,
  "id" | "multiple"
> & {
  /** Several values: `value`, `defaultValue` and `onValueChange` then hold a list. Read once. */
  multiple?: Multiple | undefined
  id?: string
  children?: ReactNode
}

function Root<Value = unknown, Multiple extends boolean | undefined = false>({
  children,
  ...props
}: RootProps<Value, Multiple>): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const controller: Controller = useController(
    within(createSelect<Value, Multiple>, { field }),
    props
  )
  const named = useSignal(controller.named)
  return (
    <Context.Provider value={controller}>
      {children}
      {named ? <HiddenInput /> : null}
    </Context.Provider>
  )
}

const HiddenInput = () => usePart(useSelect("Root").input, "input", {})

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>

const Trigger = (props: TriggerProps) => usePart(useSelect("Trigger").trigger, "button", props)

export type ValueProps<Chosen = unknown> = PartComponentProps<
  "span",
  StateOf<Parts["value"]>,
  {
    /** Shown while nothing is chosen. */
    placeholder?: ReactNode
    /**
     * What to show in place of the label. A function is given the value and its label (`null`
     * and `undefined` while nothing is chosen); with `multiple`, the values and their labels, in
     * the items' order. Its first parameter's type says which: `(values: string[], labels) => …`.
     */
    children?:
      | ReactNode
      | ((
          value: Chosen,
          label: Chosen extends readonly unknown[] ? readonly string[] : string | undefined
        ) => ReactNode)
  }
>

function Value<Chosen = unknown>({
  placeholder,
  children,
  ...props
}: ValueProps<Chosen>): ReactElement {
  const controller = useSelect("Value")
  const shown = useSignal(controller.shown)
  let drawn: ReactNode
  if (typeof children === "function") {
    const draw = children as (value: unknown, label: unknown) => ReactNode
    drawn = controller.multiple ? draw(shown.values, shown.labels) : draw(shown.value, shown.label)
  } else drawn = children ?? shown.label ?? placeholder
  return usePart(controller.valuePart, "span", { ...props, children: drawn })
}

function Portal({ children }: PortalProps): ReactElement | null {
  const mounted = useSignal(useSelect("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions & {
    /**
     * The list opens over its trigger, the chosen item's text on the trigger's own, where there is
     * room and unless a finger opened it. While it lies there the page's scroll is held (its
     * scrollbar's room kept), and a scroll of a box around the trigger closes the list
     * (`"ancestor-scroll"`), as a change of the window's size does (`"window-resize"`).
     */
    alignItemWithTrigger?: boolean
  }
>

function Positioner({ alignItemWithTrigger, ...props }: PositionerProps): ReactElement {
  const controller = useSelect("Positioner")
  controller.alignItemWithTrigger.set(Boolean(alignItemWithTrigger))
  return usePart(controller.positioner, "div", usePositioning(controller.positioning, props))
}

export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type BackdropProps = PartComponentProps<"div", StateOf<Parts["backdrop"]>>

const Popup = (props: PopupProps) => usePart(useSelect("Popup").popup, "div", props)
/** What lies over the page behind the list: a sheet's (`presentation`) is modal. */
const Backdrop = (props: BackdropProps) => usePart(useSelect("Backdrop").backdrop, "div", props)
const GroupContext = createContext<SelectGroup | null>(null)

export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, { id?: string }>

/** Items that belong together, named by their `<Select.GroupLabel>`. */
function Group({ id, ...props }: GroupProps): ReactElement {
  const controller = useSelect("Group")
  const generated = useId()
  const group = useMemo(() => controller.group(id ?? generated), [controller, id, generated])
  return (
    <GroupContext.Provider value={group}>{usePart(group.root, "div", props)}</GroupContext.Provider>
  )
}

export type GroupLabelProps = PartComponentProps<"div", StateOf<Parts["groupLabel"]>>

/** A group's name. Outside a group it is plain text, and names nothing. */
function GroupLabel(props: GroupLabelProps): ReactElement {
  const lone = useSelect("GroupLabel").groupLabel
  return usePart(useContext(GroupContext)?.label ?? lone, "div", props)
}

export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>

/** A line between groups. */
const Separator = (props: SeparatorProps) => usePart(useSelect("Separator").separator, "div", props)

export type ListProps = PartComponentProps<"div", StateOf<Parts["list"]>>

/** The items' own box inside the popup, when the popup also holds scroll arrows. */
const List = (props: ListProps) => usePart(useSelect("List").list, "div", props)

export type ScrollUpArrowProps = PartComponentProps<"div", StateOf<Parts["scrollUpArrow"]>>
export type ScrollDownArrowProps = PartComponentProps<"div", StateOf<Parts["scrollDownArrow"]>>

/** The arrow at one end of the list, and whether it is in the page: while there is more that way. */
function useScrollArrow(name: string, direction: "up" | "down") {
  const controller = useSelect(name)
  const arrow = useMemo(() => controller.scrollArrow(direction), [controller, direction])
  useMount(arrow)
  return { part: arrow.part, mounted: useSignal(arrow.mounted) }
}

/** In the page while there is more of the list above: it scrolls it while the pointer moves over it. */
function ScrollUpArrow(props: ScrollUpArrowProps): ReactElement | null {
  const { part, mounted } = useScrollArrow("ScrollUpArrow", "up")
  return mounted ? <PartElement of={part} tag="div" {...props} /> : null
}

/** In the page while there is more of the list below. */
function ScrollDownArrow(props: ScrollDownArrowProps): ReactElement | null {
  const { part, mounted } = useScrollArrow("ScrollDownArrow", "down")
  return mounted ? <PartElement of={part} tag="div" {...props} /> : null
}

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    /** What the select's value is while this item is chosen. */
    value: unknown
    /** Disables this item: it cannot be chosen, and the arrows pass over it. */
    disabled?: boolean
    /** What typeahead matches and the trigger shows; the item's text when left out. */
    label?: string
    /** Its place among all the rows, in a virtualized list. */
    index?: number
  }
>

function Item({ value, disabled, label, index, ...props }: ItemProps): ReactElement {
  const controller = useSelect("Item")
  const options = useOptions({ disabled, label, index })
  const part = useMemo(
    () => controller.item(value, () => defined(options.get())),
    [controller, value, options]
  )
  return <ItemContext.Provider value={value}>{usePart(part, "div", props)}</ItemContext.Provider>
}

export type ItemTextProps = PartComponentProps<"span", StateOf<Parts["itemText"]>>

function ItemText(props: ItemTextProps): ReactElement {
  const controller = useSelect("ItemText")
  const value = useContext(ItemContext)
  const part = useMemo(() => controller.itemText(value), [controller, value])
  return usePart(part, "span", props)
}

export type ItemIndicatorProps = PartComponentProps<
  "span",
  StateOf<Parts["itemIndicator"]>,
  {
    /** Keeps the mark in the page while its item is not chosen. */
    keepMounted?: boolean
  }
>

/** In the page while its item is the chosen one. */
function ItemIndicator({ keepMounted, ...props }: ItemIndicatorProps): ReactElement | null {
  const controller = useSelect("ItemIndicator")
  const value = useContext(ItemContext)
  const part = useMemo(() => controller.itemIndicator(value), [controller, value])
  // In the page while chosen, and through its exit.
  useMount(part)
  const mounted = useSignal(part.mounted)
  return mounted || keepMounted ? <PartElement of={part} tag="span" {...props} /> : null
}

export const Select = /* @__PURE__ */ parts("Select", {
  Root,
  Trigger,
  Value,
  Portal,
  Backdrop,
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
})

import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createSelect } from "@kirana-ui/core/select"
import type { Select as Controller, SelectGroup, SelectProps } from "@kirana-ui/core/select"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import {
  Show,
  createComputed,
  createContext,
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  untrack,
  useContext,
} from "solid-js"
import type { Accessor, JSX } from "solid-js"

import { positioned } from "./popover.tsx"
import type { PortalProps, PositionerOptions } from "./popover.tsx"
import { FieldContext } from "./field-context.ts"
import { Part, Portal as BodyPortal, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["select"]

export type { PortalProps }

const Context = createContext<Controller>()
const ItemContext = createContext<unknown>()

function useSelect(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Select part must be inside <Select.Root>")
  return made
}

/**
 * `Value` is what an item's `value` is: the root's `value` and `onValueChange` hold one or
 * `null` for none, and with `multiple` its `values` and `onValuesChange` hold several.
 */
export type RootProps<Value = unknown> = Omit<SelectProps<Value>, "id"> & {
  id?: string
  children?: JSX.Element
}

function Root<Value = unknown>(props: RootProps<Value>): JSX.Element {
  const generated = createUniqueId()
  const field = useContext(FieldContext)
  const made = controller(within(createSelect<Value>, { field }), () => ({
    id: props.id ?? generated,
    value: props.value,
    defaultValue: props.defaultValue,
    open: props.open,
    defaultOpen: props.defaultOpen,
    disabled: props.disabled,
    required: props.required,
    name: props.name,
    form: props.form,
    items: props.items,
    multiple: props.multiple,
    values: props.values,
    defaultValues: props.defaultValues,
    virtualized: props.virtualized,
    onValueChange: (value: Value | null, details: ChangeDetails) =>
      props.onValueChange?.(value, details),
    onValuesChange: (values: Value[], details: ChangeDetails) =>
      props.onValuesChange?.(values, details),
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  const named = fromSignal(made.named)
  return (
    <Context.Provider value={made}>
      {props.children}
      <Show when={named()}>
        <Part of={made.input} tag="input" />
      </Show>
    </Context.Provider>
  )
}

const Portal = (props: PortalProps) => (
  <BodyPortal mounted={useSelect().mounted}>{props.children}</BodyPortal>
)

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions & { alignItemWithTrigger?: boolean }
>

/**
 * `alignItemWithTrigger`: the list opens over its trigger, the chosen item's text on the
 * trigger's own, where there is room and unless a finger opened it.
 */
function Positioner(props: PositionerProps): JSX.Element {
  const made = useSelect()
  const [local, rest] = splitProps(props, ["alignItemWithTrigger"])
  createComputed(() => made.alignItemWithTrigger.set(Boolean(local.alignItemWithTrigger)))
  return <Part of={made.positioner} tag="div" {...positioned(rest, made.positioning)} />
}

/**
 * Shows the chosen value's label, or `placeholder` while nothing is chosen; with `multiple`,
 * the chosen labels with commas between. A function child draws something else: it is given
 * the value and its label, or with `multiple` the values and their labels in the items'
 * order, each as an accessor. Its first parameter's type says which:
 * `(values: Accessor<string[]>, labels) => …`.
 */
export type ValueProps<Chosen = unknown> = PartComponentProps<
  "span",
  StateOf<Parts["value"]>,
  {
    placeholder?: string
    children?:
      | JSX.Element
      | ((
          value: Accessor<Chosen>,
          label: Accessor<
            Chosen extends readonly unknown[] ? readonly string[] : string | undefined
          >
        ) => JSX.Element)
  }
>

function Value<Chosen = unknown>(props: ValueProps<Chosen>): JSX.Element {
  const [local, rest] = splitProps(props, ["placeholder", "children"])
  const made = useSelect()
  const shown = fromSignal(made.shown)
  const drawn = () => {
    const given = local.children
    // A function that takes nothing is an element of Solid's own, drawn as it is.
    if (typeof given !== "function" || given.length === 0) {
      return (given as JSX.Element) ?? shown().label ?? local.placeholder
    }
    const draw = given as (value: Accessor<unknown>, label: Accessor<unknown>) => JSX.Element
    return made.multiple
      ? draw(
          () => shown().values,
          () => shown().labels
        )
      : draw(
          () => shown().value,
          () => shown().label
        )
  }
  return (
    <Part of={made.valuePart} tag="span" {...rest}>
      {drawn()}
    </Part>
  )
}

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    value: unknown
    disabled?: boolean
    label?: string
    index?: number
  }
>

/** `label` is what typeahead matches and the trigger shows; the item's text when left out. */
function Item(props: ItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled", "label", "index"])
  // An item is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  const options = toSignal(() => ({
    disabled: local.disabled,
    label: local.label,
    index: local.index,
  }))
  const part = useSelect().item(value, () => defined(options.get()))
  return (
    <ItemContext.Provider value={value}>
      <Part of={part} tag="div" {...rest} />
    </ItemContext.Provider>
  )
}

export type ItemTextProps = PartComponentProps<"span", StateOf<Parts["itemText"]>>

const ItemText = (props: ItemTextProps) => (
  <Part of={useSelect().itemText(useContext(ItemContext))} tag="span" {...props} />
)

export type ItemIndicatorProps = PartComponentProps<
  "span",
  StateOf<Parts["itemIndicator"]>,
  { keepMounted?: boolean }
>

function ItemIndicator(props: ItemIndicatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const made = useSelect()
  const value = useContext(ItemContext)
  const selected = fromSignal(made.selected(value))
  return (
    <Show when={selected() || local.keepMounted}>
      <Part of={made.itemIndicator(value)} tag="span" {...rest} />
    </Show>
  )
}

const GroupContext = createContext<SelectGroup>()

export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>, { id?: string }>

/** Items that belong together, named by their `<Select.GroupLabel>`. */
function Group(props: GroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["id"])
  const generated = createUniqueId()
  const group = useSelect().group(untrack(() => local.id) ?? generated)
  return (
    <GroupContext.Provider value={group}>
      <Part of={group.root} tag="div" {...rest} />
    </GroupContext.Provider>
  )
}

export type GroupLabelProps = PartComponentProps<"div", StateOf<Parts["groupLabel"]>>

/** Names the group it is in. With no group around it, it is plain text. */
const GroupLabel = (props: GroupLabelProps) => (
  <Part of={useContext(GroupContext)?.label ?? useSelect().groupLabel} tag="div" {...props} />
)

export type ScrollUpArrowProps = PartComponentProps<"div", StateOf<Parts["scrollUpArrow"]>>
export type ScrollDownArrowProps = PartComponentProps<"div", StateOf<Parts["scrollDownArrow"]>>

function scrollArrow<Props extends Record<string, unknown>>(direction: "up" | "down") {
  return (props: Props): JSX.Element => {
    const arrow = useSelect().scrollArrow(direction)
    onMount(() => onCleanup(arrow.mount()))
    const mounted = fromSignal(arrow.mounted)
    return (
      <Show when={mounted()}>
        <Part of={arrow.part} tag="div" {...props} />
      </Show>
    )
  }
}

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type ListProps = PartComponentProps<"div", StateOf<Parts["list"]>>
export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>

const part =
  <Props extends Record<string, unknown>>(
    name: "trigger" | "popup" | "list" | "separator",
    tag: string
  ) =>
  (props: Props): JSX.Element => <Part of={useSelect()[name]} tag={tag} {...props} />

export const Select = {
  Root,
  Portal,
  Positioner,
  Value,
  Item,
  ItemText,
  ItemIndicator,
  Trigger: part<TriggerProps>("trigger", "button"),
  Popup: part<PopupProps>("popup", "div"),
  /** The items' own box inside the popup, when the popup also holds scroll arrows. */
  List: part<ListProps>("list", "div"),
  /** In the page while there is more of the list above: it scrolls it under a moving pointer. */
  ScrollUpArrow: scrollArrow<ScrollUpArrowProps>("up"),
  /** In the page while there is more of the list below. */
  ScrollDownArrow: scrollArrow<ScrollDownArrowProps>("down"),
  Group,
  GroupLabel,
  /** A line between groups. */
  Separator: part<SeparatorProps>("separator", "div"),
}

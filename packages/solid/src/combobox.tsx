import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCombobox } from "@kirana-ui/core/combobox"
import type { Combobox as Controller, ComboboxProps } from "@kirana-ui/core/combobox"
import { Show, createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { FieldContext } from "./field-context.ts"
import { positioned } from "./popover.tsx"
import type { PositionerProps } from "./popover.tsx"
import { Part, Portal as BodyPortal, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
const ItemContext = createContext<unknown>()

function useCombobox(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Combobox part must be inside <Combobox.Root>")
  return made
}

export type RootProps = {
  value?: unknown
  defaultValue?: unknown
  onValueChange?: (value: unknown, details: ChangeDetails) => void
  inputValue?: string
  defaultInputValue?: string
  onInputValueChange?: (value: string, details: ChangeDetails) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ChangeDetails) => void
  disabled?: boolean
  required?: boolean
  multiple?: boolean
  values?: readonly unknown[]
  defaultValues?: readonly unknown[]
  onValuesChange?: (values: unknown[], details: ChangeDetails) => void
  inline?: boolean
  virtualized?: ComboboxProps["virtualized"]
  name?: string
  form?: string
  items?: readonly { value: unknown; label: string }[]
  filter?: ((label: string, query: string) => boolean) | null
  id?: string
  children?: JSX.Element
}

function Root(props: RootProps): JSX.Element {
  const generated = createUniqueId()
  const field = useContext(FieldContext)
  const made = controller(within(createCombobox, { field }), () => ({
    id: props.id ?? generated,
    value: props.value,
    defaultValue: props.defaultValue,
    inputValue: props.inputValue,
    defaultInputValue: props.defaultInputValue,
    open: props.open,
    defaultOpen: props.defaultOpen,
    disabled: props.disabled,
    required: props.required,
    multiple: props.multiple,
    values: props.values,
    defaultValues: props.defaultValues,
    onValuesChange: (values: unknown[], details: ChangeDetails) =>
      props.onValuesChange?.(values, details),
    inline: props.inline,
    virtualized: props.virtualized,
    name: props.name,
    form: props.form,
    items: props.items,
    filter: props.filter,
    onValueChange: (value: unknown, details: ChangeDetails) =>
      props.onValueChange?.(value, details),
    onInputValueChange: (value: string, details: ChangeDetails) =>
      props.onInputValueChange?.(value, details),
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  const named = fromSignal(made.named)
  return (
    <Context.Provider value={made}>
      {props.children}
      <Show when={named()}>
        <Part part={made.hidden} tag="input" />
      </Show>
    </Context.Provider>
  )
}

const Portal = (props: { children?: JSX.Element }) => (
  <BodyPortal mounted={useCombobox().mounted}>{props.children}</BodyPortal>
)

function Positioner(props: PositionerProps): JSX.Element {
  const made = useCombobox()
  return <Part part={made.positioner} tag="div" {...positioned(props, made.positioning)} />
}

/** `label` is what is filtered and what the input shows; the item's text when left out. */
function Item(
  props: PartComponentProps & {
    value: unknown
    disabled?: boolean
    label?: string
    id?: string
    index?: number
  }
): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled", "label", "id", "index"])
  // An item is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  const generated = createUniqueId()
  const options = toSignal(() => ({
    disabled: local.disabled,
    label: local.label,
    index: local.index,
    id: local.id ?? generated,
  }))
  const part = useCombobox().item(value, () => options.get())
  return (
    <ItemContext.Provider value={value}>
      <Part part={part} tag="div" {...rest} />
    </ItemContext.Provider>
  )
}

function ItemIndicator(props: PartComponentProps & { keepMounted?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const made = useCombobox()
  const value = useContext(ItemContext)
  const selected = fromSignal(made.selected(value))
  return (
    <Show when={selected() || local.keepMounted}>
      <Part part={made.itemIndicator(value)} tag="span" {...rest} />
    </Show>
  )
}

/** A button that empties the input and the value. Drawn while there is something to clear. */
function Clear(props: PartComponentProps & { keepMounted?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const made = useCombobox()
  const clearable = fromSignal(made.clearable)
  return (
    <Show when={clearable() || local.keepMounted}>
      <Part part={made.clear} tag="button" {...rest} />
    </Show>
  )
}

const ChipContext = createContext<unknown>()

/** With `multiple`: one chosen value. Its `value` is what its remove button takes away. */
function Chip(props: PartComponentProps & { value: unknown }): JSX.Element {
  const [local, rest] = splitProps(props, ["value"])
  // A chip is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  return (
    <ChipContext.Provider value={value}>
      <Part part={useCombobox().chip(value)} tag="span" {...rest} />
    </ChipContext.Provider>
  )
}

const ChipRemove = (props: PartComponentProps) => (
  <Part part={useCombobox().chipRemove(useContext(ChipContext))} tag="button" {...props} />
)

/** Drawn while no item is shown for what was typed. */
function Empty(props: PartComponentProps): JSX.Element {
  const made = useCombobox()
  const empty = fromSignal(made.empty)
  return (
    <Show when={empty()}>
      <Part part={made.emptyPart} tag="div" {...props} />
    </Show>
  )
}

const part =
  (name: "input" | "trigger" | "popup" | "chips", tag: string) => (props: PartComponentProps) => (
    <Part part={useCombobox()[name]} tag={tag} {...props} />
  )

export const Combobox = {
  Root,
  Input: part("input", "input"),
  Trigger: part("trigger", "button"),
  Clear,
  /** With `multiple`: what holds the chips and the input. */
  Chips: part("chips", "div"),
  Chip,
  ChipRemove,
  Portal,
  Positioner,
  Popup: part("popup", "div"),
  Item,
  ItemIndicator,
  Empty,
}

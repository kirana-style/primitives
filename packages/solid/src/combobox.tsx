import type { ChangeDetails } from "@kirana-ui/core"
import { createCombobox } from "@kirana-ui/core/combobox"
import type { Combobox as Controller } from "@kirana-ui/core/combobox"
import { Show, createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

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
  name?: string
  form?: string
  items?: readonly { value: unknown; label: string }[]
  filter?: ((label: string, query: string) => boolean) | null
  id?: string
  children?: JSX.Element
}

function Root(props: RootProps): JSX.Element {
  const generated = createUniqueId()
  const made = controller(createCombobox, () => ({
    id: props.id ?? generated,
    value: props.value,
    defaultValue: props.defaultValue,
    inputValue: props.inputValue,
    defaultInputValue: props.defaultInputValue,
    open: props.open,
    defaultOpen: props.defaultOpen,
    disabled: props.disabled,
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
  props: PartComponentProps & { value: unknown; disabled?: boolean; label?: string; id?: string }
): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled", "label", "id"])
  // An item is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  const generated = createUniqueId()
  const options = toSignal(() => ({
    disabled: local.disabled,
    label: local.label,
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

const part = (name: "input" | "trigger" | "popup", tag: string) => (props: PartComponentProps) => (
  <Part part={useCombobox()[name]} tag={tag} {...props} />
)

export const Combobox = {
  Root,
  Input: part("input", "input"),
  Trigger: part("trigger", "button"),
  Portal,
  Positioner,
  Popup: part("popup", "div"),
  Item,
  ItemIndicator,
  Empty,
}

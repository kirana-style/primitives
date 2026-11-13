import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createSelect } from "@kirana-ui/core/select"
import type { Select as Controller } from "@kirana-ui/core/select"
import { Show, createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { positioned } from "./popover.tsx"
import type { PositionerProps } from "./popover.tsx"
import { FieldContext } from "./field-context.ts"
import { Part, Portal as BodyPortal, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
const ItemContext = createContext<unknown>()

function useSelect(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Select part must be inside <Select.Root>")
  return made
}

export type RootProps = {
  value?: unknown
  defaultValue?: unknown
  onValueChange?: (value: unknown, details: ChangeDetails) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ChangeDetails) => void
  disabled?: boolean
  required?: boolean
  name?: string
  form?: string
  items?: readonly { value: unknown; label: string }[]
  id?: string
  children?: JSX.Element
}

function Root(props: RootProps): JSX.Element {
  const generated = createUniqueId()
  const field = useContext(FieldContext)
  const made = controller(within(createSelect, { field }), () => ({
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
    onValueChange: (value: unknown, details: ChangeDetails) =>
      props.onValueChange?.(value, details),
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  const named = fromSignal(made.named)
  return (
    <Context.Provider value={made}>
      {props.children}
      <Show when={named()}>
        <Part part={made.input} tag="input" />
      </Show>
    </Context.Provider>
  )
}

const Portal = (props: { children?: JSX.Element }) => (
  <BodyPortal mounted={useSelect().mounted}>{props.children}</BodyPortal>
)

function Positioner(props: PositionerProps): JSX.Element {
  const made = useSelect()
  return <Part part={made.positioner} tag="div" {...positioned(props, made.positioning)} />
}

/** Shows the chosen value's label, or `placeholder` while nothing is chosen. */
function Value(props: PartComponentProps & { placeholder?: string }): JSX.Element {
  const [local, rest] = splitProps(props, ["placeholder", "children"])
  const made = useSelect()
  const label = fromSignal(made.label)
  return (
    <Part part={made.valuePart} tag="span" {...rest}>
      {local.children ?? label() ?? local.placeholder}
    </Part>
  )
}

/** `label` is what typeahead matches and the trigger shows; the item's text when left out. */
function Item(
  props: PartComponentProps & { value: unknown; disabled?: boolean; label?: string }
): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled", "label"])
  // An item is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  const options = toSignal(() => ({ disabled: local.disabled, label: local.label }))
  const part = useSelect().item(value, () => defined(options.get()))
  return (
    <ItemContext.Provider value={value}>
      <Part part={part} tag="div" {...rest} />
    </ItemContext.Provider>
  )
}

const ItemText = (props: PartComponentProps) => (
  <Part part={useSelect().itemText(useContext(ItemContext))} tag="span" {...props} />
)

function ItemIndicator(props: PartComponentProps & { keepMounted?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const made = useSelect()
  const value = useContext(ItemContext)
  const selected = fromSignal(made.selected(value))
  return (
    <Show when={selected() || local.keepMounted}>
      <Part part={made.itemIndicator(value)} tag="span" {...rest} />
    </Show>
  )
}

const part = (name: "trigger" | "popup", tag: string) => (props: PartComponentProps) => (
  <Part part={useSelect()[name]} tag={tag} {...props} />
)

export const Select = {
  Root,
  Portal,
  Positioner,
  Value,
  Item,
  ItemText,
  ItemIndicator,
  Trigger: part("trigger", "button"),
  Popup: part("popup", "div"),
}

import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createRadioGroup } from "@kirana-ui/core/radio-group"
import type { RadioGroup as Controller } from "@kirana-ui/core/radio-group"
import {
  Show,
  createContext,
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  untrack,
  useContext,
} from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { Part, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
const ItemContext = createContext<unknown>()

function useRadioGroup(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A RadioGroup part must be inside <RadioGroup.Root>")
  return made
}

export type RootProps = PartComponentProps & {
  value?: unknown
  defaultValue?: unknown
  onValueChange?: (value: unknown, details: ChangeDetails) => void
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
  form?: string
  id?: string
}

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "disabled",
    "readOnly",
    "required",
    "name",
    "form",
    "id",
  ])
  const generated = createUniqueId()
  const field = useContext(FieldContext)
  const made = controller(
    within(createRadioGroup, { field, direction: useContext(DirectionContext) }),
    () => ({
      id: local.id ?? generated,
      value: local.value,
      defaultValue: local.defaultValue,
      disabled: local.disabled,
      readOnly: local.readOnly,
      required: local.required,
      name: local.name,
      form: local.form,
      onValueChange: (value: unknown, details: ChangeDetails) =>
        local.onValueChange?.(value, details),
    })
  )
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

function Item(props: PartComponentProps & { value: unknown; disabled?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled", "children"])
  // An item is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  const options = toSignal(() => ({ disabled: local.disabled }))
  const read = () => defined(options.get())
  const group = useRadioGroup()
  return (
    <ItemContext.Provider value={value}>
      <Part part={group.item(value, read)} tag="span" {...rest}>
        {local.children}
        <Part part={group.itemInput(value, read)} tag="input" />
      </Part>
    </ItemContext.Provider>
  )
}

/** `keepMounted` keeps the mark in the page while its item is not the chosen one. */
function Indicator(props: PartComponentProps & { keepMounted?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const indicator = useRadioGroup().indicator(useContext(ItemContext))
  onMount(() => onCleanup(indicator.mount()))
  const mounted = fromSignal(indicator.mounted)
  return (
    <Show when={mounted() || local.keepMounted}>
      <Part part={indicator.part} tag="span" {...rest} />
    </Show>
  )
}

export const RadioGroup = { Root, Item, Indicator }

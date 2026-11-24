import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createRadioGroup } from "@kirana-ui/core/radio-group"
import type { RadioGroup as Controller, RadioGroupProps } from "@kirana-ui/core/radio-group"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createContext, createUniqueId, onSettled, untrack, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { Part, controller, fromSignal, toSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["radioGroup"]

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<unknown>(null)

function useRadioGroup(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A RadioGroup part must be inside <RadioGroup.Root>")
  return made
}

/** `Value` is what an item's `value` is: the root's `value` holds the chosen one, or `null`. */
export type RootProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<RadioGroupProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>(props: RootProps<Value>): JSX.Element {
  const [local, rest] = split(props, [
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
  const field = useContext(FieldContext) ?? undefined
  const made = controller(
    within(createRadioGroup<Value>, {
      field,
      direction: useContext(DirectionContext) ?? undefined,
    }),
    () => ({
      id: local.id ?? generated,
      value: local.value,
      defaultValue: local.defaultValue,
      disabled: local.disabled,
      readOnly: local.readOnly,
      required: local.required,
      name: local.name,
      form: local.form,
      onValueChange: (value: Value | null, details: ChangeDetails) =>
        local.onValueChange?.(value, details),
    })
  )
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context>
  )
}

export type ItemProps = PartComponentProps<
  "span",
  StateOf<Parts["item"]>,
  {
    value: unknown
    /** Disables this item: it cannot be chosen. */
    disabled?: boolean
    /** The id of the item's native radio, unique in the page: a `<label for>` names it. */
    id?: string
  }
>

function Item(props: ItemProps): JSX.Element {
  const [local, rest] = split(props, ["value", "disabled", "id", "children"])
  // An item is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  const options = toSignal(() => ({ disabled: local.disabled, id: local.id }))
  const read = () => defined(options.get())
  const group = useRadioGroup()
  return (
    <ItemContext value={value}>
      <Part of={group.item(value, read)} tag="span" {...rest}>
        {local.children}
        <Part of={group.itemInput(value, read)} tag="input" />
      </Part>
    </ItemContext>
  )
}

export type IndicatorProps = PartComponentProps<
  "span",
  StateOf<Parts["indicator"]>,
  { keepMounted?: boolean }
>

/** `keepMounted` keeps the mark in the page while its item is not the chosen one. */
function Indicator(props: IndicatorProps): JSX.Element {
  const [local, rest] = split(props, ["keepMounted"])
  const indicator = useRadioGroup().indicator(useContext(ItemContext) ?? undefined)
  onSettled(() => indicator.mount())
  const mounted = fromSignal(indicator.mounted)
  return (
    <Show when={mounted() || local.keepMounted}>
      <Part of={indicator.part} tag="span" {...rest} />
    </Show>
  )
}

export const RadioGroup = { Root, Item, Indicator }

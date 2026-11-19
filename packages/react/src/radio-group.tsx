import { defined, within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createRadioGroup } from "@kirana-ui/core/radio-group"
import type { RadioGroup as Controller, RadioGroupProps } from "@kirana-ui/core/radio-group"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useMemo } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import {
  PartElement,
  parts,
  useController,
  useMount,
  useOptions,
  usePart,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["radioGroup"]

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<unknown>(undefined)

function useRadioGroup(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<RadioGroup.${part}> must be inside <RadioGroup.Root>`)
  return controller
}

/** `Value` is what tells an item from the others: the type of `value`. */
export type RootProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<RadioGroupProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>({
  value,
  defaultValue,
  onValueChange,
  disabled,
  readOnly,
  required,
  name,
  form,
  id,
  ...rest
}: RootProps<Value>): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const direction = useContext(DirectionContext) ?? undefined
  const create = within(createRadioGroup<Value>, { field, direction })
  const controller: Controller = useController(create, {
    value,
    defaultValue,
    onValueChange,
    disabled,
    readOnly,
    required,
    name,
    form,
    id,
  })
  return (
    <Context.Provider value={controller}>
      <PartElement of={controller.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type ItemProps = PartComponentProps<
  "span",
  StateOf<Parts["item"]>,
  {
    /** What the group's value is while this item is the chosen one. */
    value: unknown
    /** Disables this item: it cannot be chosen. */
    disabled?: boolean
    /** The id of the item's native radio, unique in the page: a `<label htmlFor>` names it. */
    id?: string
  }
>

function Item({ value, disabled, id, ...rest }: ItemProps): ReactElement {
  const controller = useRadioGroup("Item")
  const options = useOptions({ disabled, id })
  const made = useMemo(() => {
    const read = () => defined(options.get())
    return { item: controller.item(value, read), input: controller.itemInput(value, read) }
  }, [controller, value, options])
  return (
    <ItemContext.Provider value={value}>
      {usePart(made.item, "span", rest, undefined, (content) => (
        // Its native input is the element's last child, whatever element the caller asked for.
        <>
          {content}
          <PartElement of={made.input} tag="input" />
        </>
      ))}
    </ItemContext.Provider>
  )
}

export type IndicatorProps = PartComponentProps<
  "span",
  StateOf<Parts["indicator"]>,
  {
    /** Keeps the mark in the page while its item is not the chosen one. */
    keepMounted?: boolean
  }
>

function Indicator({ keepMounted, ...props }: IndicatorProps): ReactElement | null {
  const controller = useRadioGroup("Indicator")
  const value = useContext(ItemContext)
  const indicator = useMemo(() => controller.indicator(value), [controller, value])
  useMount(indicator)
  const mounted = useSignal(indicator.mounted)
  if (!mounted && !keepMounted) return null
  return <PartElement of={indicator.part} tag="span" {...props} />
}

export const RadioGroup = /* @__PURE__ */ parts("RadioGroup", { Root, Item, Indicator })

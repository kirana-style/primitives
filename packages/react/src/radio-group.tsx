import { defined, within } from "@kirana-ui/core"
import type { Part } from "@kirana-ui/core"
import { createRadioGroup } from "@kirana-ui/core/radio-group"
import type { RadioGroup as Controller, RadioGroupProps } from "@kirana-ui/core/radio-group"
import { createContext, useContext, useEffect, useMemo } from "react"
import type { ReactElement } from "react"

import { FieldContext } from "./field-context.ts"
import { useController, useOptions, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<unknown>(undefined)

function useRadioGroup(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<RadioGroup.${part}> must be inside <RadioGroup.Root>`)
  return controller
}

export type RootProps<Value> = Omit<RadioGroupProps<Value>, "id"> & {
  id?: string
} & PartComponentProps

function Root<Value>({
  value,
  defaultValue,
  onValueChange,
  disabled,
  readOnly,
  required,
  name,
  id,
  ...rest
}: RootProps<Value>): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const create = within(createRadioGroup<Value>, { field })
  const controller = useController(create, {
    value: value as Value | null | undefined,
    defaultValue: defaultValue as Value | null | undefined,
    onValueChange,
    disabled,
    readOnly,
    required,
    name,
    id,
  }) as unknown as Controller
  return (
    <Context.Provider value={controller}>
      <RootElement {...rest} />
    </Context.Provider>
  )
}

const RootElement = (props: PartComponentProps) => usePart(useRadioGroup("Root").root, "div", props)

export interface ItemProps extends PartComponentProps {
  value: unknown
  disabled?: boolean
}

function Item({ value, disabled, children, ...rest }: ItemProps): ReactElement {
  const controller = useRadioGroup("Item")
  const options = useOptions({ disabled })
  const parts = useMemo(() => {
    const read = () => defined(options.get())
    return { item: controller.item(value, read), input: controller.itemInput(value, read) }
  }, [controller, value, options])
  return (
    <ItemContext.Provider value={value}>
      <PartElement part={parts.item} tag="span" {...rest}>
        {children}
        <PartElement part={parts.input} tag="input" />
      </PartElement>
    </ItemContext.Provider>
  )
}

const PartElement = ({ part, tag, ...props }: PartComponentProps & { part: Part; tag: string }) =>
  usePart(part, tag, props)

export interface IndicatorProps extends PartComponentProps {
  /** Keeps the mark in the page while its item is not the chosen one. */
  keepMounted?: boolean
}

function Indicator({ keepMounted, ...props }: IndicatorProps): ReactElement | null {
  const controller = useRadioGroup("Indicator")
  const value = useContext(ItemContext)
  const indicator = useMemo(() => controller.indicator(value), [controller, value])
  useEffect(() => indicator.mount(), [indicator])
  const mounted = useSignal(indicator.mounted)
  if (!mounted && !keepMounted) return null
  return <PartElement part={indicator.part} tag="span" {...props} />
}

export const RadioGroup = { Root, Item, Indicator }

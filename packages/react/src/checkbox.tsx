import { within } from "@kirana-ui/core"
import { createCheckbox } from "@kirana-ui/core/checkbox"
import type { Checkbox as Controller, CheckboxProps } from "@kirana-ui/core/checkbox"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { FieldContext } from "./field-context.ts"
import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useCheckbox(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Checkbox.${part}> must be inside <Checkbox.Root>`)
  return controller
}

export type RootProps = Omit<CheckboxProps, "id"> & { id?: string } & PartComponentProps

function Root({
  checked,
  defaultChecked,
  onCheckedChange,
  indeterminate,
  disabled,
  readOnly,
  required,
  name,
  form,
  value,
  id,
  children,
  ...rest
}: RootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const create = within(createCheckbox, { field })
  const controller = useController(create, {
    checked,
    defaultChecked,
    onCheckedChange,
    indeterminate,
    disabled,
    readOnly,
    required,
    name,
    form,
    value: value as string | undefined,
    id,
  })
  return (
    <Context.Provider value={controller}>
      <RootElement {...rest}>
        {children}
        <Input />
      </RootElement>
    </Context.Provider>
  )
}

const RootElement = (props: PartComponentProps) => usePart(useCheckbox("Root").root, "span", props)
const Input = () => usePart(useCheckbox("Root").input, "input", {})

export interface IndicatorProps extends PartComponentProps {
  /** Keeps the mark in the page while the box is unchecked. */
  keepMounted?: boolean
}

function Indicator({ keepMounted, ...props }: IndicatorProps): ReactElement | null {
  const mounted = useSignal(useCheckbox("Indicator").indicatorMounted)
  if (!mounted && !keepMounted) return null
  return <IndicatorElement {...props} />
}

const IndicatorElement = (props: PartComponentProps) =>
  usePart(useCheckbox("Indicator").indicator, "span", props)

export const Checkbox = { Root, Indicator }

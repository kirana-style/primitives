import { computed, within } from "@kirana-ui/core"
import type { Part } from "@kirana-ui/core"
import { createNumberField } from "@kirana-ui/core/number-field"
import type { NumberField as Controller, NumberFieldProps } from "@kirana-ui/core/number-field"
import { createContext, useContext, useMemo } from "react"
import type { ReactElement } from "react"

import { FieldContext } from "./field-context.ts"
import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useNumberField(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<NumberField.${part}> must be inside <NumberField.Root>`)
  return controller
}

export type RootProps = Omit<NumberFieldProps, "id"> & { id?: string } & PartComponentProps

function Root({
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min,
  max,
  step,
  smallStep,
  largeStep,
  snapOnStep,
  allowWheelScrub,
  format,
  locale,
  disabled,
  readOnly,
  required,
  name,
  form,
  id,
  children,
  ...rest
}: RootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const controller = useController<NumberFieldProps, Controller>(
    within(createNumberField, { field }),
    {
      value,
      defaultValue,
      onValueChange,
      onValueCommitted,
      min,
      max,
      step,
      smallStep,
      largeStep,
      snapOnStep,
      allowWheelScrub,
      format,
      locale,
      disabled,
      readOnly,
      required,
      name,
      form,
      id,
    }
  )
  const named = useSignal(controller.named)
  return (
    <Context.Provider value={controller}>
      <RootElement {...rest}>
        {children}
        {named ? <HiddenInput /> : null}
      </RootElement>
    </Context.Provider>
  )
}

const RootElement = (props: PartComponentProps) =>
  usePart(useNumberField("Root").root, "div", props)
const HiddenInput = () => usePart(useNumberField("Root").hidden, "input", {})
const Group = (props: PartComponentProps) => usePart(useNumberField("Group").group, "div", props)
/** The text input. Its text is the field's own: React is given it as the input's default. */
function Input(props: PartComponentProps): ReactElement {
  const { input } = useNumberField("Input")
  // To React a `value` with no `onChange` is an input that cannot be typed in.
  const part = useMemo<Part>(
    () => ({
      props: computed(() => {
        const { value, ...rest } = input.props.get()
        return { ...rest, defaultValue: value }
      }),
      attach: (element) => input.attach(element),
    }),
    [input]
  )
  return usePart(part, "input", props)
}
const Increment = (props: PartComponentProps) =>
  usePart(useNumberField("Increment").increment, "button", props)
const Decrement = (props: PartComponentProps) =>
  usePart(useNumberField("Decrement").decrement, "button", props)

export const NumberField = { Root, Group, Input, Increment, Decrement }

import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createNumberField } from "@kirana-ui/core/number-field"
import type { NumberField as Controller, NumberFieldProps } from "@kirana-ui/core/number-field"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { FieldContext } from "./field-context.ts"
import { parts, useController, useOwnText, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["numberField"]

const Context = createContext<Controller | null>(null)

function useNumberField(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<NumberField.${part}> must be inside <NumberField.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<NumberFieldProps, "id"> & { id?: string }
>

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
      {usePart(controller.root, "div", rest, undefined, (content) => (
        // Its hidden input is in the element, whatever element the caller asked for.
        <>
          {content}
          {named ? <HiddenInput /> : null}
        </>
      ))}
    </Context.Provider>
  )
}

const HiddenInput = () => usePart(useNumberField("Root").hidden, "input", {})
export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>>

const Group = (props: GroupProps) => usePart(useNumberField("Group").group, "div", props)
export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>

/** The text input. Its text is the field's own. */
const Input = (props: InputProps) =>
  usePart(useOwnText(useNumberField("Input").input), "input", props)
export type IncrementProps = PartComponentProps<"button", StateOf<Parts["increment"]>>

const Increment = (props: IncrementProps) =>
  usePart(useNumberField("Increment").increment, "button", props)
export type DecrementProps = PartComponentProps<"button", StateOf<Parts["decrement"]>>

const Decrement = (props: DecrementProps) =>
  usePart(useNumberField("Decrement").decrement, "button", props)

export const NumberField = /* @__PURE__ */ parts("NumberField", {
  Root,
  Group,
  Input,
  Increment,
  Decrement,
})

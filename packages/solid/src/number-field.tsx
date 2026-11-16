import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createNumberField } from "@kirana-ui/core/number-field"
import type { NumberField as Controller, NumberFieldProps } from "@kirana-ui/core/number-field"
import { Show, createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { FieldContext } from "./field-context.ts"
import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useNumberField(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A NumberField part must be inside <NumberField.Root>")
  return made
}

export type RootProps = PartComponentProps & Omit<NumberFieldProps, "id"> & { id?: string }

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "onValueCommitted",
    "min",
    "max",
    "step",
    "smallStep",
    "largeStep",
    "snapOnStep",
    "allowWheelScrub",
    "format",
    "locale",
    "disabled",
    "readOnly",
    "required",
    "name",
    "form",
    "id",
    "children",
  ])
  const generated = createUniqueId()
  const made = controller(within(createNumberField, { field: useContext(FieldContext) }), () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    min: local.min,
    max: local.max,
    step: local.step,
    smallStep: local.smallStep,
    largeStep: local.largeStep,
    snapOnStep: local.snapOnStep,
    allowWheelScrub: local.allowWheelScrub,
    format: local.format,
    locale: local.locale,
    disabled: local.disabled,
    readOnly: local.readOnly,
    required: local.required,
    name: local.name,
    form: local.form,
    onValueChange: (value: number | null, details: ChangeDetails) =>
      local.onValueChange?.(value, details),
    onValueCommitted: (value: number | null, details: ChangeDetails) =>
      local.onValueCommitted?.(value, details),
  }))
  const named = fromSignal(made.named)
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest}>
        {local.children as JSX.Element}
        <Show when={named()}>
          <Part part={made.hidden} tag="input" />
        </Show>
      </Part>
    </Context.Provider>
  )
}

const part =
  (name: "group" | "input" | "increment" | "decrement", tag: string) =>
  (props: PartComponentProps) => <Part part={useNumberField()[name]} tag={tag} {...props} />

export const NumberField = {
  Root,
  Group: part("group", "div"),
  Input: part("input", "input"),
  Increment: part("increment", "button"),
  Decrement: part("decrement", "button"),
}

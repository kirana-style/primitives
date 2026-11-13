import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCheckbox } from "@kirana-ui/core/checkbox"
import type { Checkbox as Controller } from "@kirana-ui/core/checkbox"
import { Show, createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { FieldContext } from "./field-context.ts"
import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useCheckbox(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Checkbox part must be inside <Checkbox.Root>")
  return made
}

export type RootProps = PartComponentProps & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean, details: ChangeDetails) => void
  indeterminate?: boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
  form?: string
  value?: string
  id?: string
}

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "checked",
    "defaultChecked",
    "onCheckedChange",
    "indeterminate",
    "disabled",
    "readOnly",
    "required",
    "name",
    "form",
    "value",
    "id",
    "children",
  ])
  const generated = createUniqueId()
  const field = useContext(FieldContext)
  const made = controller(within(createCheckbox, { field }), () => ({
    id: local.id ?? generated,
    checked: local.checked,
    defaultChecked: local.defaultChecked,
    indeterminate: local.indeterminate,
    disabled: local.disabled,
    readOnly: local.readOnly,
    required: local.required,
    name: local.name,
    form: local.form,
    value: local.value,
    onCheckedChange: (checked: boolean, details: ChangeDetails) =>
      local.onCheckedChange?.(checked, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="span" {...rest}>
        {local.children}
        <Part part={made.input} tag="input" />
      </Part>
    </Context.Provider>
  )
}

/** `keepMounted` keeps the mark in the page while the box is unchecked. */
function Indicator(props: PartComponentProps & { keepMounted?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const made = useCheckbox()
  const mounted = fromSignal(made.indicatorMounted)
  return (
    <Show when={mounted() || local.keepMounted}>
      <Part part={made.indicator} tag="span" {...rest} />
    </Show>
  )
}

export const Checkbox = { Root, Indicator }

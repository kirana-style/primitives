import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createSwitch } from "@kirana-ui/core/switch"
import type { Switch as Controller } from "@kirana-ui/core/switch"
import { createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { FieldContext } from "./field-context.ts"
import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useSwitch(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Switch part must be inside <Switch.Root>")
  return made
}

export type RootProps = PartComponentProps & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean, details: ChangeDetails) => void
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
  const made = controller(within(createSwitch, { field }), () => ({
    id: local.id ?? generated,
    checked: local.checked,
    defaultChecked: local.defaultChecked,
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

const Thumb = (props: PartComponentProps) => <Part part={useSwitch().thumb} tag="span" {...props} />

export const Switch = { Root, Thumb }

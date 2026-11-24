import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createSwitch } from "@kirana-ui/core/switch"
import type { Switch as Controller } from "@kirana-ui/core/switch"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { FieldContext } from "./field-context.ts"
import { Part, controller, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["switch"]

const Context = createContext<Controller | null>(null)

function useSwitch(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Switch part must be inside <Switch.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "span",
  StateOf<Parts["root"]>,
  {
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
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
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
  const field = useContext(FieldContext) ?? undefined
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
    <Context value={made}>
      <Part of={made.root} tag="span" {...rest}>
        {local.children}
        <Part of={made.input} tag="input" />
      </Part>
    </Context>
  )
}

export type ThumbProps = PartComponentProps<"span", StateOf<Parts["thumb"]>>

const Thumb = (props: ThumbProps) => <Part of={useSwitch().thumb} tag="span" {...props} />

export const Switch = { Root, Thumb }

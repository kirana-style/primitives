import { within } from "@kirana-ui/core"
import { createSwitch } from "@kirana-ui/core/switch"
import type { Switch as Controller, SwitchProps } from "@kirana-ui/core/switch"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { FieldContext } from "./field-context.ts"
import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useSwitch(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Switch.${part}> must be inside <Switch.Root>`)
  return controller
}

export type RootProps = Omit<SwitchProps, "id"> & { id?: string } & PartComponentProps

function Root({
  checked,
  defaultChecked,
  onCheckedChange,
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
  const create = within(createSwitch, { field })
  const controller = useController(create, {
    checked,
    defaultChecked,
    onCheckedChange,
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

const RootElement = (props: PartComponentProps) => usePart(useSwitch("Root").root, "span", props)
const Input = () => usePart(useSwitch("Root").input, "input", {})
const Thumb = (props: PartComponentProps) => usePart(useSwitch("Thumb").thumb, "span", props)

export const Switch = { Root, Thumb }

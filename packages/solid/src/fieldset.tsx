import { createFieldset } from "@kirana-ui/core/fieldset"
import type { Fieldset as Controller } from "@kirana-ui/core/fieldset"
import { createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** The fieldset a field is in, if it is in one. */
export const FieldsetContext = createContext<Controller>()

function useFieldset(): Controller {
  const made = useContext(FieldsetContext)
  if (!made) throw new Error("A Fieldset part must be inside <Fieldset.Root>")
  return made
}

function Root(props: PartComponentProps & { disabled?: boolean; id?: string }): JSX.Element {
  const [local, rest] = splitProps(props, ["disabled", "id"])
  const generated = createUniqueId()
  const made = controller(createFieldset, () => ({
    id: local.id ?? generated,
    disabled: local.disabled,
  }))
  return (
    <FieldsetContext.Provider value={made}>
      <Part part={made.root} tag="fieldset" {...rest} />
    </FieldsetContext.Provider>
  )
}

const Legend = (props: PartComponentProps) => (
  <Part part={useFieldset().legend} tag="div" {...props} />
)

export const Fieldset = { Root, Legend }

import { createFieldset } from "@kirana-ui/core/fieldset"
import type { Fieldset as Controller, FieldsetProps } from "@kirana-ui/core/fieldset"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** The fieldset a field is in, if it is in one. */
export const FieldsetContext = createContext<Controller | null>(null)

function useFieldset(part: string): Controller {
  const controller = useContext(FieldsetContext)
  if (!controller) throw new Error(`<Fieldset.${part}> must be inside <Fieldset.Root>`)
  return controller
}

function Root({
  disabled,
  id,
  ...rest
}: Omit<FieldsetProps, "id"> & { id?: string } & PartComponentProps): ReactElement {
  const controller = useController(createFieldset, { disabled, id })
  return (
    <FieldsetContext.Provider value={controller}>
      <RootElement {...rest} />
    </FieldsetContext.Provider>
  )
}

const RootElement = (props: PartComponentProps) =>
  usePart(useFieldset("Root").root, "fieldset", props)
const Legend = (props: PartComponentProps) => usePart(useFieldset("Legend").legend, "div", props)

export const Fieldset = { Root, Legend }

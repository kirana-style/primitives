import type { StateOf } from "@kirana-ui/core"
import { createFieldset } from "@kirana-ui/core/fieldset"
import type { Fieldset as Controller, FieldsetProps } from "@kirana-ui/core/fieldset"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { parts, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["fieldset"]

/** The fieldset a field is in, if it is in one. */
export const FieldsetContext = createContext<Controller | null>(null)

function useFieldset(part: string): Controller {
  const controller = useContext(FieldsetContext)
  if (!controller) throw new Error(`<Fieldset.${part}> must be inside <Fieldset.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "fieldset",
  StateOf<Parts["root"]>,
  Omit<FieldsetProps, "id"> & { id?: string }
>

function Root({ disabled, id, ...rest }: RootProps): ReactElement {
  const controller = useController(createFieldset, { disabled, id })
  return (
    <FieldsetContext.Provider value={controller}>
      {usePart(controller.root, "fieldset", rest)}
    </FieldsetContext.Provider>
  )
}

export type LegendProps = PartComponentProps<"div", StateOf<Parts["legend"]>>

const Legend = (props: LegendProps) => usePart(useFieldset("Legend").legend, "div", props)

export const Fieldset = /* @__PURE__ */ parts("Fieldset", { Root, Legend })

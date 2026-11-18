import type { StateOf } from "@kirana-ui/core"
import { createFieldset } from "@kirana-ui/core/fieldset"
import type { Fieldset as Controller } from "@kirana-ui/core/fieldset"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** The fieldset a field is in, if it is in one. */
export const FieldsetContext = createContext<Controller>()

type Parts = Vocabulary["fieldset"]

function useFieldset(): Controller {
  const made = useContext(FieldsetContext)
  if (!made) throw new Error("A Fieldset part must be inside <Fieldset.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "fieldset",
  StateOf<Parts["root"]>,
  { disabled?: boolean; id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, ["disabled", "id"])
  const generated = createUniqueId()
  const made = controller(createFieldset, () => ({
    id: local.id ?? generated,
    disabled: local.disabled,
  }))
  return (
    <FieldsetContext.Provider value={made}>
      <Part of={made.root} tag="fieldset" {...rest} />
    </FieldsetContext.Provider>
  )
}

export type LegendProps = PartComponentProps<"div", StateOf<Parts["legend"]>>

const Legend = (props: LegendProps) => <Part of={useFieldset().legend} tag="div" {...props} />

export const Fieldset = { Root, Legend }

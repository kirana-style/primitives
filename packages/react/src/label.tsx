import type { StateOf } from "@kirana-ui/core"
import { createLabel } from "@kirana-ui/core/label"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { useContext, useMemo } from "react"
import type { ReactElement } from "react"

import { FieldContext } from "./field-context.ts"
import { component, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type LabelProps = PartComponentProps<"label", StateOf<Vocabulary["label"]["label"]>>

/** A `<label>`. Inside a `<Field.Root>` it is the field's label. */
export const Label = /* @__PURE__ */ component(
  "Label",
  function Label(props: LabelProps): ReactElement {
    const field = useContext(FieldContext) ?? undefined
    const made = useMemo(() => createLabel({ field }), [field])
    return usePart(made.label, "label", props)
  }
)

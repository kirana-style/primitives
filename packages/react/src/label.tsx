import { createLabel } from "@kirana-ui/core/label"
import { useContext, useMemo } from "react"
import type { ReactElement } from "react"

import { FieldContext } from "./field-context.ts"
import { usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** A `<label>`. Inside a `<Field.Root>` it is the field's label. */
export function Label(props: PartComponentProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const made = useMemo(() => createLabel({ field }), [field])
  return usePart(made.label, "label", props)
}

import { createLabel } from "@kirana-ui/core/label"
import { useContext } from "solid-js"
import type { JSX } from "solid-js"

import { FieldContext } from "./field-context.ts"
import { Part } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** A `<label>`. Inside a `<Field.Root>` it is the field's label. */
export function Label(props: PartComponentProps): JSX.Element {
  const made = createLabel({ field: useContext(FieldContext) })
  return <Part part={made.label} tag="label" {...props} />
}

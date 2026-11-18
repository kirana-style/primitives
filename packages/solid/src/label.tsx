import type { StateOf } from "@kirana-ui/core"
import { createLabel } from "@kirana-ui/core/label"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { useContext } from "solid-js"
import type { JSX } from "solid-js"

import { FieldContext } from "./field-context.ts"
import { Part } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type LabelProps = PartComponentProps<"label", StateOf<Vocabulary["label"]["label"]>>

/** A `<label>`. Inside a `<Field.Root>` it is the field's label. */
export function Label(props: LabelProps): JSX.Element {
  const made = createLabel({ field: useContext(FieldContext) })
  return <Part of={made.label} tag="label" {...props} />
}

import type { PartAttributes, StateFor } from "../types.ts"

/** A `<label>`. Inside a `<Field.Root>` it is the field's label. */
export type LabelProps = PartAttributes<"label", StateFor<"label", "label">>

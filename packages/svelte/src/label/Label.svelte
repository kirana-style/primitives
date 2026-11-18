<script lang="ts">
  import { createLabel } from "@kirana-ui/core/label"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import type { LabelProps } from "./types.ts"

  // A `<label>`. Inside a `<Field.Root>` it is the field's label.
  let props: LabelProps = $props()
  const made = createLabel({ field: useFieldAround() })
</script>

<Part of={made.label} tag="label" {...props} />

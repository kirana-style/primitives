<script lang="ts">
  import { createLabel } from "@kirana-ui/core/label"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import type { PartAttributes } from "../types.ts"

  // A `<label>`. Inside a `<Field.Root>` it is the field's label.
  let props: PartAttributes = $props()
  const made = createLabel({ field: useFieldAround() })
</script>

<Part part={made.label} tag="label" {...props} />

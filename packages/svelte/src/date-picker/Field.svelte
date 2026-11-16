<script lang="ts">
  import Part from "../Part.svelte"
  import { useDatePicker } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // The typed date: what holds its segments and its hidden input.
  let props: PartAttributes = $props()
  const controller = useDatePicker()
</script>

<Part part={controller.field.root} tag="div" {...props} />

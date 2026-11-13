<script lang="ts">
  import Part from "../Part.svelte"
  import { useCombobox } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // With `multiple`: what holds the chips and the input.
  let props: PartAttributes = $props()
  const controller = useCombobox()
</script>

<Part part={controller.chips} tag="div" {...props} />

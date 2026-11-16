<script lang="ts">
  import Part from "../Part.svelte"
  import { useCombobox } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // A line between groups.
  let props: PartAttributes = $props()
  const controller = useCombobox()
</script>

<Part part={controller.separator} tag="div" {...props} />

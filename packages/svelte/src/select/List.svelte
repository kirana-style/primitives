<script lang="ts">
  import Part from "../Part.svelte"
  import { useSelect } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // The items' own box inside the popup, when the popup also holds scroll arrows.
  let props: PartAttributes = $props()
  const controller = useSelect()
</script>

<Part part={controller.list} tag="div" {...props} />

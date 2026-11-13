<script lang="ts">
  import Part from "../Part.svelte"
  import { useScrollArea } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useScrollArea()
</script>

<Part part={controller.viewport} tag="div" {...props} />

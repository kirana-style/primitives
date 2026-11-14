<script lang="ts">
  import Part from "../Part.svelte"
  import { useCarousel } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useCarousel()
</script>

<Part part={controller.viewport} tag="div" {...props} />

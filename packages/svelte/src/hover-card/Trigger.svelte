<script lang="ts">
  import Part from "../Part.svelte"
  import { useHoverCard } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useHoverCard()
</script>

<Part part={controller.trigger} tag="a" {...props} />

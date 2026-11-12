<script lang="ts">
  import Part from "../Part.svelte"
  import { useTooltip } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useTooltip()
</script>

<Part part={controller.trigger} tag="button" {...props} />

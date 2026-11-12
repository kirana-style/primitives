<script lang="ts">
  import Part from "../Part.svelte"
  import { useTooltip } from "./context.ts"

  let props = $props()
  const controller = useTooltip()
</script>

<Part part={controller.arrow} tag="div" {...props} />

<script lang="ts">
  import Part from "../Part.svelte"
  import { useTooltip } from "./context.ts"
  import type { ArrowProps } from "./types.ts"

  let props: ArrowProps = $props()
  const controller = useTooltip()
</script>

<Part of={controller.arrow} tag="div" {...props} />

<script lang="ts">
  import Part from "../Part.svelte"
  import { useHoverCard } from "./context.ts"
  import type { ArrowProps } from "./types.ts"

  let props: ArrowProps = $props()
  const controller = useHoverCard()
</script>

<Part of={controller.arrow} tag="div" {...props} />

<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import { useTimeField } from "./context.ts"
  import type { SegmentsProps } from "./types.ts"

  // Its snippet once for each piece of the time, in the locale's order.
  let { children }: SegmentsProps = $props()
  const segments = fromSignal(useTimeField().segments)
</script>

{#each segments.current as segment (`${segment.index}-${segment.type}`)}{@render children(
    segment
  )}{/each}

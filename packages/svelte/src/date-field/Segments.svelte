<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import { useDateField } from "./context.ts"
  import type { SegmentsProps } from "./types.ts"

  // Its snippet once for each piece of the date, in the locale's order.
  let { children }: SegmentsProps = $props()
  const segments = fromSignal(useDateField().segments)
</script>

{#each segments.current as segment (`${segment.index}-${segment.type}`)}{@render children(
    segment
  )}{/each}

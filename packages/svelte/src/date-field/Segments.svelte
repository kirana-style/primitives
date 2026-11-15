<script lang="ts">
  import type { DateFieldSegment } from "@kirana-ui/core/date-field"
  import type { Snippet } from "svelte"

  import { fromSignal } from "../runtime.svelte.ts"
  import { useDateField } from "./context.ts"

  // Its snippet once for each piece of the date, in the locale's order.
  let { children }: { children: Snippet<[DateFieldSegment]> } = $props()
  const segments = fromSignal(useDateField().segments)
</script>

{#each segments.current as segment (`${segment.index}-${segment.type}`)}{@render children(
    segment
  )}{/each}

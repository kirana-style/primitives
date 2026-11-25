<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import { useRating } from "./context.ts"
  import type { ItemsProps } from "./types.ts"

  // Its snippet once for each item, given the item's place, from 1.
  let { children }: ItemsProps = $props()
  const places = fromSignal(useRating().places)
</script>

{#each places.current as place (place)}{@render children(place)}{/each}

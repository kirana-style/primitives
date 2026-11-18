<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import { usePagination } from "./context.ts"
  import type { ItemsProps } from "./types.ts"

  // Its snippet once for each piece of the row: a page, or the mark for pages left out.
  let { children }: ItemsProps = $props()
  const entries = fromSignal(usePagination().entries)
</script>

{#each entries.current as entry (entry.key)}{@render children(entry)}{/each}

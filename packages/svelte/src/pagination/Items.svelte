<script lang="ts">
  import type { PaginationEntry } from "@kirana-ui/core/pagination"
  import type { Snippet } from "svelte"

  import { fromSignal } from "../runtime.svelte.ts"
  import { usePagination } from "./context.ts"

  // Its snippet once for each piece of the row: a page, or the mark for pages left out.
  let { children }: { children: Snippet<[PaginationEntry]> } = $props()
  const entries = fromSignal(usePagination().entries)
</script>

{#each entries.current as entry (entry.key)}{@render children(entry)}{/each}

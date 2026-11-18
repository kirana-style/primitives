<script lang="ts">
  import { untrack } from "svelte"

  import { fromSignal } from "../runtime.svelte.ts"
  import { useCombobox } from "./context.ts"
  import type { CollectionProps } from "./types.ts"

  // Its snippet once for each item left of the root's `items`, or for each group that has
  // items left; with `of`, for each of that group's. It draws no element.
  let { of, children }: CollectionProps = $props()
  // A group is known by its key, which is its own for as long as it is drawn.
  const entries = fromSignal(useCombobox().entries(untrack(() => of)))
</script>

{#each entries.current as entry (entry.key)}{@render children(entry)}{/each}

<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import { useTagsInput } from "./context.ts"
  import type { ItemsProps } from "./types.ts"

  // Its snippet once for each tag, kept by the tag's key.
  let { children }: ItemsProps = $props()
  const entries = fromSignal(useTagsInput().entries)
</script>

{#each entries.current as entry (entry.key)}{@render children(entry)}{/each}

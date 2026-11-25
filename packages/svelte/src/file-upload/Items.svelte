<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import { useFileUpload } from "./context.ts"
  import type { ItemsProps } from "./types.ts"

  // Its snippet once for each file, kept by the file's key.
  let { children }: ItemsProps = $props()
  const entries = fromSignal(useFileUpload().entries)
</script>

{#each entries.current as entry (entry.key)}{@render children(entry)}{/each}

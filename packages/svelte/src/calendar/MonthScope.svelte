<script lang="ts">
  import type { Snippet } from "svelte"

  import { provideMonth } from "./context.ts"

  // Holds the parts of one month: they are that month's. Kept by its place.
  let { index, children }: { index: number; children: Snippet } = $props()
  // svelte-ignore state_referenced_locally
  provideMonth(index)
</script>

{@render children()}

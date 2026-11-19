<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import { useMonth } from "./context.ts"
  import type { WeeksProps } from "./types.ts"

  // Its snippet once for each week of the month shown.
  let { children }: WeeksProps = $props()
  const weeks = fromSignal(useMonth().weeks)
</script>

{#each weeks.current as week (week[0]!.date)}{@render children(week)}{/each}

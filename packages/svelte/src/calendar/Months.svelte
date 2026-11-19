<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import MonthScope from "./MonthScope.svelte"
  import { useCalendar } from "./context.ts"
  import type { MonthsProps } from "./types.ts"

  // Its snippet once for each month shown, side by side: the parts inside each are that
  // month's. Left out for one month.
  let { children }: MonthsProps = $props()
  const months = fromSignal(useCalendar().months)
</script>

{#each months.current as month (month.index)}<MonthScope index={month.index}
    >{@render children(month)}</MonthScope
  >{/each}

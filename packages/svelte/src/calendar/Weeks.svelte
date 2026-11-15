<script lang="ts">
  import type { CalendarDay } from "@kirana-ui/core/calendar"
  import type { Snippet } from "svelte"

  import { fromSignal } from "../runtime.svelte.ts"
  import { useCalendar } from "./context.ts"

  // Its snippet once for each week of the month shown.
  let { children }: { children: Snippet<[readonly CalendarDay[]]> } = $props()
  const weeks = fromSignal(useCalendar().weeks)
</script>

{#each weeks.current as week (week[0]!.date)}{@render children(week)}{/each}

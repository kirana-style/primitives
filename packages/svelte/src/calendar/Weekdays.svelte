<script lang="ts">
  import type { CalendarWeekday } from "@kirana-ui/core/calendar"
  import type { Snippet } from "svelte"

  import { fromSignal } from "../runtime.svelte.ts"
  import { useCalendar } from "./context.ts"

  // Its snippet once for each day of the week, in the locale's order.
  let { children }: { children: Snippet<[CalendarWeekday]> } = $props()
  const weekdays = fromSignal(useCalendar().weekdays)
</script>

{#each weekdays.current as weekday (weekday.index)}{@render children(weekday)}{/each}

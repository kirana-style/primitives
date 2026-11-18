<script lang="ts">
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCalendar } from "./context.ts"
  import type { WeekdaysProps } from "./types.ts"

  // Its snippet once for each day of the week, in the locale's order.
  let { children }: WeekdaysProps = $props()
  const weekdays = fromSignal(useCalendar().weekdays)
</script>

{#each weekdays.current as weekday (weekday.index)}{@render children(weekday)}{/each}

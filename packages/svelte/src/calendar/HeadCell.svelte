<script lang="ts">
  import type { CalendarWeekday } from "@kirana-ui/core/calendar"

  import Part from "../Part.svelte"
  import { useCalendar } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { weekday, ...rest }: { weekday: CalendarWeekday } & PartAttributes = $props()
  // svelte-ignore state_referenced_locally
  const part = useCalendar().headCell(weekday)
</script>

<Part {part} tag="th" {...rest} />

<script lang="ts">
  import Part from "../Part.svelte"
  import { cellDate, monthIndex, useCalendar } from "./context.ts"
  import type { DayProps } from "./types.ts"

  let { date, ...rest }: DayProps = $props()
  // It is its day for as long as it is in the page: its own, or its cell's.
  // svelte-ignore state_referenced_locally
  const day = date ?? cellDate()
  if (day === undefined) throw new Error("<Calendar.Day> needs a date or a <Calendar.Cell> around it")
  const part = useCalendar().day(day, monthIndex())
</script>

<Part of={part} tag="button" {...rest} />

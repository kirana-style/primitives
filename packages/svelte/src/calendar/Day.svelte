<script lang="ts">
  import Part from "../Part.svelte"
  import { useCalendar } from "./context.ts"
  import type { DayProps } from "./types.ts"

  let { date, ...rest }: DayProps = $props()
  // It is its day for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const part = useCalendar().day(date)
</script>

<Part of={part} tag="button" {...rest} />

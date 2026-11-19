<script lang="ts">
  import Part from "../Part.svelte"
  import { monthIndex, useCalendar } from "./context.ts"
  import type { CellProps } from "./types.ts"

  let { date, ...rest }: CellProps = $props()
  // It is its day for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const part = useCalendar().cell(date, monthIndex())
</script>

<Part of={part} tag="td" {...rest} />

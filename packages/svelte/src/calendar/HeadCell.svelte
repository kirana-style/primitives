<script lang="ts">
  import Part from "../Part.svelte"
  import { useCalendar } from "./context.ts"
  import type { HeadCellProps } from "./types.ts"

  let { weekday, ...rest }: HeadCellProps = $props()
  // svelte-ignore state_referenced_locally
  const part = useCalendar().headCell(weekday)
</script>

<Part of={part} tag="th" {...rest} />

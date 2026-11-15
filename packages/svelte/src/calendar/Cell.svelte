<script lang="ts">
  import Part from "../Part.svelte"
  import { useCalendar } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { date, ...rest }: { date: string } & PartAttributes = $props()
  // It is its day for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const part = useCalendar().cell(date)
</script>

<Part {part} tag="td" {...rest} />

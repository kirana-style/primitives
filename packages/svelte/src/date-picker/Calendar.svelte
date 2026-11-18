<script lang="ts">
  import Part from "../Part.svelte"
  import { useDatePicker } from "./context.ts"
  import type { CalendarProps } from "./types.ts"

  // The calendar: what holds its heading, its buttons and its grid.
  let props: CalendarProps = $props()
  const controller = useDatePicker()
</script>

<Part of={controller.calendar.root} tag="div" {...props} />

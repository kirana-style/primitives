<script lang="ts">
  import Part from "../Part.svelte"
  import { useDatePicker } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // The calendar: what holds its heading, its buttons and its grid.
  let props: PartAttributes = $props()
  const controller = useDatePicker()
</script>

<Part part={controller.calendar.root} tag="div" {...props} />

<script lang="ts">
  import Part from "../Part.svelte"
  import { useCalendar } from "./context.ts"
  import type { GridProps } from "./types.ts"

  let props: GridProps = $props()
  const controller = useCalendar()
</script>

<Part of={controller.grid} tag="table" {...props} />

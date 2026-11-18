<script lang="ts">
  import Part from "../Part.svelte"
  import { useCalendar } from "./context.ts"
  import type { PreviousProps } from "./types.ts"

  let props: PreviousProps = $props()
  const controller = useCalendar()
</script>

<Part of={controller.previous} tag="button" {...props} />

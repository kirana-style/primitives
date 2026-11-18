<script lang="ts">
  import Part from "../Part.svelte"
  import { useCalendar } from "./context.ts"
  import type { NextProps } from "./types.ts"

  let props: NextProps = $props()
  const controller = useCalendar()
</script>

<Part of={controller.next} tag="button" {...props} />

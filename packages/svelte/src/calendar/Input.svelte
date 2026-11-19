<script lang="ts">
  import Part from "../Part.svelte"
  import { useCalendar } from "./context.ts"
  import type { InputProps } from "./types.ts"

  // The hidden input the value is submitted by, when the root has a `name`.
  let props: InputProps = $props()
  const controller = useCalendar()
</script>

<Part of={controller.input} tag="input" {...props} />

<script lang="ts">
  import Part from "../Part.svelte"
  import { useDatePicker } from "./context.ts"
  import type { ClearProps } from "./types.ts"

  // Empties the value, and gives focus to the field. Disabled while there is none.
  let props: ClearProps = $props()
  const controller = useDatePicker()
</script>

<Part of={controller.clear} tag="button" {...props} />

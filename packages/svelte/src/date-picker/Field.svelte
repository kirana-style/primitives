<script lang="ts">
  import Part from "../Part.svelte"
  import { useDatePicker } from "./context.ts"
  import type { FieldProps } from "./types.ts"

  // The typed date: what holds its segments and its hidden input.
  let props: FieldProps = $props()
  const controller = useDatePicker()
</script>

<Part of={controller.field.root} tag="div" {...props} />

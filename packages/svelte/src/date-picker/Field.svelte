<script lang="ts">
  import Part from "../Part.svelte"
  import { provide as provideField } from "../date-field/context.ts"
  import { useDatePicker } from "./context.ts"
  import type { FieldProps } from "./types.ts"

  // The typed date: what holds its segments and its hidden input. With `mode="range"` there are
  // two, `range="start"` and `range="end"`, each giving its own parts their field.
  let { range, ...props }: FieldProps = $props()
  const controller = useDatePicker()
  // Its end is the one it was drawn for.
  // svelte-ignore state_referenced_locally
  const field = provideField((range === "end" && controller.endField) || controller.field)
</script>

<Part of={field.root} tag="div" {...props} />

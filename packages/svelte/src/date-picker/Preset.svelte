<script lang="ts">
  import Part from "../Part.svelte"
  import { useDatePicker } from "./context.ts"
  import type { PresetProps } from "./types.ts"

  // Makes the value the one it is given: pressed while it is.
  let { value, ...rest }: PresetProps = $props()
  // The value it gives is the one it was drawn with.
  // svelte-ignore state_referenced_locally
  const part = useDatePicker().preset(value)
</script>

<Part of={part} tag="button" {...rest} />

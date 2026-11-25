<script lang="ts">
  import Part from "../Part.svelte"
  import { useColorPicker } from "./context.ts"
  import type { SwatchTriggerProps } from "./types.ts"

  let { value, ...rest }: SwatchTriggerProps = $props()
  const controller = useColorPicker()
  const part = $derived(controller.swatchTrigger(value))
</script>

<Part of={part} tag="button" {...rest} />

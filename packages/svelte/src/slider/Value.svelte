<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useSlider } from "./context.ts"

  // The written value, or what `children`, a snippet given the text and the values, makes of it.
  let { children, ...rest } = $props()
  const controller = useSlider()
  const text = fromSignal(controller.text)
  const values = fromSignal(controller.values)
</script>

<Part part={controller.value} tag="output" {...rest}>
  {#if children}{@render children(text.current, values.current)}{:else}{text.current}{/if}
</Part>

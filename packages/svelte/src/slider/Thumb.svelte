<script lang="ts">
  import Part from "../Part.svelte"
  import { useSlider } from "./context.ts"

  // `index` is which value of a range the thumb is, from 0.
  let { index = 0, children, ...rest } = $props()
  const controller = useSlider()
  // A thumb is its index for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const part = controller.thumb(index)
  // svelte-ignore state_referenced_locally
  const input = controller.thumbInput(index)
</script>

<Part {part} tag="div" {...rest}>
  {@render children?.()}<Part part={input} tag="input" />
</Part>

<script lang="ts">
  import Part from "../Part.svelte"
  import { useSlider } from "./context.ts"
  import type { ThumbProps } from "./types.ts"

  // `index` is which value of a range the thumb is, from 0. A thumb that is given none takes
  // its place among the slider's thumbs, in the order they are written.
  let { index, children, ...rest }: ThumbProps = $props()
  const generated = $props.id()
  const controller = useSlider()
  // A thumb is its index for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const at = index ?? generated
  const part = controller.thumb(at)
  const input = controller.thumbInput(at)
</script>

<!-- The native input is the part's own, not its content: with `child` the caller's element is
     the caller's to draw, so the snippet is given `input` to render inside it, last, where
     every other adapter keeps it. A snippet that leaves it out draws a control no form reads. -->
{#snippet held()}<Part of={input} tag="input" />{/snippet}

<Part of={part} tag="div" {...rest} held={{ input: held }}>
  {@render children?.()}<Part of={input} tag="input" />
</Part>

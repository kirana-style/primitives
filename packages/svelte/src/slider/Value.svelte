<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useSlider } from "./context.ts"
  import type { ValueProps } from "./types.ts"

  // The written value, or what `children`, a snippet given the text and the values, makes of it.
  let { children, ...rest }: ValueProps = $props()
  const controller = useSlider()
  const text = fromSignal(controller.text)
  const values = fromSignal(controller.values)
</script>

<!-- The text is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{#if children}{@render children(text.current, values.current)}{:else}{text.current}{/if}{/snippet}

<Part of={controller.value} tag="output" {...rest} held={{ text: written }}>{@render written()}</Part>

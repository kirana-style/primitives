<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useColorPicker } from "./context.ts"
  import type { ValueTextProps } from "./types.ts"

  // Says the colour in its format unless it is given children.
  let { children, ...rest }: ValueTextProps = $props()
  const controller = useColorPicker()
  const text = fromSignal(controller.text)
</script>

<!-- The text is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{#if children}{@render children()}{:else}{text.current}{/if}{/snippet}

<Part of={controller.valueText} tag="span" {...rest} held={{ text: written }}>{@render written()}</Part>

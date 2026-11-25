<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useColorPicker } from "./context.ts"
  import type { FormatTriggerProps } from "./types.ts"

  // Says the format the colour is written in unless it is given children.
  let { children, ...rest }: FormatTriggerProps = $props()
  const controller = useColorPicker()
  const format = fromSignal(controller.format)
</script>

<!-- The text is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{#if children}{@render children()}{:else}{format.current}{/if}{/snippet}

<Part of={controller.formatTrigger} tag="button" {...rest} held={{ text: written }}>{@render written()}</Part>

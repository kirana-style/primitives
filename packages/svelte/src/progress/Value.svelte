<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useProgress } from "./context.ts"
  import type { ValueProps } from "./types.ts"

  // The written value, or what `children`, a snippet given the text, makes of it.
  let { children, ...rest }: ValueProps = $props()
  const controller = useProgress()
  const text = fromSignal(controller.text)
</script>

<!-- The text is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{#if children}{@render children(text.current)}{:else}{text.current}{/if}{/snippet}

<Part of={controller.value} tag="span" {...rest} held={{ text: written }}>{@render written()}</Part>

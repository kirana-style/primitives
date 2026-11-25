<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useEditable } from "./context.ts"
  import type { PreviewProps } from "./types.ts"

  // The text, or the placeholder while there is none, unless it is given children.
  let { children, ...rest }: PreviewProps = $props()
  const controller = useEditable()
  const text = fromSignal(controller.text)
</script>

<!-- The text is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{text.current}{/snippet}

<Part of={controller.preview} tag="span" {...rest} held={{ text: written }}>{#if children}{@render children()}{:else}{text.current}{/if}</Part>

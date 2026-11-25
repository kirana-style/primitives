<script lang="ts">
  import Part from "../Part.svelte"
  import { useEntry, useTagsInput } from "./context.ts"
  import type { ItemTextProps } from "./types.ts"

  // The tag's text, unless it is given children.
  let { children, ...rest }: ItemTextProps = $props()
  const entry = useEntry("ItemText")
  const part = useTagsInput().itemText(entry().key)
</script>

<!-- The text is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{entry().value}{/snippet}

<Part of={part} tag="span" {...rest} held={{ text: written }}>{#if children}{@render children()}{:else}{entry().value}{/if}</Part>

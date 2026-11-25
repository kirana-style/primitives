<script lang="ts">
  import Part from "../Part.svelte"
  import { useEntry, useFileUpload } from "./context.ts"
  import type { ItemNameProps } from "./types.ts"

  // The file's name, unless it is given children.
  let { children, ...rest }: ItemNameProps = $props()
  const entry = useEntry("ItemName")
  const part = useFileUpload().itemName(entry().key)
</script>

<!-- The name is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{entry().file.name}{/snippet}

<Part of={part} tag="span" {...rest} held={{ text: written }}>{#if children}{@render children()}{:else}{entry().file.name}{/if}</Part>

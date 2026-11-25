<script lang="ts">
  import { formatBytes } from "@kirana-ui/core/file-upload"

  import Part from "../Part.svelte"
  import { useEntry, useFileUpload } from "./context.ts"
  import type { ItemSizeProps } from "./types.ts"

  // The file's size as people read one, unless it is given children.
  let { locale, children, ...rest }: ItemSizeProps = $props()
  const entry = useEntry("ItemSize")
  const part = useFileUpload().itemSize(entry().key)
  const size = $derived(formatBytes(entry().file.size, locale))
</script>

<!-- The size is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{size}{/snippet}

<Part of={part} tag="span" {...rest} held={{ text: written }}>{#if children}{@render children()}{:else}{size}{/if}</Part>

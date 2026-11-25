<script lang="ts">
  import Part from "../Part.svelte"
  import { useFileUpload } from "./context.ts"
  import type { DropzoneProps } from "./types.ts"

  let { children, ...rest }: DropzoneProps = $props()
  const controller = useFileUpload()
</script>

<!-- The native file input is the part's own, not its content: with `child` the caller's
     element is the caller's to draw, so the snippet is given `input` to render inside it,
     last, where every other adapter keeps it. -->
{#snippet input()}<Part of={controller.input} tag="input" />{/snippet}

<Part of={controller.dropzone} tag="div" {...rest} held={{ input }}>
  {@render children?.()}<Part of={controller.input} tag="input" />
</Part>

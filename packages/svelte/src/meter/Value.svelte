<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useMeter } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // The written value, or what `children`, a snippet given the text, makes of it.
  let { children, ...rest }: PartAttributes = $props()
  const controller = useMeter()
  const text = fromSignal(controller.text)
</script>

<Part part={controller.value} tag="span" {...rest}>
  {#if children}{@render children(text.current)}{:else}{text.current}{/if}
</Part>

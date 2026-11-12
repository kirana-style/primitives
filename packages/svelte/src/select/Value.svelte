<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useSelect } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // `placeholder` shows while nothing is chosen.
  let { placeholder = "", children, ...rest }: { placeholder?: string } & PartAttributes = $props()
  const controller = useSelect()
  const label = fromSignal(controller.label)
</script>

<Part part={controller.valuePart} tag="span" {...rest}>
  {#if children}{@render children()}{:else}{label.current ?? placeholder}{/if}
</Part>

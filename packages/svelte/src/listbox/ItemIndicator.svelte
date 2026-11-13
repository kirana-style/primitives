<script lang="ts">
  import { getContext } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { ITEM, useListbox } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { keepMounted = false, ...rest }: { keepMounted?: boolean } & PartAttributes = $props()
  const controller = useListbox()
  const value = getContext(ITEM)
  const selected = fromSignal(controller.selected(value))
  const part = controller.indicator(value)
</script>

{#if selected.current || keepMounted}
  <Part {part} tag="span" {...rest} />
{/if}

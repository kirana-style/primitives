<script lang="ts">
  import { getContext } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { ITEM, useCombobox } from "./context.ts"
  import type { ItemIndicatorProps } from "./types.ts"

  let { keepMounted = false, ...rest }: ItemIndicatorProps = $props()
  const controller = useCombobox()
  const value = getContext(ITEM)
  const selected = fromSignal(controller.selected(value))
  const part = controller.itemIndicator(value)
</script>

{#if selected.current || keepMounted}
  <Part of={part} tag="span" {...rest} />
{/if}

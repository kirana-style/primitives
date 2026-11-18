<script lang="ts">
  import { getContext } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { RADIO_ITEM, useRadioGroup } from "./context.ts"
  import type { RadioItemIndicatorProps } from "./types.ts"

  let { keepMounted = false, ...rest }: RadioItemIndicatorProps = $props()
  const group = useRadioGroup()
  const value = getContext(RADIO_ITEM)
  const checked = fromSignal(group.checked(value))
  const part = group.indicator(value)
</script>

{#if checked.current || keepMounted}
  <Part of={part} tag="span" {...rest} />
{/if}

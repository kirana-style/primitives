<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCheckbox } from "./context.ts"
  import type { CheckboxItemIndicatorProps } from "./types.ts"

  let { keepMounted = false, ...rest }: CheckboxItemIndicatorProps = $props()
  const item = useCheckbox()
  const checked = fromSignal(item.checked)
</script>

{#if checked.current || keepMounted}
  <Part of={item.indicator} tag="span" {...rest} />
{/if}

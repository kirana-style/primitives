<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCheckbox } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { keepMounted = false, ...rest }: { keepMounted?: boolean } & PartAttributes = $props()
  const item = useCheckbox()
  const checked = fromSignal(item.checked)
</script>

{#if checked.current || keepMounted}
  <Part part={item.indicator} tag="span" {...rest} />
{/if}

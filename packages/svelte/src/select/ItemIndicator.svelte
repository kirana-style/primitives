<script lang="ts">
  import { getContext } from "svelte"

  import { fromSignal } from "../runtime.svelte.ts"
  import { ITEM, useSelect } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { keepMounted = false, children, ...rest }: PartAttributes = $props()
  const selected = fromSignal(useSelect().selected(getContext(ITEM)))
</script>

{#if selected.current || keepMounted}
  <span aria-hidden="true" {...rest}>{@render children?.()}</span>
{/if}

<script lang="ts">
  import Part from "../Part.svelte"
  import Outlet from "../Portal.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useItem, useNavigation } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // An item's content: drawn in `<NavigationMenu.Viewport>`, while it is shown.
  let { children, ...rest }: PartAttributes = $props()
  const item = useItem()
  const mounted = fromSignal(item.mounted)
  const viewport = fromSignal(useNavigation().viewportElement)
</script>

{#snippet content()}
  <Part part={item.content} tag="div" {...rest} {children} />
{/snippet}

{#if viewport.current}
  <Outlet mounted={mounted.current} into={viewport.current} children={content} />
{/if}

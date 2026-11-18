<script lang="ts">
  import Part from "../Part.svelte"
  import Outlet from "../Portal.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useItem, useNavigation } from "./context.ts"
  import type { ContentProps } from "./types.ts"

  // An item's content: drawn in `<NavigationMenu.Viewport>`, while it is shown.
  let { children, ...rest }: ContentProps = $props()
  const item = useItem()
  const mounted = fromSignal(item.mounted)
  const viewport = fromSignal(useNavigation().viewportElement)
</script>

{#snippet content()}
  <Part of={item.content} tag="div" {...rest} {children} />
{/snippet}

{#if viewport.current}
  <Outlet mounted={mounted.current} into={viewport.current} children={content} />
{/if}

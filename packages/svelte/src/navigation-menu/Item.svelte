<script lang="ts">
  import { untrack } from "svelte"
  import type { Snippet } from "svelte"

  import { provideItem, useNavigation } from "./context.ts"

  // `value` tells this item from the others; an item that is only a link needs none.
  let { value, children }: { value?: unknown; children?: Snippet } = $props()
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = value === undefined ? undefined : provideItem(useNavigation().item(value))
  $effect(() => untrack(() => item?.mount()))
</script>

<li>{@render children?.()}</li>

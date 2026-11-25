<script lang="ts">
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { ITEM, useSteps } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  let { index, ...rest }: ItemProps = $props()
  // An item is its step for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = useSteps().item(index)
  setContext(ITEM, item.index)
</script>

<Part of={item} tag="div" {...rest} />

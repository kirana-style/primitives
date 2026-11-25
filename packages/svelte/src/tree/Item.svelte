<script lang="ts">
  import { defined } from "@kirana-ui/core"
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { provideItem, provideLevel, useLevel, useTree } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  let { value, branch, disabled, loading, label, ...rest }: ItemProps = $props()
  const level = provideLevel(useLevel() + 1)
  const options = toSignal(() => ({ branch, disabled, loading, label, level }))
  // A node is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = provideItem(useTree().item(value, () => defined(options.get())))
  $effect(() => untrack(() => item.mount()))
</script>

<Part of={item.root} tag="div" {...rest} />

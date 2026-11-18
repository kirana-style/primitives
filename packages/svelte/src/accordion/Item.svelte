<script lang="ts">
  import { defined } from "@kirana-ui/core"
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { provideItem, useAccordion } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  // `value` tells this item from the others; an item that is given none makes its own.
  let { value, disabled, ...rest }: ItemProps = $props()
  const generated = $props.id()
  const options = toSignal(() => ({ disabled }))
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = provideItem(
    useAccordion().item(value === undefined ? generated : value, () => defined(options.get()))
  )
  $effect(() => untrack(() => item.mount()))
</script>

<Part of={item.root} tag="div" {...rest} />

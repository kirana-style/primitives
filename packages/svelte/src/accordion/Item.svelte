<script lang="ts">
  import type { AccordionItemOptions } from "@kirana-ui/core/accordion"
  import { defined } from "@kirana-ui/core"
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { provideItem, useAccordion } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { value, disabled, ...rest }: { value: unknown } & AccordionItemOptions & PartAttributes = $props()
  const options = toSignal(() => ({ disabled }))
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = provideItem(useAccordion().item(value, () => defined(options.get())))
  $effect(() => untrack(() => item.mount()))
</script>

<Part part={item.root} tag="div" {...rest} />

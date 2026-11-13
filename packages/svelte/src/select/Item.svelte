<script lang="ts">
  import type { SelectItemOptions } from "@kirana-ui/core/select"
  import { defined } from "@kirana-ui/core"
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { ITEM, useSelect } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // `label` is what typeahead matches and the trigger shows; the item's text when left out.
  let { value, disabled, label, index, ...rest }: { value: unknown } & SelectItemOptions & PartAttributes = $props()
  const options = toSignal(() => ({ disabled, label, index }))
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = value
  const part = useSelect().item(item, () => defined(options.get()))
  setContext(ITEM, item)
</script>

<Part {part} tag="div" {...rest} />

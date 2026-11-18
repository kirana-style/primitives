<script lang="ts">
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { ITEM, useCombobox, useGroup } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  // `label` is what is filtered and what the input shows; the item's text when left out.
  let { value, disabled, label, id, index, ...rest }: ItemProps = $props()
  const generated = $props.id()
  const options = toSignal(() => ({ disabled, label, index, id: id ?? generated }))
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = value
  const part = useCombobox().item(item, () => options.get(), useGroup())
  setContext(ITEM, item)
</script>

<Part of={part} tag="div" {...rest} />

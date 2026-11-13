<script lang="ts">
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { ITEM, useCombobox } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // `label` is what is filtered and what the input shows; the item's text when left out.
  let { value, disabled, label, id, ...rest }: { value: unknown; disabled?: boolean; label?: string; id?: string } & PartAttributes = $props()
  const generated = $props.id()
  const options = toSignal(() => ({ disabled, label, id: id ?? generated }))
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = value
  const part = useCombobox().item(item, () => options.get())
  setContext(ITEM, item)
</script>

<Part {part} tag="div" {...rest} />

<script lang="ts">
  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useCommand, useGroup } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // `label` is what is filtered, the item's text when left out; `keywords` are other words for it.
  let {
    value,
    disabled,
    label,
    keywords,
    id,
    ...rest
  }: {
    value: string
    disabled?: boolean
    label?: string
    keywords?: readonly string[]
    id?: string
  } & PartAttributes = $props()
  const generated = $props.id()
  const options = toSignal(() => ({ disabled, label, keywords, id: id ?? generated }))
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const part = useCommand().item(value, () => options.get(), useGroup())
</script>

<Part {part} tag="div" {...rest} />

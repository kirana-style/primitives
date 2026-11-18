<script lang="ts">
  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useCommand, useGroup } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  // `label` is what is filtered, the item's text when left out; `keywords` are other words for it.
  let {
    value,
    disabled,
    label,
    keywords,
    id,
    ...rest
  }: ItemProps = $props()
  const generated = $props.id()
  const options = toSignal(() => ({ disabled, label, keywords, id: id ?? generated }))
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const part = useCommand().item(value, () => options.get(), useGroup())
</script>

<Part of={part} tag="div" {...rest} />

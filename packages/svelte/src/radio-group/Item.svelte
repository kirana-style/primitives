<script lang="ts">
  import { defined } from "@kirana-ui/core"
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { ITEM, useRadioGroup } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  let { value, disabled, id, children, ...rest }: ItemProps = $props()
  const options = toSignal(() => ({ disabled, id }))
  const read = () => defined(options.get())
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = value
  const group = useRadioGroup()
  const part = group.item(item, read)
  const input = group.itemInput(item, read)
  setContext(ITEM, item)
</script>

<!-- The native input is the part's own, not its content: with `child` the caller's element is
     the caller's to draw, so the snippet is given `input` to render inside it, last, where
     every other adapter keeps it. A snippet that leaves it out draws a control no form reads. -->
{#snippet held()}<Part of={input} tag="input" />{/snippet}

<Part of={part} tag="span" {...rest} held={{ input: held }}>
  {@render children?.()}<Part of={input} tag="input" />
</Part>

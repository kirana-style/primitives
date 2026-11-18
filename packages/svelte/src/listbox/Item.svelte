<script lang="ts">
  import { defined } from "@kirana-ui/core"
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { ITEM, useListbox } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  let { value, disabled, label, index, ...rest }: ItemProps = $props()
  const options = toSignal(() => ({ disabled, label, index }))
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = value
  const part = useListbox().item(item, () => defined(options.get()))
  setContext(ITEM, item)
</script>

<Part of={part} tag="div" {...rest} />

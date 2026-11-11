<script lang="ts">
  import { defined } from "@kirana-ui/core"
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { ITEM, useRadioGroup } from "./context.ts"

  let { value, disabled, children, ...rest } = $props()
  const options = toSignal(() => ({ disabled }))
  const read = () => defined(options.get())
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = value
  const group = useRadioGroup()
  const part = group.item(item, read)
  const input = group.itemInput(item, read)
  setContext(ITEM, item)
</script>

<Part {part} tag="span" {...rest}>
  {@render children?.()}<Part part={input} tag="input" />
</Part>

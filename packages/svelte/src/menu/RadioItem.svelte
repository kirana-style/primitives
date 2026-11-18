<script lang="ts">
  import { defined } from "@kirana-ui/core"
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { RADIO_ITEM, useRadioGroup } from "./context.ts"
  import type { RadioItemProps } from "./types.ts"

  let { value, disabled, label, closeOnClick, ...rest }: RadioItemProps = $props()
  const options = toSignal(() => ({ disabled, label, closeOnClick }))
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = value
  const part = useRadioGroup().item(item, () => defined(options.get()))
  setContext(RADIO_ITEM, item)
</script>

<Part of={part} tag="div" {...rest} />

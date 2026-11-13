<script lang="ts">
  import type { MenuItemOptions } from "@kirana-ui/core/menu"
  import { defined } from "@kirana-ui/core"
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { RADIO_ITEM, useRadioGroup } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { value, disabled, label, closeOnClick, ...rest }: { value: unknown } & MenuItemOptions & PartAttributes = $props()
  const options = toSignal(() => ({ disabled, label, closeOnClick }))
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = value
  const part = useRadioGroup().item(item, () => defined(options.get()))
  setContext(RADIO_ITEM, item)
</script>

<Part {part} tag="div" {...rest} />

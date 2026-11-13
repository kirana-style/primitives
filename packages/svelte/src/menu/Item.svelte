<script lang="ts">
  import type { MenuItemOptions } from "@kirana-ui/core/menu"
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useMenu } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { disabled, label, closeOnClick, ...rest }: MenuItemOptions & PartAttributes = $props()
  const options = toSignal(() => ({ disabled, label, closeOnClick }))
  const part = useMenu().item(() => defined(options.get()))
</script>

<Part {part} tag="div" {...rest} />

<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createTooltip } from "@kirana-ui/core/tooltip"

  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let {
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    delay,
    closeDelay,
    disabled,
    id,
    children,
  }: PartAttributes = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  provide(
    controller(createTooltip, () => ({
      id: id ?? generated,
      open,
      defaultOpen,
      delay,
      closeDelay,
      disabled,
      onOpenChange: change,
    }))
  )
</script>

{@render children?.()}

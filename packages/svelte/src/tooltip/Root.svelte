<script lang="ts">
  import type { TooltipProps } from "@kirana-ui/core/tooltip"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createTooltip } from "@kirana-ui/core/tooltip"

  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    delay,
    closeDelay,
    disabled,
    id,
    children,
  }: RootProps<TooltipProps> = $props()
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

<script lang="ts">
  import type { HoverCardProps } from "@kirana-ui/core/hover-card"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createHoverCard } from "@kirana-ui/core/hover-card"

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
  }: RootProps<HoverCardProps> = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  provide(
    controller(createHoverCard, () => ({
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

<script lang="ts">
  import type { DrawerProps } from "@kirana-ui/core/drawer"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createDrawer } from "@kirana-ui/core/drawer"

  import { provide } from "../dialog/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import type { RootProps } from "../types.ts"

  // A dialog that comes from an edge and is dragged back to it.
  let {
    open = $bindable(),
    defaultOpen,
    modal,
    dismissible,
    swipeDirection,
    onOpenChange,
    id,
    children,
  }: RootProps<DrawerProps> = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  provide(
    controller(createDrawer, () => ({
      id: id ?? generated,
      open,
      defaultOpen,
      modal,
      dismissible,
      swipeDirection,
      onOpenChange: change,
    }))
  )
</script>

{@render children?.()}

<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { within } from "@kirana-ui/core"
  import { createDrawer } from "@kirana-ui/core/drawer"

  import { provide } from "../dialog/context.ts"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import type { RootProps } from "./types.ts"

  // A dialog that comes from an edge and is dragged back to it.
  let {
    open = $bindable(),
    defaultOpen,
    modal,
    disablePointerDismissal,
    closeOnOutsidePress,
    dismissible,
    swipeDirection,
    snapPoints,
    snapPoint = $bindable(),
    defaultSnapPoint,
    onSnapPointChange,
    onOpenChange,
    id,
    children,
  }: RootProps = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  function rest(next: number | string, by: ChangeDetails) {
    onSnapPointChange?.(next, by)
    // Written back only to a caller who holds it.
    if (!by.canceled && snapPoint !== undefined) snapPoint = next
  }

  provide(
    controller(within(createDrawer, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      open,
      defaultOpen,
      modal,
      disablePointerDismissal,
      closeOnOutsidePress,
      dismissible,
      swipeDirection,
      snapPoints,
      snapPoint,
      defaultSnapPoint,
      onSnapPointChange: rest,
      onOpenChange: change,
    }))
  )
</script>

{@render children?.()}
